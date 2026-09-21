import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, X, RefreshCw, ExternalLink, Calendar, CheckCircle2 } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import {
  getDashboardOverview,
  fetchRtaExpired,
  fetchPollutionExpired,
  fetchFitnessExpired,
  fetchRoadtaxExpired,
  fetchRoadpermitExpired,
  fetchInsuranceExpired,
  fetchBusfilldata,
  fetchVehicletripexceed,
  updateRoadtaxStatus
} from '../services/api';
import ExportButtons from '../components/ExportButtons';
import { TableLoader } from '../components/Loader';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exceededTripsList, setExceededTripsList] = useState([]);

  // Day-wise KMPL Date filter state (defaults to today)
  const getTodayDateStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const [kmplDate, setKmplDate] = useState(getTodayDateStr);

  // Table search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  // Alert Details Modal state
  const [alertModal, setAlertModal] = useState({
    isOpen: false,
    type: null,
    title: '',
    records: [],
    loading: false,
    updating: false,
    updateMessage: '',
    gradeFilter: null
  });

  const overviewCacheRef = useRef({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        if (parsed.branch && parsed.branch !== 'College') {
          setSelectedBranch(parsed.branch);
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
  }, [navigate]);

  useEffect(() => {
    fetchData(selectedBranch, false, kmplDate);
  }, [selectedBranch]);

  const fetchData = async (branch, forceRefresh = false, customKmplDate = kmplDate) => {
    const cacheKey = `${branch || 'ALL'}_${customKmplDate || 'today'}`;
    if (!forceRefresh && overviewCacheRef.current[cacheKey]) {
      setDashboardData(overviewCacheRef.current[cacheKey].data);
      setExceededTripsList(overviewCacheRef.current[cacheKey].exceededTripsList || []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [data, exceededData] = await Promise.all([
        getDashboardOverview(branch, customKmplDate),
        fetchVehicletripexceed(customKmplDate, branch).catch(err => {
          console.error('Error fetching vehicletripexceed:', err);
          return [];
        })
      ]);
      const safeExceeded = Array.isArray(exceededData) ? exceededData : [];
      overviewCacheRef.current[cacheKey] = { data, exceededTripsList: safeExceeded };
      setDashboardData(data);
      setExceededTripsList(safeExceeded);
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKmplDateChange = (newDate) => {
    setKmplDate(newDate);
    fetchData(selectedBranch, true, newDate);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleOpenAlertModal = async (type, title, gradeFilter = null) => {
    setAlertModal({
      isOpen: true,
      type,
      title,
      records: [],
      loading: true,
      updating: false,
      updateMessage: '',
      gradeFilter
    });

    try {
      let data = [];
      if (type === 'roadtax') data = await fetchRoadtaxExpired();
      else if (type === 'rta') data = await fetchRtaExpired();
      else if (type === 'pollution') data = await fetchPollutionExpired();
      else if (type === 'fitness') data = await fetchFitnessExpired();
      else if (type === 'roadpermit') data = await fetchRoadpermitExpired();
      else if (type === 'insurance') data = await fetchInsuranceExpired();
      else if (type === 'exceed') {
        if (exceededTripsList && exceededTripsList.length > 0) {
          data = exceededTripsList;
        } else {
          data = await fetchVehicletripexceed(kmplDate, selectedBranch);
        }
      } else if (type === 'kmpl') {
        const raw = await fetchBusfilldata(kmplDate);
        const list = Array.isArray(raw) ? raw : [];
        data = gradeFilter
          ? list.filter(r => (r.grade || '').toUpperCase() === gradeFilter.toUpperCase())
          : list;
      }
      setAlertModal(prev => ({
        ...prev,
        records: Array.isArray(data) ? data : [],
        loading: false
      }));
    } catch (err) {
      console.error(`Failed to fetch ${type} alerts:`, err);
      setAlertModal(prev => ({ ...prev, loading: false }));
    }
  };

  const handleTriggerRoadtaxUpdate = async () => {
    setAlertModal(prev => ({ ...prev, updating: true, updateMessage: '' }));
    try {
      const res = await updateRoadtaxStatus();
      const updatedList = await fetchRoadtaxExpired();
      setAlertModal(prev => ({
        ...prev,
        records: Array.isArray(updatedList) ? updatedList : [],
        updating: false,
        updateMessage: res.message || 'Road tax status successfully updated for today.'
      }));
      // Refresh dashboard overview to update badge count
      fetchData(selectedBranch, true);
    } catch (err) {
      console.error('Failed to update road tax status:', err);
      setAlertModal(prev => ({
        ...prev,
        updating: false,
        updateMessage: 'Failed to update road tax status.'
      }));
    }
  };

  const branchesList = user?.branches && user.branches.length > 0
    ? user.branches
    : (user?.branch ? [user.branch] : []);

  // Content data from backend matching dynamic MongoDB statistics
  const staffSummary = dashboardData?.staffSummary || { officeStaff: 0, busStaff: 0 };
  const vehiclesSummary = dashboardData?.vehiclesSummary || { branchVehicleInfo: 0, vehicleAccidents: 0 };

  const certAlerts = dashboardData?.certificateAlerts || {
    rta: 0,
    pollution: 0,
    fitness: 0,
    roadTax: 0,
    roadPermit: 0,
    insurance: 0
  };
  const kmpl = dashboardData?.kmplPerformance || { aGrade: 0, bGrade: 0, cGrade: 0, dGrade: 0 };
  const exceededTrips = exceededTripsList.length > 0
    ? exceededTripsList.length
    : (dashboardData?.exceededTrips ?? 0);
  const busBreakdowns = dashboardData?.busBreakdowns || 0;

  // Services table filtering and pagination
  const allServices = dashboardData?.services || [];
  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return allServices;
    const q = searchQuery.toLowerCase();
    return allServices.filter(s =>
      (s.society || '').toLowerCase().includes(q) ||
      (s.branch || '').toLowerCase().includes(q) ||
      (s.model || '').toLowerCase().includes(q) ||
      (s.vehicleno || '').toLowerCase().includes(q) ||
      (s.parts || '').toLowerCase().includes(q) ||
      (s.date || '').toLowerCase().includes(q)
    );
  }, [allServices, searchQuery]);

  const totalPages = Math.ceil(filteredServices.length / entriesPerPage) || 1;
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredServices.slice(start, start + entriesPerPage);
  }, [filteredServices, currentPage, entriesPerPage]);

  const getExportData = () => {
    if (!filteredServices.length) {
      alert('No data available to export');
      return null;
    }
    const headers = [
      'Society', 'Branch', 'Model', 'Vehicle No.', 'Date',
      'Servicing Parts & Oils', 'Periodical Duration',
      'Last Servicing Reading', 'Present Servicing Reading',
      'KMS', 'Remainder Reading'
    ];
    const rows = filteredServices.map(s => [
      s.society || '', s.branch || '', s.model || '', s.vehicleno || '', s.date || '',
      s.parts || '', s.duration || '', s.lastreading ?? '', s.presentreading ?? '',
      s.kms ?? '', s.remainder ?? ''
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const data = getExportData();
    if (data) exportToCSV(data.headers, data.rows, `Vehicle_Services_${selectedBranch}`);
  };

  const handleExportPDF = () => {
    const data = getExportData();
    if (data) exportToPDF(data.headers, data.rows, `Vehicle_Services_${selectedBranch}`, `Vehicle Services - ${selectedBranch}`);
  };

  const handleExportExcel = () => {
    const data = getExportData();
    if (data) exportToExcel(data.headers, data.rows, `Vehicle_Services_${selectedBranch}`);
  };

  // Pagination number generator with ellipsis
  const getPaginationItems = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items = [1];
    if (currentPage > 3) {
      items.push('...');
    }
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) {
      if (!items.includes(i)) items.push(i);
    }
    if (currentPage < totalPages - 2) {
      items.push('...');
    }
    if (!items.includes(totalPages)) {
      items.push(totalPages);
    }
    return items;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <MainLayout
        mobileLeftOpen={mobileLeftOpen}
        setMobileLeftOpen={setMobileLeftOpen}
        activeTab="Dashboard"
        staffSummary={staffSummary}
        vehiclesSummary={vehiclesSummary}
        user={user}
        handleLogout={handleLogout}
      >
        {/* Top Header Controls: Breadcrumb tab pill and Branch Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', position: 'relative', marginBottom: '14px' }}>
          <div className="breadcrumb-tab-pill">
            <div className="pill-icon-box">
              <Gauge size={14} />
            </div>
            <div className="pill-text-box">Dashboard</div>
          </div>

          {branchesList.length > 0 && (
            <div style={{ position: 'absolute', right: 0, top: 0 }}>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="bg-white border border-slate-300 text-slate-700 py-1 px-2.5 rounded text-xs outline-none cursor-pointer hover:bg-slate-50"
              >
                <option value="ALL">All Branches ({branchesList.length})</option>
                {branchesList.map((b, i) => (
                  <option key={i} value={b}>{b}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Dashboard Main Content Cards */}
        <div className="legacy-dashboard-grid">
          {/* ================= MAIN CONTENT COLUMN ================= */}
          <div className="legacy-main-cards-column" style={{ width: '100%' }}>
            {/* Card 1: Certificate(Alerts) */}
            <div className="legacy-card">
              <div className="legacy-card-header">
                <span>Certificate(Alerts)</span>
              </div>
              <div className="legacy-card-body">
                <div className="metrics-grid-6">
                  <div className="metric-stat-item cursor-pointer hover:bg-slate-50 transition-colors rounded p-1" onClick={() => handleOpenAlertModal('rta', 'RTA Expired')} title="Click to view RTA expired records">
                    <div className="metric-stat-number">{certAlerts.rta ?? 0}</div>
                    <div className="metric-stat-label">RTA</div>
                  </div>
                  <div className="metric-stat-item cursor-pointer hover:bg-slate-50 transition-colors rounded p-1" onClick={() => handleOpenAlertModal('pollution', 'Pollution Alerts')} title="Click to view Pollution alert records">
                    <div className="metric-stat-number">{certAlerts.pollution ?? 0}</div>
                    <div className="metric-stat-label">Pollution</div>
                  </div>
                  <div className="metric-stat-item cursor-pointer hover:bg-slate-50 transition-colors rounded p-1" onClick={() => handleOpenAlertModal('fitness', 'Fitness Alerts')} title="Click to view Fitness alert records">
                    <div className="metric-stat-number">{certAlerts.fitness ?? 0}</div>
                    <div className="metric-stat-label">Fitness</div>
                  </div>
                  <div className="metric-stat-item cursor-pointer hover:bg-blue-50 transition-colors rounded p-1" onClick={() => handleOpenAlertModal('roadtax', 'Road Tax Alerts')} title="Click to view Road Tax alert records and update status">
                    <div className="metric-stat-number" style={{ color: '#0b5299' }}>{certAlerts.roadTax ?? 0}</div>
                    <div className="metric-stat-label" style={{ fontWeight: 600, color: '#0b5299' }}>Road Tax</div>
                  </div>
                  <div className="metric-stat-item cursor-pointer hover:bg-slate-50 transition-colors rounded p-1" onClick={() => handleOpenAlertModal('roadpermit', 'Road Permit Alerts')} title="Click to view Road Permit alert records">
                    <div className="metric-stat-number">{certAlerts.roadPermit ?? 0}</div>
                    <div className="metric-stat-label">Road Permit</div>
                  </div>
                  <div className="metric-stat-item cursor-pointer hover:bg-slate-50 transition-colors rounded p-1" onClick={() => handleOpenAlertModal('insurance', 'Insurance Alerts')} title="Click to view Insurance alert records">
                    <div className="metric-stat-number">{certAlerts.insurance ?? 0}</div>
                    <div className="metric-stat-label">Insurance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: KMPL PERFORMANCE- Grade wise */}
            <div className="legacy-card">
              <div
                className="legacy-card-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>KMPL PERFORMANCE- Grade wise</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      letterSpacing: '0.3px'
                    }}
                  >
                    Day wise
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.85)', fontWeight: 500 }}>Date:</label>
                  <input
                    type="date"
                    value={kmplDate}
                    onChange={(e) => handleKmplDateChange(e.target.value)}
                    style={{
                      padding: '2px 6px',
                      fontSize: '12px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    title="Select date for day-wise KMPL performance"
                  />
                </div>
              </div>
              <div className="legacy-card-body">
                <div className="metrics-grid-4">
                  <div
                    className="metric-stat-item cursor-pointer hover:bg-emerald-50 transition-colors rounded p-1"
                    onClick={() => handleOpenAlertModal('kmpl', `KMPL A Grade Fillings (${kmplDate})`, 'A')}
                    title={`Click to view A Grade vehicles on ${kmplDate}`}
                  >
                    <div className="metric-stat-number" style={{ color: '#059669' }}>{kmpl.aGrade ?? 0}</div>
                    <div className="metric-stat-label">A Grade</div>
                  </div>
                  <div
                    className="metric-stat-item cursor-pointer hover:bg-sky-50 transition-colors rounded p-1"
                    onClick={() => handleOpenAlertModal('kmpl', `KMPL B Grade Fillings (${kmplDate})`, 'B')}
                    title={`Click to view B Grade vehicles on ${kmplDate}`}
                  >
                    <div className="metric-stat-number" style={{ color: '#0284c7' }}>{kmpl.bGrade ?? 0}</div>
                    <div className="metric-stat-label">B Grade</div>
                  </div>
                  <div
                    className="metric-stat-item cursor-pointer hover:bg-amber-50 transition-colors rounded p-1"
                    onClick={() => handleOpenAlertModal('kmpl', `KMPL C Grade Fillings (${kmplDate})`, 'C')}
                    title={`Click to view C Grade vehicles on ${kmplDate}`}
                  >
                    <div className="metric-stat-number" style={{ color: '#d97706' }}>{kmpl.cGrade ?? 0}</div>
                    <div className="metric-stat-label">C Grade</div>
                  </div>
                  <div
                    className="metric-stat-item cursor-pointer hover:bg-rose-50 transition-colors rounded p-1"
                    onClick={() => handleOpenAlertModal('kmpl', `KMPL D Grade Fillings (${kmplDate})`, 'D')}
                    title={`Click to view D Grade vehicles on ${kmplDate}`}
                  >
                    <div className="metric-stat-number" style={{ color: '#dc2626' }}>{kmpl.dGrade ?? 0}</div>
                    <div className="metric-stat-label">D Grade</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Exceeded Vehicle Trips */}
            <div className="legacy-card">
              <div
                className="legacy-card-header"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Exceeded Vehicle Trips</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    color: '#ffffff',
                    letterSpacing: '0.3px'
                  }}
                >
                  Day wise
                </span>
              </div>
              <div className="legacy-card-body">
                <div
                  className="metric-single-center cursor-pointer hover:bg-blue-50 rounded p-2 transition-colors"
                  onClick={() => handleOpenAlertModal('exceed', `Exceeded Vehicle Trips (${kmplDate})`)}
                  title="Click to view Exceeded Vehicle Trips details"
                >
                  <div className="metric-stat-number" style={{ fontSize: '36px', color: '#0b5299' }}>
                    {exceededTrips}
                  </div>
                  <div className="metric-stat-label" style={{ fontWeight: 600, color: '#0b5299' }}>
                    Exceeded Trips
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Vehicle Services Data Table */}
            <div className="legacy-card">
              <div className="legacy-card-header">
                <span>vehicle Services</span>
              </div>
              <div className="table-card-body">
                {/* Control Toolbar */}
                <div className="table-controls-bar">
                  <ExportButtons
                    onCSV={handleExportCSV}
                    onPDF={handleExportPDF}
                    onExcel={handleExportExcel}
                  />

                  <div className="show-entries-dropdown">
                    <span>Show </span>
                    <select
                      value={entriesPerPage}
                      onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span> entries</span>
                  </div>

                  <div className="search-box-wrapper">
                    <label>Search:</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>

                {/* Data Table */}
                <div className="legacy-table-responsive">
                  <table className="legacy-data-table">
                    <thead>
                      <tr>
                        <th className="sorted-col">▴ Society</th>
                        <th>Branch</th>
                        <th>Model</th>
                        <th>Vehicle No.</th>
                        <th>Date</th>
                        <th>Servicing Parts & Oils</th>
                        <th>Periodical Duration</th>
                        <th>Last Servicing Reading</th>
                        <th>Present Servicing Reading</th>
                        <th>KMS</th>
                        <th>Remainder Reading</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <TableLoader colSpan={11} message="Loading vehicle services, please wait..." />
                      ) : paginatedServices.length > 0 ? (
                        paginatedServices.map((row, idx) => (
                          <tr key={row.id || idx}>
                            <td>{row.society}</td>
                            <td>{row.branch}</td>
                            <td>{row.model}</td>
                            <td>{row.vehicleno}</td>
                            <td>{row.date}</td>
                            <td>{row.parts}</td>
                            <td>{row.duration}</td>
                            <td>{row.lastreading}</td>
                            <td>{row.presentreading}</td>
                            <td>{row.kms}</td>
                            <td>{row.remainder}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="11" className="table-status-cell">No data available in table</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer: Info & Pagination */}
                <div className="legacy-table-footer">
                  <div className="pagination-info">
                    Showing {filteredServices.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredServices.length)} of {filteredServices.length} entries
                  </div>
                  <div className="pagination-buttons">
                    <button
                      className="paginate-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    {getPaginationItems().map((item, idx) =>
                      item === '...' ? (
                        <span key={`dots-${idx}`} style={{ padding: '4px 6px', fontSize: '12px', color: '#888888' }}>...</span>
                      ) : (
                        <button
                          key={item}
                          className={`paginate-btn ${currentPage === item ? 'active' : ''}`}
                          onClick={() => setCurrentPage(item)}
                        >
                          {item}
                        </button>
                      )
                    )}
                    <button
                      className="paginate-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ================= CERTIFICATE ALERT DETAILS MODAL ================= */}
        {alertModal.isOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.65)',
              backdropFilter: 'blur(4px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px'
            }}
            onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
          >
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                border: '1px solid #e2e8f0',
                maxWidth: '1000px',
                width: '100%',
                maxHeight: '85vh',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#0f172a' }}>
                    {alertModal.title}
                  </h3>
                  <span
                    style={{
                      backgroundColor: '#0b5299',
                      color: '#ffffff',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}
                  >
                    {alertModal.records.length} records
                  </span>
                  {alertModal.type === 'roadtax' && (
                    <span
                      style={{
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 500
                      }}
                    >
                      Evaluated against today's date
                    </span>
                  )}
                  {alertModal.type === 'kmpl' && (
                    <span
                      style={{
                        backgroundColor: '#e0f2fe',
                        color: '#0369a1',
                        fontSize: '11px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontWeight: 500
                      }}
                    >
                      Day wise: {kmplDate}
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {alertModal.type === 'roadtax' && (
                    <button
                      onClick={handleTriggerRoadtaxUpdate}
                      disabled={alertModal.updating}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        backgroundColor: '#0b5299',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: alertModal.updating ? 'not-allowed' : 'pointer',
                        opacity: alertModal.updating ? 0.7 : 1,
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }}
                      title="Run status update for road tax based on today's date"
                    >
                      <RefreshCw style={{ width: '14px', height: '14px', animation: alertModal.updating ? 'spin 1s linear infinite' : 'none' }} />
                      {alertModal.updating ? 'Updating...' : 'Update Status (Today)'}
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setAlertModal(prev => ({ ...prev, isOpen: false }));
                      if (alertModal.type === 'kmpl') {
                        navigate('/fuels');
                      } else {
                        navigate(`/certificates?tab=${alertModal.type || 'roadtax'}`);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '6px 12px',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 500,
                      cursor: 'pointer'
                    }}
                  >
                    <ExternalLink style={{ width: '13px', height: '13px' }} />
                    View in Module
                  </button>

                  <button
                    onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                  >
                    <X style={{ width: '20px', height: '20px' }} />
                  </button>
                </div>
              </div>

              {/* Status Update Banner */}
              {alertModal.updateMessage && (
                <div
                  style={{
                    backgroundColor: '#ecfdf5',
                    borderBottom: '1px solid #a7f3d0',
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: '#065f46',
                    fontSize: '13px',
                    fontWeight: 500
                  }}
                >
                  <CheckCircle2 style={{ width: '16px', height: '16px', color: '#059669' }} />
                  <span>{alertModal.updateMessage}</span>
                </div>
              )}

              {/* Modal Body / Table */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
                {alertModal.loading ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw style={{ width: '24px', height: '24px', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                    <p style={{ margin: 0, fontSize: '14px' }}>Loading expired alerts data...</p>
                  </div>
                ) : alertModal.records.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <p style={{ margin: 0, fontSize: '14px' }}>
                      {alertModal.type === 'kmpl'
                        ? `No KMPL vehicle fillings recorded on ${kmplDate}${alertModal.gradeFilter ? ` for Grade ${alertModal.gradeFilter}` : ''}.`
                        : alertModal.type === 'exceed'
                        ? `No exceeded vehicle trips recorded on ${kmplDate}.`
                        : 'No alert records found matching the criteria for today.'}
                    </p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table className="legacy-table" style={{ width: '100%' }}>
                      <thead>
                        {alertModal.type === 'kmpl' ? (
                          <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Vehicle Reg. No</th>
                            <th>Branch</th>
                            <th>Model</th>
                            <th>Driver</th>
                            <th>Fuel Qty (L)</th>
                            <th>KMS</th>
                            <th>Avg KMPL</th>
                            <th>Grade</th>
                            <th>Date</th>
                          </tr>
                        ) : alertModal.type === 'exceed' ? (
                          <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Society</th>
                            <th>Branch</th>
                            <th>Reg.No</th>
                            <th>Route</th>
                            <th>Date</th>
                            <th>Capacity</th>
                            <th>Students Strength</th>
                            <th>Fixed Strength</th>
                            <th>OMR</th>
                            <th>CMR</th>
                            <th>KMS</th>
                            <th>Distance (kms)</th>
                            <th>Result</th>
                            <th>Remarks</th>
                          </tr>
                        ) : (
                          <tr>
                            <th style={{ width: '40px' }}>#</th>
                            <th>Vehicle Reg. No</th>
                            <th>Society</th>
                            <th>Branch</th>
                            <th>Model</th>
                            {alertModal.type === 'roadtax' && <th>Certificate No</th>}
                            <th>{alertModal.type === 'roadtax' ? 'Due Date (ddate)' : 'Due / Exp Date'}</th>
                            <th>Valid Till</th>
                            <th>Status</th>
                          </tr>
                        )}
                      </thead>
                      <tbody>
                        {alertModal.records.map((r, idx) => (
                          <tr key={r._id || r.id || idx}>
                            <td style={{ textAlign: 'center', color: '#64748b' }}>{idx + 1}</td>
                            {alertModal.type === 'kmpl' ? (
                              <>
                                <td style={{ fontWeight: 600, color: '#0b5299' }}>{r.regno || r.vehicleregno || '—'}</td>
                                <td>{r.branch || '—'}</td>
                                <td>{r.model || '—'}</td>
                                <td>{r.drivername || '—'}</td>
                                <td style={{ fontWeight: 600 }}>{r.fquantity || '—'}</td>
                                <td>{r.kms ?? '—'}</td>
                                <td style={{ fontWeight: 600, color: '#0284c7' }}>
                                  {typeof r.avgkmpl === 'number' ? r.avgkmpl.toFixed(2) : (r.avgkmpl || '—')}
                                </td>
                                <td>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      backgroundColor:
                                        (r.grade || '').toUpperCase() === 'A' ? '#dcfce7' :
                                        (r.grade || '').toUpperCase() === 'B' ? '#e0f2fe' :
                                        (r.grade || '').toUpperCase() === 'C' ? '#fef3c7' : '#fee2e2',
                                      color:
                                        (r.grade || '').toUpperCase() === 'A' ? '#166534' :
                                        (r.grade || '').toUpperCase() === 'B' ? '#0369a1' :
                                        (r.grade || '').toUpperCase() === 'C' ? '#92400e' : '#b91c1c'
                                    }}
                                  >
                                    {(r.grade || '—').toUpperCase()} Grade
                                  </span>
                                </td>
                                <td>{r.date || '—'}</td>
                              </>
                            ) : alertModal.type === 'exceed' ? (
                              <>
                                <td>{r.society || '—'}</td>
                                <td>{r.branch || '—'}</td>
                                <td style={{ fontWeight: 600, color: '#0b5299' }}>{r.regno || '—'}</td>
                                <td>{r.routename || '—'}</td>
                                <td>{r.date || r.uploaddate || '—'}</td>
                                <td>{r.capacity ?? '—'}</td>
                                <td>{r.students ?? '—'}</td>
                                <td>{r.strength ?? '—'}</td>
                                <td>{r.omr ?? '—'}</td>
                                <td>{r.cmr ?? '—'}</td>
                                <td>{r.kms ?? '—'}</td>
                                <td>{r.distance ?? '—'}</td>
                                <td>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      backgroundColor: '#fee2e2',
                                      color: '#dc2626'
                                    }}
                                  >
                                    {r.result || 'EXCEED'}
                                  </span>
                                </td>
                                <td>{r.remarks || '—'}</td>
                              </>
                            ) : (
                              <>
                                <td style={{ fontWeight: 600, color: '#0b5299' }}>{r.regno || r.vehicleregno || '—'}</td>
                                <td>{r.society || '—'}</td>
                                <td>{r.branch || '—'}</td>
                                <td>{r.model || '—'}</td>
                                {alertModal.type === 'roadtax' && <td>{r.certificate || '—'}</td>}
                                <td style={{ color: '#dc2626', fontWeight: 600 }}>
                                  {r.ddate || r.expireddate || r.rdate || '—'}
                                </td>
                                <td>{r.valid || r.edate || '—'}</td>
                                <td>
                                  <span
                                    style={{
                                      display: 'inline-block',
                                      padding: '2px 8px',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 700,
                                      backgroundColor: (r.status === 'on' || !r.status) ? '#fee2e2' : '#f1f5f9',
                                      color: (r.status === 'on' || !r.status) ? '#dc2626' : '#64748b'
                                    }}
                                  >
                                    {(r.status || 'ON').toUpperCase()}
                                  </span>
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div
                style={{
                  padding: '12px 20px',
                  borderTop: '1px solid #e2e8f0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                  fontSize: '12px',
                  color: '#64748b'
                }}
              >
                <span>
                  {alertModal.type === 'kmpl'
                    ? `Showing ${alertModal.records.length} day-wise vehicle fillings for ${kmplDate}`
                    : alertModal.type === 'exceed'
                    ? `Showing ${alertModal.records.length} exceeded vehicle trips for ${kmplDate}`
                    : alertModal.type === 'roadtax'
                    ? `Showing ${alertModal.records.length} records • Road tax evaluation logic: ddate == today → status: 'on', valid == today → status: 'off'`
                    : `Showing ${alertModal.records.length} records`}
                </span>
                <button
                  onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
                  style={{
                    padding: '6px 14px',
                    backgroundColor: '#e2e8f0',
                    color: '#334155',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </div>
  );
};

export default Dashboard;
