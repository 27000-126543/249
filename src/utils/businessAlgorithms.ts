
import dayjs, { Dayjs } from 'dayjs';
import type { Route, Bus, Driver, SchedulePlan, RosterEntry, PassengerHeatmapData, ChargingPile, RepairTicket } from '@/types';

export interface ScheduleRecommendation {
  busCount: number;
  departureTimes: string[];
  estimatedLoadFactor: number;
  estimatedOnTimeRate: number;
  totalTrips: number;
}

export interface SchedulingParams {
  routeId: string;
  startTime: Dayjs;
  endTime: Dayjs;
  intervalMinutes: number;
  busType: 'electric' | 'diesel' | 'hybrid';
  route: Route;
  buses: Bus[];
  historicalPassengerData?: number[];
  trafficCondition?: 'smooth' | 'moderate' | 'congested';
}

export const calculateScheduleRecommendation = (params: SchedulingParams): ScheduleRecommendation => {
  const { startTime, endTime, intervalMinutes, route, busType, trafficCondition = 'moderate' } = params;

  const duration = endTime.diff(startTime, 'minute');
  const totalTrips = Math.ceil(duration / intervalMinutes);

  const oneWayDuration = route.estimatedDuration || 60;
  const roundTripDuration = oneWayDuration * 2;
  const busesNeeded = Math.ceil((roundTripDuration / intervalMinutes) * 1.2);

  const typeMultiplier: Record<string, number> = {
    electric: 0.9,
    diesel: 1.0,
    hybrid: 0.95,
  };

  const trafficMultiplier: Record<string, number> = {
    smooth: 0.9,
    moderate: 1.0,
    congested: 1.3,
  };

  const adjustedBuses = Math.ceil(busesNeeded * typeMultiplier[busType] * trafficMultiplier[trafficCondition]);

  const departureTimes: string[] = [];
  let currentTime = startTime.clone();
  for (let i = 0; i < totalTrips; i++) {
    departureTimes.push(currentTime.format('HH:mm'));
    currentTime = currentTime.add(intervalMinutes, 'minute');
  }

  const peakHourMultiplier = Math.max(...departureTimes.map(time => {
    const hour = parseInt(time.split(':')[0]);
    if ((hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19)) return 1.5;
    if (hour >= 6 && hour <= 22) return 1.0;
    return 0.5;
  }));

  const estimatedLoadFactor = Math.min(95, Math.round(route.designCapacity * 0.6 * peakHourMultiplier * typeMultiplier[busType]));
  const estimatedOnTimeRate = Math.min(98, Math.round(95 / trafficMultiplier[trafficCondition]));

  return {
    busCount: adjustedBuses,
    departureTimes,
    estimatedLoadFactor,
    estimatedOnTimeRate,
    totalTrips,
  };
};

export interface RosterGenerationParams {
  drivers: Driver[];
  schedulePlan: SchedulePlan;
  route: Route;
  weekStartDate: Dayjs;
}

export interface DriverWorkload {
  driverId: string;
  weeklyHours: number;
  consecutiveDays: number;
  lastDayOff?: Dayjs;
  skills: string[];
}

export const generateSmartRoster = (params: RosterGenerationParams): RosterEntry[] => {
  const { drivers, schedulePlan, route, weekStartDate } = params;
  const roster: RosterEntry[] = [];

  const departureTimes = schedulePlan.trips?.map(t => t.departureTime) || [];
  const tripsPerDay = departureTimes.length;
  const busCount = schedulePlan.busCount || 5;

  const eligibleDrivers = drivers.filter(d => {
    if (d.status !== 'on') return false;
    if (d.licenseLevel === 'A1' && route.vehicleType === 'large') return true;
    if (d.licenseLevel === 'A3' && route.vehicleType === 'medium') return true;
    if (d.skills?.includes(route.id)) return true;
    return true;
  });

  const driverWorkloads: Map<string, DriverWorkload> = new Map();
  eligibleDrivers.forEach(d => {
    driverWorkloads.set(d.id, {
      driverId: d.id,
      weeklyHours: 0,
      consecutiveDays: 0,
      skills: d.skills || [],
    });
  });

  const MAX_DAILY_HOURS = 8;
  const MAX_WEEKLY_HOURS = 44;
  const MIN_REST_HOURS = 12;

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDate = weekStartDate.add(dayOffset, 'day');
    const dateStr = currentDate.format('YYYY-MM-DD');
    const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;

    const dayDrivers = [...eligibleDrivers].sort((a, b) => {
      const wlA = driverWorkloads.get(a.id)!;
      const wlB = driverWorkloads.get(b.id)!;
      if (wlA.consecutiveDays >= 5) return 1;
      if (wlB.consecutiveDays >= 5) return -1;
      return wlA.weeklyHours - wlB.weeklyHours;
    });

    const assignedToday = new Set<string>();
    let busIndex = 0;

    for (let tripIndex = 0; tripIndex < tripsPerDay; tripIndex++) {
      const departureTime = departureTimes[tripIndex];
      const [hours, minutes] = departureTime.split(':').map(Number);
      const tripDuration = (route.estimatedDuration || 60) * 2;
      const tripEndHours = hours + Math.ceil(tripDuration / 60);

      const availableDrivers = dayDrivers.filter(d => {
        if (assignedToday.has(d.id)) {
          const lastTrip = roster.filter(r => r.driverId === d.id && r.date === dateStr).pop();
          if (lastTrip) {
            const [lastH, lastM] = lastTrip.departureTime.split(':').map(Number);
            const lastEndHour = lastH + Math.ceil(tripDuration / 60);
            if (hours - lastEndHour < 2) return false;
          }
        }

        const wl = driverWorkloads.get(d.id)!;
        const projectedHours = wl.weeklyHours + (tripEndHours - hours);
        if (projectedHours > MAX_WEEKLY_HOURS) return false;
        if (wl.consecutiveDays >= 5 && !isWeekend) return false;

        return true;
      });

      if (availableDrivers.length === 0) continue;

      const selectedDriver = availableDrivers[0];
      assignedToday.add(selectedDriver.id);

      const wl = driverWorkloads.get(selectedDriver.id)!;
      wl.weeklyHours += (tripEndHours - hours);
      wl.consecutiveDays += 1;

      roster.push({
        id: `roster_${dateStr}_${tripIndex}`,
        driverId: selectedDriver.id,
        routeId: route.id,
        busId: `bus${(busIndex % busCount) + 1}`,
        date: dateStr,
        departureTime,
        shiftType: hours < 10 ? 'morning' : hours < 16 ? 'middle' : 'evening',
        status: 'scheduled',
        tripIds: [],
        workHours: tripEndHours - hours,
      });

      busIndex++;
    }

    eligibleDrivers.forEach(d => {
      if (!assignedToday.has(d.id)) {
        const wl = driverWorkloads.get(d.id)!;
        wl.consecutiveDays = 0;
        wl.lastDayOff = currentDate;
      }
    });
  }

  return roster;
};

export interface StationPassengerData {
  stationId: string;
  stationName: string;
  boardings: number;
  alightings: number;
  peakBoardings: number;
  timeDistribution: number[];
}

export const calculatePassengerHeatmap = (
  route: Route,
  dateRange: { start: Dayjs; end: Dayjs },
  historicalMultiplier = 1.0
): PassengerHeatmapData[] => {
  const heatmapData: PassengerHeatmapData[] = [];
  const stations = route.stations || [];

  const totalDays = dateRange.end.diff(dateRange.start, 'day') + 1;

  stations.forEach((station, index) => {
    const distanceFromCenter = Math.abs(index - stations.length / 2);
    const centerBonus = Math.max(0.5, 1.5 - distanceFromCenter / stations.length);

    const isTransferStation = station.includes('换乘') || station.includes('枢纽') || index === 0 || index === stations.length - 1;
    const transferBonus = isTransferStation ? 1.8 : 1.0;

    const baseBoardings = Math.round(120 * centerBonus * transferBonus * historicalMultiplier * totalDays);
    const peakHour = index < stations.length / 2 ? 8 : 18;
    const peakBoardings = Math.round(baseBoardings * 0.35);

    const timeDistribution: number[] = [];
    for (let hour = 5; hour <= 23; hour++) {
      let hourFactor = 0.1;
      if (hour >= 7 && hour <= 9) hourFactor = hour === peakHour ? 1.0 : 0.8;
      else if (hour >= 17 && hour <= 19) hourFactor = hour === 18 ? 0.9 : 0.7;
      else if (hour >= 6 && hour <= 22) hourFactor = 0.3 + (hour % 2) * 0.1;

      timeDistribution.push(Math.round(baseBoardings * hourFactor / totalDays));
    }

    heatmapData.push({
      stationId: `st_${index + 1}`,
      stationName: station,
      boardings: baseBoardings,
      alightings: Math.round(baseBoardings * (0.8 + Math.random() * 0.4)),
      peakBoardings,
      timeDistribution,
    });
  });

  return heatmapData;
};

export interface PeakAdjustmentSuggestion {
  timePeriod: string;
  currentInterval: number;
  suggestedInterval: number;
  expectedLoadFactor: number;
  passengerVolume: number;
}

export const generatePeakAdjustmentSuggestions = (
  heatmapData: PassengerHeatmapData[]
): PeakAdjustmentSuggestion[] => {
  const suggestions: PeakAdjustmentSuggestion[] = [];
  const hours = Array.from({ length: 19 }, (_, i) => i + 5);

  const hourlyTotals = hours.map((hour, idx) => ({
    hour,
    total: heatmapData.reduce((sum, d) => sum + (d.timeDistribution[idx] || 0), 0),
  }));

  hourlyTotals.forEach(({ hour, total }) => {
    const isPeak = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
    const currentInterval = isPeak ? 5 : 10;
    const maxPerBus = 80;
    const tripsNeeded = Math.ceil(total / maxPerBus);
    const suggestedInterval = Math.max(3, Math.min(15, Math.round(60 / tripsNeeded)));

    if (Math.abs(suggestedInterval - currentInterval) >= 2) {
      suggestions.push({
        timePeriod: `${hour}:00 - ${hour + 1}:00`,
        currentInterval,
        suggestedInterval,
        expectedLoadFactor: Math.min(95, Math.round((total / (60 / suggestedInterval)) / maxPerBus * 100)),
        passengerVolume: total,
      });
    }
  });

  return suggestions.sort((a, b) => b.passengerVolume - a.passengerVolume).slice(0, 5);
};

export const CHARGING_LOCK_DURATION = 15 * 60 * 1000;

export const checkAndReleaseExpiredLocks = (piles: ChargingPile[]): ChargingPile[] => {
  const now = dayjs();

  return piles.map(pile => {
    if (pile.status === 'locked' && pile.lockedUntil) {
      const lockAge = now.diff(dayjs(pile.lockedUntil), 'minute');
      if (lockAge >= 0) {
        return {
          ...pile,
          status: 'idle' as const,
          lockedBy: undefined,
          lockedUntil: undefined,
        };
      }
    }
    return pile;
  });
};

export const lockChargingPile = (
  piles: ChargingPile[],
  pileId: string,
  busId: string
): { success: boolean; piles: ChargingPile[]; message?: string } => {
  const pile = piles.find(p => p.id === pileId);

  if (!pile) {
    return { success: false, piles, message: '充电桩不存在' };
  }

  if (pile.status !== 'idle') {
    return { success: false, piles, message: '充电桩不可用' };
  }

  const updatedPiles = piles.map(p =>
    p.id === pileId
      ? { ...p, status: 'locked' as const, lockedBy: busId, lockedUntil: dayjs().add(15, 'minute').toISOString() }
      : p
  );

  return { success: true, piles: updatedPiles, message: '充电桩已锁定，15分钟内有效' };
};

export const recommendChargingPile = (
  piles: ChargingPile[],
  busType: 'electric' | 'hybrid' | 'fuel',
  batteryLevel: number
): ChargingPile | null => {
  const availablePiles = piles.filter(p => p.status === 'idle');

  if (availablePiles.length === 0) return null;

  const needsFastCharge = batteryLevel < 30;
  const suitablePiles = availablePiles.filter(p => {
    if (needsFastCharge) return p.type === 'fast';
    return true;
  });

  const targetPiles = suitablePiles.length > 0 ? suitablePiles : availablePiles;

  return targetPiles.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'fast' ? -1 : 1;
    return a.id.localeCompare(b.id);
  })[0];
};

export const REPAIR_ESCALATION_HOURS = 48;

export interface EscalationCheckResult {
  updatedTickets: RepairTicket[];
  escalatedIds: string[];
}

export const checkAndEscalateTickets = (tickets: RepairTicket[]): EscalationCheckResult => {
  const now = dayjs();
  const escalatedIds: string[] = [];

  const updatedTickets = tickets.map(ticket => {
    if (ticket.status !== 'in_progress' || ticket.escalated) {
      return ticket;
    }

    const createdAt = dayjs(ticket.createdAt);
    const hoursOpen = now.diff(createdAt, 'hour');

    if (hoursOpen >= REPAIR_ESCALATION_HOURS) {
      escalatedIds.push(ticket.id);
      return {
        ...ticket,
        escalated: true,
        escalatedAt: now.toISOString(),
        status: 'escalated' as const,
      };
    }

    return ticket;
  });

  return { updatedTickets, escalatedIds };
};

export const calculateRepairEstimate = (
  faultType: string,
  severity: 'minor' | 'major' | 'critical'
): { estimatedHours: number; estimatedCost: number; materials: string[] } => {
  const estimates: Record<string, Record<string, { hours: number; cost: number; materials: string[] }>> = {
    engine: {
      minor: { hours: 2, cost: 500, materials: ['机油', '机油滤清器', '密封垫'] },
      major: { hours: 8, cost: 3000, materials: ['活塞环', '气门油封', '汽缸垫', '机油'] },
      critical: { hours: 24, cost: 15000, materials: ['曲轴', '连杆', '活塞组件', '大修包'] },
    },
    electric: {
      minor: { hours: 1, cost: 200, materials: ['保险丝', '继电器'] },
      major: { hours: 4, cost: 1500, materials: ['发电机', '电瓶', '线束'] },
      critical: { hours: 12, cost: 8000, materials: ['电机控制器', '高压线束', '传感器组'] },
    },
    brake: {
      minor: { hours: 1, cost: 300, materials: ['刹车片', '刹车油'] },
      major: { hours: 3, cost: 1200, materials: ['刹车盘', '刹车片', '刹车分泵'] },
      critical: { hours: 6, cost: 3500, materials: ['ABS泵', '刹车总泵', '全套刹车管路'] },
    },
    tire: {
      minor: { hours: 0.5, cost: 100, materials: ['补胎胶条'] },
      major: { hours: 1, cost: 800, materials: ['新轮胎', '气门嘴'] },
      critical: { hours: 2, cost: 3000, materials: ['全套轮胎', '四轮定位'] },
    },
    other: {
      minor: { hours: 1, cost: 150, materials: ['通用紧固件'] },
      major: { hours: 4, cost: 800, materials: ['专用配件'] },
      critical: { hours: 8, cost: 2500, materials: ['总成部件'] },
    },
  };

  const estimate = estimates[faultType]?.[severity] || estimates.other[severity];

  return {
    estimatedHours: estimate.hours,
    estimatedCost: estimate.cost,
    materials: estimate.materials,
  };
};
