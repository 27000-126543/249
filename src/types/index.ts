
export type UserRole = 'driver' | 'leader' | 'manager' | 'admin';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  branchId: string;
  phone: string;
  avatar?: string;
  username: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  managerId: string;
}

export interface Station {
  id: string;
  name: string;
  lng: number;
  lat: number;
  sequence: number;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  branchId: string;
  leaderId: string;
  stations: Station[];
  distance: number;
  duration: number;
  estimatedDuration?: number;
  designCapacity?: number;
  vehicleType?: 'large' | 'medium' | 'small';
}

export type BusStatus = 'idle' | 'running' | 'charging' | 'repair' | 'maintenance';
export type BusType = 'electric' | 'hybrid' | 'fuel';

export interface Bus {
  id: string;
  plateNumber: string;
  type: BusType;
  model: string;
  capacity: number;
  branchId: string;
  status: BusStatus;
  currentRouteId?: string;
  currentLng?: number;
  currentLat?: number;
  batteryLevel?: number;
}

export type DriverStatus = 'on' | 'off' | 'leave' | 'rest';

export interface Driver {
  id: string;
  userId: string;
  name: string;
  employeeNo: string;
  branchId: string;
  licenseLevel: 'A1' | 'A3';
  skills: string[];
  totalWorkHours: number;
  monthlyWorkHours: number;
  status: DriverStatus;
}

export type TimeSlot = 'morning' | 'noon' | 'evening' | 'night' | 'all';
export type PlanStatus = 'draft' | 'published' | 'executing' | 'completed' | 'cancelled';

export interface ScheduleTrip {
  id: string;
  planId: string;
  departureTime: string;
  busId: string;
  driverId: string;
  sequence: number;
}

export interface SchedulePlan {
  id: string;
  routeId: string;
  branchId: string;
  date: string;
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
  busType: string;
  busCount: number;
  estimatedLoadRate: number;
  estimatedOnTimeRate: number;
  status: PlanStatus;
  createdBy: string;
  createdAt: string;
  trips: ScheduleTrip[];
}

export type ShiftType = 'morning' | 'middle' | 'evening' | 'rest' | 'leave';

export interface RosterEntry {
  id: string;
  driverId: string;
  date: string;
  shiftType: ShiftType;
  tripIds: string[];
  workHours: number;
  departureTime?: string;
  routeId?: string;
  busId?: string;
  status?: string;
}

export type SwapRequestStatus = 'pending' | 'leader_approved' | 'manager_approved' | 'rejected' | 'auto_approved';

export interface SwapRequest {
  id: string;
  requesterId: string;
  targetDriverId?: string;
  date: string;
  reason: string;
  status: SwapRequestStatus;
  leaderApprovedAt?: string;
  managerApprovedAt?: string;
  createdAt: string;
}

export type TelemetryStatus = 'normal' | 'deviated' | 'traffic_jam' | 'stopped';

export interface BusTelemetry {
  id: string;
  busId: string;
  timestamp: string;
  lng: number;
  lat: number;
  speed: number;
  direction: number;
  status: TelemetryStatus;
}

export type AlertType = 'route_deviation' | 'traffic_jam' | 'overtime_stop' | 'speeding' | 'emergency';
export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'new' | 'acknowledged' | 'resolved';

export interface AlertEvent {
  id: string;
  type: AlertType;
  busId: string;
  routeId: string;
  timestamp: string;
  lng: number;
  lat: number;
  severity: AlertSeverity;
  status: AlertStatus;
  description: string;
  nearestBusIds?: string[];
}

export interface PassengerData {
  id: string;
  stationId: string;
  routeId: string;
  date: string;
  hour: number;
  passengerCount: number;
  isPeak: boolean;
}

export interface PassengerHeatmapData {
  stationId: string;
  stationName: string;
  boardings: number;
  alightings: number;
  peakBoardings: number;
  timeDistribution: number[];
}

export type PileStatus = 'idle' | 'occupied' | 'locked' | 'faulty';
export type PileType = 'fast' | 'slow';

export interface ChargingPile {
  id: string;
  name: string;
  type: PileType;
  power: number;
  branchId: string;
  location: string;
  status: PileStatus;
  currentBusId?: string;
  lockedBy?: string;
  lockedUntil?: string;
}

export type FaultType = 'engine' | 'electric' | 'brake' | 'tire' | 'body' | 'other';
export type FaultSeverity = 'minor' | 'major' | 'critical';
export type RepairStatus = 'new' | 'assigned' | 'in_progress' | 'waiting_parts' | 'completed' | 'escalated';

export interface MaterialItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  status: 'requested' | 'issued' | 'returned';
}

export interface RepairTicket {
  id: string;
  busId: string;
  reporterId: string;
  faultType: FaultType;
  description: string;
  severity: FaultSeverity;
  status: RepairStatus;
  assignedTeamId?: string;
  materialList: MaterialItem[];
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  escalatedAt?: string;
  escalated?: boolean;
  estimatedHours?: number;
  estimatedCost?: number;
}

export interface DashboardStats {
  totalBuses: number;
  runningBuses: number;
  onTimeRate: number;
  todayPassengers: number;
  chargingPileUsage: number;
  driverAttendance: number;
  activeAlerts: number;
}

export interface HourlyPassenger {
  hour: number;
  count: number;
}

export interface RouteOnTimeData {
  routeName: string;
  onTimeRate: number;
  totalTrips: number;
}
