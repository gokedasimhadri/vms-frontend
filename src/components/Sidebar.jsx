import React from 'react';
import {
  LayoutDashboard, User, Users, Bus, FileText, Fuel,
  Droplet, Settings, Wrench, AlertTriangle, Battery, Disc
} from 'lucide-react';

const referenceMenuItems = [
  { id: 'Dashboard', label: 'Dashboard', icon: 'speedometer' },
  { id: 'Admin', label: 'Admin', icon: 'user' },
  { id: 'Staff', label: 'Staff', icon: 'users' },
  { id: 'Vehicles', label: 'Vehicles', icon: 'bus' },
  { id: 'Certificates', label: 'Certificates', icon: 'file' },
  { id: 'Fuels', label: 'Fuels', icon: 'fuel' },
  { id: 'Ad-Blue', label: 'Ad-Blue', icon: 'droplet' },
  { id: 'Services', label: 'Services', icon: 'gear' },
  { id: 'Repair Bills', label: 'Repair Bills', icon: 'wrench' },
  { id: 'Bus Breakdown', label: 'Bus Breakdown', icon: 'alert' },
  { id: 'Batteries', label: 'Batteries', icon: 'battery' },
  { id: 'Vehicle Tyres', label: 'Vehicle Tyres', icon: 'disc' },
];

const Sidebar = ({
  mobileLeftOpen,
  setMobileLeftOpen,
  activeTab,
  setActiveTab,
  staffSummary,
  vehiclesSummary
}) => {
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
          <span className="brand-title" title="ADITYA DEGREE COLLEGE">
            ADITYA DEGREE COLLEGE HR
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
              disc: Disc
            }[item.icon];

            return (
              <button
                key={item.id}
                className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(item.id); setMobileLeftOpen(false); }}
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
