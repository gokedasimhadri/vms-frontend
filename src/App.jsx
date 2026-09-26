import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Staff from './pages/Staff';
import Vehicles from './pages/Vehicles';
import Certificates from './pages/Certificates';
import Fuels from './pages/Fuels';
import AdBlue from './pages/AdBlue';
import Services from './pages/Services';
import RepairBills from './pages/RepairBills';
import BusBreakdown from './pages/BusBreakdown';
import Batteries from './pages/Batteries';
import VehicleTyres from './pages/VehicleTyres';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import './App.css';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function HomeRoute() {
  const token = localStorage.getItem('token');
  if (token) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Login />;
}

function App() {
  return (
    <div className="app-container">
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/register" element={<Register />} />

        {/* Dedicated Sidebar Pages */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="/staff" element={<ProtectedRoute><Staff /></ProtectedRoute>} />
        <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
        <Route path="/certificates" element={<ProtectedRoute><Certificates /></ProtectedRoute>} />
        <Route path="/fuels" element={<ProtectedRoute><Fuels /></ProtectedRoute>} />
        <Route path="/ad-blue" element={<ProtectedRoute><AdBlue /></ProtectedRoute>} />
        <Route path="/services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
        <Route path="/repair-bills" element={<ProtectedRoute><RepairBills /></ProtectedRoute>} />
        <Route path="/bus-breakdown" element={<ProtectedRoute><BusBreakdown /></ProtectedRoute>} />
        <Route path="/batteries" element={<ProtectedRoute><Batteries /></ProtectedRoute>} />
        <Route path="/vehicle-tyres" element={<ProtectedRoute><VehicleTyres /></ProtectedRoute>} />
        <Route path="/user-management" element={<ProtectedRoute><UserManagement /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
