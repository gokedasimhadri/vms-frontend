import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({
  children,
  mobileLeftOpen,
  setMobileLeftOpen,
  activeTab,
  setActiveTab,
  staffSummary,
  vehiclesSummary,
  user,
  handleLogout
}) => {
  return (
    <div className="dashboard-grid-layout">
      {/* ================= LEFT SIDEBAR ================= */}
      <Sidebar 
        mobileLeftOpen={mobileLeftOpen}
        setMobileLeftOpen={setMobileLeftOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        staffSummary={staffSummary}
        vehiclesSummary={vehiclesSummary}
        user={user}
      />

      {/* ================= RIGHT: Header + Content ================= */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header user={user} handleLogout={handleLogout} />
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default MainLayout;
