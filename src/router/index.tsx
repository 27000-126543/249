
import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import MainLayout from '@/components/Layout/MainLayout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Schedule from '@/pages/Schedule';
import ScheduleCreate from '@/pages/Schedule/Create';
import Roster from '@/pages/Roster';
import SwapRequests from '@/pages/Roster/SwapRequests';
import Monitor from '@/pages/Monitor';
import Alerts from '@/pages/Monitor/Alerts';
import Passenger from '@/pages/Passenger';
import Charging from '@/pages/Charging';
import Repair from '@/pages/Repair';
import Reports from '@/pages/Reports';
import Settings from '@/pages/Settings';
import { useAppStore, initializeAuth } from '@/store';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isLoggedIn } = useAppStore();
  const location = useLocation();

  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isLoggedIn } = useAppStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/schedule" element={<Schedule />} />
                  <Route path="/schedule/create" element={<ScheduleCreate />} />
                  <Route path="/roster" element={<Roster />} />
                  <Route path="/roster/swap" element={<SwapRequests />} />
                  <Route path="/monitor" element={<Monitor />} />
                  <Route path="/monitor/alerts" element={<Alerts />} />
                  <Route path="/passenger" element={<Passenger />} />
                  <Route path="/charging" element={<Charging />} />
                  <Route path="/repair" element={<Repair />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
