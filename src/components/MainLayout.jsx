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
      />

      {/* ================= MAIN DASHBOARD CENTER ================= */}
      <main className="dashboard-main-content" style={{ padding: 0, gap: 0 }}>
        <Header user={user} handleLogout={handleLogout} />

        <div style={{ padding: '24px 28px', flex: 1, display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto' }}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default MainLayout;
