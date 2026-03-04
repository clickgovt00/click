// Main App Component with Routing

import React from 'react';
import CentralSupervisorDashboard from './pages/CentralSupervisorDashboard';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Login from './pages/Login';
import OperatorDashboard from './pages/OperatorDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import HQSupervisorDashboard from './pages/HQSupervisorDashboard';
import AccountantDashboard from './pages/AccountantDashboard';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/" element={<Login />} />

          {/* Operator Routes */}
          <Route
            path="/operator/dashboard"
            element={
              <ProtectedRoute allowedRoles={['operator']}>
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Supervisor Routes */}
          <Route
            path="/supervisor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['supervisor']}>
                <SupervisorDashboard />
              </ProtectedRoute>
            }
          />

          {/* HQ Supervisor Routes */}
          <Route
            path="/hq-supervisor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['hq_supervisor']}>
                <HQSupervisorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Accountant Routes */}
          <Route
            path="/accountant/dashboard"
            element={
              <ProtectedRoute allowedRoles={['accountant']}>
                <AccountantDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Owner Routes */}
          <Route
            path="/owner/dashboard"
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}

          {/* Central Supervisor */}
          <Route
            path="/central-dashboard"
            element={
              <ProtectedRoute allowedRoles={["central_supervisor"]}>
                <CentralSupervisorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

      </AuthProvider>
    </Router>
  );
}

export default App;