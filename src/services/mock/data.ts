
import dayjs from 'dayjs';
import type {
  User, Branch, Route, Bus, Driver, SchedulePlan, RosterEntry,
  SwapRequest, AlertEvent, ChargingPile, RepairTicket,
  DashboardStats, HourlyPassenger, RouteOnTimeData, PassengerData
} from '@/types';

export const mockUsers: User[] = [
  { id: 'u1', name: '张管理员', role: 'admin', branchId: 'b1', phone: '13800000001', username: 'admin' },
  { id: 'u2', name: '李经理', role: 'manager', branchId: 'b1', phone: '13800000002', username: 'manager' },
  { id: 'u3', name: '王线路长', role: 'leader', branchId: 'b1', phone: '13800000003', username: 'leader' },
  { id: 'u4', name: '赵师傅', role: 'driver', branchId: 'b1', phone: '13800000004', username: 'driver' },
  { id: 'u5', name: '钱师傅', role: 'driver', branchId: 'b1', phone: '13800000005', username: 'driver2' },
  { id: 'u6', name: '孙师傅', role: 'driver', branchId: 'b1', phone: '13800000006', username: 'driver3' },
];

export const mockBranches: Branch[] = [
  { id: 'b1', name: '城东分公司', address: '城东区人民路1号', managerId: 'u2' },
  { id: 'b2', name: '城西分公司', address: '城西区建设路2号', managerId: 'u2' },
  { id: 'b3', name: '城南分公司', address: '城南区解放路3号', managerId: 'u2' },
];

const generateStations = (routeId: string, count: number) => {
  const baseLng = 116.4 + Math.random() * 0.1;
  const baseLat = 39.9 + Math.random() * 0.1;
  return Array.from({ length: count }, (_, i) => ({
    id: `${routeId}-s${i + 1}`,
    name: `站点${i + 1}`,
    lng: baseLng + i * 0.01,
    lat: baseLat + Math.sin(i) * 0.005,
    sequence: i + 1,
  }));
};

export const mockRoutes: Route[] = [
  { id: 'r1', name: '1路', code: '001', branchId: 'b1', leaderId: 'u3', stations: generateStations('r1', 15), distance: 18.5, duration: 65 },
  { id: 'r2', name: '2路', code: '002', branchId: 'b1', leaderId: 'u3', stations: generateStations('r2', 20), distance: 24.2, duration: 85 },
  { id: 'r3', name: '3路', code: '003', branchId: 'b2', leaderId: 'u3', stations: generateStations('r3', 12), distance: 14.8, duration: 55 },
  { id: 'r4', name: '4路', code: '004', branchId: 'b2', leaderId: 'u3', stations: generateStations('r4', 18), distance: 22.1, duration: 78 },
  { id: 'r5', name: '5路', code: '005', branchId: 'b3', leaderId: 'u3', stations: generateStations('r5', 10), distance: 12.5, duration: 45 },
];

export const mockBuses: Bus[] = [
  { id: 'bus1', plateNumber: '京A12345', type: 'electric', model: '比亚迪K9', capacity: 80, branchId: 'b1', status: 'running', currentRouteId: 'r1', currentLng: 116.42, currentLat: 39.91, batteryLevel: 75 },
  { id: 'bus2', plateNumber: '京A12346', type: 'electric', model: '比亚迪K9', capacity: 80, branchId: 'b1', status: 'running', currentRouteId: 'r1', currentLng: 116.45, currentLat: 39.92, batteryLevel: 62 },
  { id: 'bus3', plateNumber: '京A12347', type: 'hybrid', model: '宇通H12', capacity: 75, branchId: 'b1', status: 'running', currentRouteId: 'r2', currentLng: 116.48, currentLat: 39.93, batteryLevel: 88 },
  { id: 'bus4', plateNumber: '京A12348', type: 'fuel', model: '金龙XMQ', capacity: 70, branchId: 'b2', status: 'idle' },
  { id: 'bus5', plateNumber: '京A12349', type: 'electric', model: '比亚迪K8', capacity: 70, branchId: 'b2', status: 'charging', batteryLevel: 45 },
  { id: 'bus6', plateNumber: '京A12350', type: 'electric', model: '比亚迪K9', capacity: 80, branchId: 'b3', status: 'repair' },
  { id: 'bus7', plateNumber: '京A12351', type: 'hybrid', model: '宇通H10', capacity: 70, branchId: 'b1', status: 'running', currentRouteId: 'r2', currentLng: 116.50, currentLat: 39.94, batteryLevel: 55 },
  { id: 'bus8', plateNumber: '京A12352', type: 'electric', model: '比亚迪K9', capacity: 80, branchId: 'b1', status: 'maintenance' },
];

export const mockDrivers: Driver[] = [
  { id: 'd1', userId: 'u4', name: '赵师傅', employeeNo: 'DRV001', branchId: 'b1', licenseLevel: 'A1', skills: ['纯电动', '混合动力'], totalWorkHours: 1850, monthlyWorkHours: 168, status: 'on' },
  { id: 'd2', userId: 'u5', name: '钱师傅', employeeNo: 'DRV002', branchId: 'b1', licenseLevel: 'A3', skills: ['纯电动'], totalWorkHours: 1200, monthlyWorkHours: 156, status: 'on' },
  { id: 'd3', userId: 'u6', name: '孙师傅', employeeNo: 'DRV003', branchId: 'b1', licenseLevel: 'A1', skills: ['纯电动', '混合动力', '燃油'], totalWorkHours: 2400, monthlyWorkHours: 172, status: 'rest' },
  { id: 'd4', userId: 'u4', name: '李师傅', employeeNo: 'DRV004', branchId: 'b2', licenseLevel: 'A1', skills: ['纯电动', '燃油'], totalWorkHours: 2100, monthlyWorkHours: 160, status: 'on' },
  { id: 'd5', userId: 'u5', name: '周师傅', employeeNo: 'DRV005', branchId: 'b2', licenseLevel: 'A3', skills: ['纯电动'], totalWorkHours: 980, monthlyWorkHours: 145, status: 'leave' },
];

const today = dayjs().format('YYYY-MM-DD');

export const mockSchedulePlans: SchedulePlan[] = [
  {
    id: 'plan1', routeId: 'r1', branchId: 'b1', date: today, timeSlot: 'morning',
    startTime: '06:00', endTime: '09:00', intervalMinutes: 8, busType: 'electric',
    busCount: 4, estimatedLoadRate: 72, estimatedOnTimeRate: 95, status: 'executing',
    createdBy: 'u2', createdAt: dayjs().subtract(1, 'day').format(),
    trips: Array.from({ length: 23 }, (_, i) => ({
      id: `trip1-${i}`, planId: 'plan1',
      departureTime: dayjs().hour(6).minute(i * 8).format('HH:mm'),
      busId: i % 2 === 0 ? 'bus1' : 'bus2',
      driverId: i % 2 === 0 ? 'd1' : 'd2',
      sequence: i + 1,
    })),
  },
  {
    id: 'plan2', routeId: 'r1', branchId: 'b1', date: today, timeSlot: 'evening',
    startTime: '17:00', endTime: '20:00', intervalMinutes: 6, busType: 'electric',
    busCount: 5, estimatedLoadRate: 85, estimatedOnTimeRate: 92, status: 'published',
    createdBy: 'u2', createdAt: dayjs().subtract(1, 'day').format(),
    trips: [],
  },
  {
    id: 'plan3', routeId: 'r2', branchId: 'b1', date: today, timeSlot: 'all',
    startTime: '05:30', endTime: '22:00', intervalMinutes: 12, busType: 'hybrid',
    busCount: 6, estimatedLoadRate: 65, estimatedOnTimeRate: 93, status: 'draft',
    createdBy: 'u2', createdAt: dayjs().subtract(2, 'day').format(),
    trips: [],
  },
];

export const mockRosterEntries: RosterEntry[] = [
  { id: 'roster1', driverId: 'd1', date: today, shiftType: 'morning', tripIds: ['trip1-1', 'trip1-3', 'trip1-5'], workHours: 6.5 },
  { id: 'roster2', driverId: 'd2', date: today, shiftType: 'morning', tripIds: ['trip1-2', 'trip1-4', 'trip1-6'], workHours: 6.5 },
  { id: 'roster3', driverId: 'd3', date: today, shiftType: 'rest', tripIds: [], workHours: 0 },
  { id: 'roster4', driverId: 'd1', date: dayjs().add(1, 'day').format('YYYY-MM-DD'), shiftType: 'evening', tripIds: [], workHours: 7 },
  { id: 'roster5', driverId: 'd2', date: dayjs().add(1, 'day').format('YYYY-MM-DD'), shiftType: 'middle', tripIds: [], workHours: 8 },
];

export const mockSwapRequests: SwapRequest[] = [
  {
    id: 'swap1', requesterId: 'd1', targetDriverId: 'd3', date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
    reason: '家中有事需要处理', status: 'pending', createdAt: dayjs().subtract(2, 'hour').format(),
  },
  {
    id: 'swap2', requesterId: 'd2', date: dayjs().add(3, 'day').format('YYYY-MM-DD'),
    reason: '身体不适需要休息', status: 'leader_approved',
    leaderApprovedAt: dayjs().subtract(1, 'hour').format(), createdAt: dayjs().subtract(5, 'hour').format(),
  },
];

export const mockAlertEvents: AlertEvent[] = [
  {
    id: 'alert1', type: 'traffic_jam', busId: 'bus1', routeId: 'r1',
    timestamp: dayjs().subtract(5, 'minute').format(),
    lng: 116.43, lat: 39.91, severity: 'medium', status: 'new',
    description: '车辆在建国门附近遇到交通拥堵，已停留超过8分钟',
    nearestBusIds: ['bus2', 'bus3'],
  },
  {
    id: 'alert2', type: 'route_deviation', busId: 'bus3', routeId: 'r2',
    timestamp: dayjs().subtract(15, 'minute').format(),
    lng: 116.49, lat: 39.93, severity: 'high', status: 'acknowledged',
    description: '车辆偏离规定行驶路线，请确认是否正常',
  },
  {
    id: 'alert3', type: 'overtime_stop', busId: 'bus7', routeId: 'r2',
    timestamp: dayjs().subtract(3, 'minute').format(),
    lng: 116.51, lat: 39.94, severity: 'low', status: 'new',
    description: '车辆在站点停留时间超过5分钟',
  },
];

export const mockChargingPiles: ChargingPile[] = [
  { id: 'pile1', name: '快充桩1号', type: 'fast', power: 120, branchId: 'b1', location: 'A区1号位', status: 'occupied', currentBusId: 'bus5' },
  { id: 'pile2', name: '快充桩2号', type: 'fast', power: 120, branchId: 'b1', location: 'A区2号位', status: 'idle' },
  { id: 'pile3', name: '快充桩3号', type: 'fast', power: 120, branchId: 'b1', location: 'A区3号位', status: 'locked', lockedBy: 'system', lockedUntil: dayjs().add(15, 'minute').format() },
  { id: 'pile4', name: '慢充桩1号', type: 'slow', power: 7, branchId: 'b1', location: 'B区1号位', status: 'idle' },
  { id: 'pile5', name: '慢充桩2号', type: 'slow', power: 7, branchId: 'b1', location: 'B区2号位', status: 'faulty' },
  { id: 'pile6', name: '慢充桩3号', type: 'slow', power: 7, branchId: 'b1', location: 'B区3号位', status: 'idle' },
];

export const mockRepairTickets: RepairTicket[] = [
  {
    id: 'repair1', busId: 'bus6', reporterId: 'd1', faultType: 'engine',
    description: '车辆启动时有异响，加速无力', severity: 'major',
    status: 'in_progress', assignedTeamId: 'team1',
    materialList: [
      { id: 'mat1', name: '空气滤清器', quantity: 1, unit: '个', status: 'issued' },
      { id: 'mat2', name: '机油', quantity: 8, unit: '升', status: 'issued' },
    ],
    createdAt: dayjs().subtract(20, 'hour').format(),
    startedAt: dayjs().subtract(18, 'hour').format(),
  },
  {
    id: 'repair2', busId: 'bus8', reporterId: 'd2', faultType: 'electric',
    description: '电池系统告警，充电速度变慢', severity: 'critical',
    status: 'escalated', assignedTeamId: 'team2',
    materialList: [
      { id: 'mat3', name: '电池管理模块', quantity: 1, unit: '套', status: 'requested' },
    ],
    createdAt: dayjs().subtract(50, 'hour').format(),
    startedAt: dayjs().subtract(48, 'hour').format(),
    escalatedAt: dayjs().subtract(2, 'hour').format(),
  },
  {
    id: 'repair3', busId: 'bus4', reporterId: 'd4', faultType: 'tire',
    description: '右后轮胎压异常，需要检查', severity: 'minor',
    status: 'completed', assignedTeamId: 'team1',
    materialList: [
      { id: 'mat4', name: '气门芯', quantity: 2, unit: '个', status: 'issued' },
    ],
    createdAt: dayjs().subtract(3, 'day').format(),
    startedAt: dayjs().subtract(3, 'day').add(2, 'hour').format(),
    completedAt: dayjs().subtract(3, 'day').add(4, 'hour').format(),
  },
];

export const getDashboardStats = (): DashboardStats => ({
  totalBuses: mockBuses.length,
  runningBuses: mockBuses.filter(b => b.status === 'running').length,
  onTimeRate: 94.2 + Math.random() * 2,
  todayPassengers: 12580 + Math.floor(Math.random() * 500),
  chargingPileUsage: Math.round(mockChargingPiles.filter(p => p.status === 'occupied').length / mockChargingPiles.length * 100),
  driverAttendance: 92.5 + Math.random() * 3,
  activeAlerts: mockAlertEvents.filter(a => a.status === 'new').length,
});

export const getHourlyPassengers = (): HourlyPassenger[] => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  return hours.map(hour => {
    let base = 100;
    if (hour >= 7 && hour <= 9) base = 800;
    else if (hour >= 17 && hour <= 19) base = 750;
    else if (hour >= 11 && hour <= 13) base = 400;
    else if (hour >= 6 && hour <= 22) base = 300;
    else base = 50;
    return {
      hour,
      count: base + Math.floor(Math.random() * 200 - 100),
    };
  });
};

export const getRouteOnTimeData = (): RouteOnTimeData[] => [
  { routeName: '1路', onTimeRate: 95.2, totalTrips: 48 },
  { routeName: '2路', onTimeRate: 93.8, totalTrips: 56 },
  { routeName: '3路', onTimeRate: 96.1, totalTrips: 42 },
  { routeName: '4路', onTimeRate: 91.5, totalTrips: 38 },
  { routeName: '5路', onTimeRate: 94.7, totalTrips: 36 },
];

export const getPassengerHeatmapData = (): PassengerData[] => {
  const data: PassengerData[] = [];
  mockRoutes.forEach(route => {
    route.stations.forEach(station => {
      for (let h = 6; h <= 22; h++) {
        let count = Math.floor(Math.random() * 50 + 20);
        if (h >= 7 && h <= 9) count = Math.floor(Math.random() * 150 + 100);
        else if (h >= 17 && h <= 19) count = Math.floor(Math.random() * 140 + 90);
        data.push({
          id: `${route.id}-${station.id}-${h}`,
          stationId: station.id,
          routeId: route.id,
          date: today,
          hour: h,
          passengerCount: count,
          isPeak: (h >= 7 && h <= 9) || (h >= 17 && h <= 19),
        });
      }
    });
  });
  return data;
};
