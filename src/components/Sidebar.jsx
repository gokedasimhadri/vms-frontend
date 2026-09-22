import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, User, Users, Bus, FileText, Fuel,
  Droplet, Settings, Wrench, AlertTriangle, Battery, Disc, FileSpreadsheet
} from 'lucide-react';

export const referenceMenuItems = [
  { id: 'Dashboard', label: 'Dashboard', icon: 'speedometer', path: '/dashboard' },
  { id: 'Admin', label: 'Admin', icon: 'user', path: '/admin' },
  { id: 'Staff', label: 'Staff', icon: 'users', path: '/staff' },
  { id: 'Vehicles', label: 'Vehicles', icon: 'bus', path: '/vehicles' },
  { id: 'Certificates', label: 'Certificates', icon: 'file', path: '/certificates' },
  { id: 'Fuels', label: 'Fuels', icon: 'fuel', path: '/fuels' },
  { id: 'Ad-Blue', label: 'Ad-Blue', icon: 'droplet', path: '/ad-blue' },
  { id: 'Services', label: 'Services', icon: 'gear', path: '/services' },
  { id: 'Repair Bills', label: 'Repair Bills', icon: 'wrench', path: '/repair-bills' },
  { id: 'Bus Breakdown', label: 'Bus Breakdown', icon: 'alert', path: '/bus-breakdown' },
  { id: 'Batteries', label: 'Batteries', icon: 'battery', path: '/batteries' },
  { id: 'Vehicle Tyres', label: 'Vehicle Tyres', icon: 'disc', path: '/vehicle-tyres' },
  { id: 'Reports', label: 'Reports', icon: 'reports', path: '/reports' },
];

const Sidebar = ({
  mobileLeftOpen,
  setMobileLeftOpen,
  activeTab,
  setActiveTab,
  staffSummary,
  vehiclesSummary,
  user
}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const loggedUser = user || (() => {
    try {
      const u = localStorage.getItem('user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  })();

  const accountName = loggedUser?.name || loggedUser?.username || 'ADITYA DEGREE COLLEGE HR';

  return (
    <aside className={`sidebar-left ${mobileLeftOpen ? 'open' : ''}`}>
      {/* Top Blue Profile Header (Yellow Bus Logo + Brand Name + System Subtitle) */}
      <div className="sidebar-brand">
        <div className="bus-logo-badge">
          <img
            src="/bus.png"
            alt="Vehicle Bus Logo"
            className="bus-logo-img"
          />
        </div>
        <div className="brand-text-wrapper">
          <span className="brand-title" title={accountName}>
            {accountName}
          </span>
          <span className="system-subtitle-tag">Vehicle Management System</span>
        </div>
      </div>

      <div className="sidebar-section">
        <span className="sidebar-heading">MAIN MENU</span>
        <nav className="nav-menu">
          {referenceMenuItems.map(item => {
            const IconComponent = {
              speedometer: LayoutDashboard,
              user: User,
              users: Users,
              bus: Bus,
              file: FileText,
              fuel: Fuel,
              droplet: Droplet,
              gear: Settings,
              wrench: Wrench,
              alert: AlertTriangle,
              battery: Battery,
              disc: Disc,
              reports: FileSpreadsheet
            }[item.icon];

            const isActive = activeTab
              ? activeTab === item.id
              : location.pathname === item.path;

            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => {
                  if (setActiveTab) setActiveTab(item.id);
                  if (setMobileLeftOpen) setMobileLeftOpen(false);
                  navigate(item.path);
                }}
              >
                <span className="nav-icon-wrapper">
                  {IconComponent && <IconComponent size={18} />}
                </span>
                <span>{item.label}</span>
                {item.id === 'Staff' && staffSummary && <span className="nav-count">{staffSummary.busStaff}</span>}
                {item.id === 'Vehicles' && vehiclesSummary && <span className="nav-count">{vehiclesSummary.branchVehicleInfo}</span>}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
