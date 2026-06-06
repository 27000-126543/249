
import type { UserRole } from '@/types';

const roleHierarchy: Record<UserRole, number> = {
  driver: 1,
  leader: 2,
  manager: 3,
  admin: 4,
};

export const hasPermission = (userRole: UserRole | undefined, requiredRole: UserRole): boolean => {
  if (!userRole) return false;
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

export const canViewDashboard = (role: UserRole): boolean => true;

export const canManageSchedule = (role: UserRole): boolean => {
  return hasPermission(role, 'leader');
};

export const canManageRoster = (role: UserRole): boolean => {
  return hasPermission(role, 'leader');
};

export const canApproveSwap = (role: UserRole): boolean => {
  return hasPermission(role, 'leader');
};

export const canViewMonitor = (role: UserRole): boolean => {
  return hasPermission(role, 'leader');
};

export const canViewPassengerAnalysis = (role: UserRole): boolean => {
  return hasPermission(role, 'manager');
};

export const canManageCharging = (role: UserRole): boolean => {
  return hasPermission(role, 'leader');
};

export const canViewReports = (role: UserRole): boolean => {
  return hasPermission(role, 'manager');
};

export const canManageSettings = (role: UserRole): boolean => {
  return role === 'admin';
};

export const getRoleName = (role: UserRole): string => {
  const names: Record<UserRole, string> = {
    driver: '驾驶员',
    leader: '线路长',
    manager: '分公司经理',
    admin: '集团管理员',
  };
  return names[role];
};
