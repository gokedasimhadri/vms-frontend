import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge } from 'lucide-react';
import MainLayout from '../components/MainLayout';
import ExportButtons from '../components/ExportButtons';
import { getDashboardOverview } from '../services/api';
import { exportToCSV, exportToExcel, exportToPDF, printTable } from '../utils/exportUtils';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Table search and pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

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
    fetchData(selectedBranch);
  }, [selectedBranch]);

  const fetchData = async (branch, forceRefresh = false) => {
    const cacheKey = branch || 'ALL';
    if (!forceRefresh && overviewCacheRef.current[cacheKey]) {
      setDashboardData(overviewCacheRef.current[cacheKey]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const data = await getDashboardOverview(branch);
      overviewCacheRef.current[cacheKey] = data;
      setDashboardData(data);
    } catch (err) {
      console.error('Error fetching dashboard overview:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
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
  const exceededTrips = dashboardData?.exceededTrips || 0;

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

  const handleCopyTable = () => {
    const headers = [
      'Society', 'Branch', 'Model', 'Vehicle No.', 'Date',
      'Servicing Parts & Oils', 'Periodical Duration',
      'Last Servicing Reading', 'Present Servicing Reading',
      'KMS', 'Remainder Reading'
    ];
    const rows = filteredServices.map(s => [
      s.society || '', s.branch || '', s.model || '', s.vehicleno || '', s.date || '',
      s.parts || '', s.duration || '', s.lastreading || '', s.presentreading || '',
      s.kms || '', s.remainder || ''
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const getExportData = () => {
    const headers = [
      'Society', 'Branch', 'Model', 'Vehicle No.', 'Date',
      'Servicing Parts & Oils', 'Periodical Duration',
      'Last Servicing Reading', 'Present Servicing Reading',
      'KMS', 'Remainder Reading'
    ];
    const rows = filteredServices.map(s => [
      s.society || '', s.branch || '', s.model || '', s.vehicleno || '', s.date || '',
      s.parts || '', s.duration || '', s.lastreading || '', s.presentreading || '',
      s.kms || '', s.remainder || ''
    ]);
    return { headers, rows };
  };

  const handleExportCSV = () => {
    const { headers, rows } = getExportData();
    exportToCSV(headers, rows, `Vehicle_Services_${selectedBranch}`);
  };

  const handleExportPDF = () => {
    const { headers, rows } = getExportData();
    exportToPDF(headers, rows, `Vehicle_Services_${selectedBranch}`, `Vehicle Services - ${selectedBranch}`);
  };

  const handleExportExcel = () => {
    const { headers, rows } = getExportData();
    exportToExcel(headers, rows, `Vehicle_Services_${selectedBranch}`);
  };

  const handlePrint = () => {
    printTable('.legacy-data-table', `Vehicle Services - ${selectedBranch}`);
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
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.rta || 0}</div>
                    <div className="metric-stat-label">RTA</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.pollution || 7}</div>
                    <div className="metric-stat-label">Pollution</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.fitness || 3}</div>
                    <div className="metric-stat-label">Fitness</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.roadTax || 0}</div>
                    <div className="metric-stat-label">Road Tax</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.roadPermit || 0}</div>
                    <div className="metric-stat-label">Road Permit</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.insurance || 63}</div>
                    <div className="metric-stat-label">Insurance</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: KMPL PERFORMANCE- Grade wise */}
            <div className="legacy-card">
              <div className="legacy-card-header">
                <span>KMPL PERFORMANCE- Grade wise</span>
              </div>
              <div className="legacy-card-body">
                <div className="metrics-grid-4">
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{kmpl.aGrade || 0}</div>
                    <div className="metric-stat-label">A Grade</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{kmpl.bGrade || 0}</div>
                    <div className="metric-stat-label">B Grade</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{kmpl.cGrade || 0}</div>
                    <div className="metric-stat-label">C Grade</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{kmpl.dGrade || 0}</div>
                    <div className="metric-stat-label">D Grade</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Exceeded Vehicle Trips */}
            <div className="legacy-card">
              <div className="legacy-card-header">
                <span>Exceeded Vehicle Trips</span>
              </div>
              <div className="legacy-card-body">
                <div className="metric-single-center">
                  <div className="metric-stat-number" style={{ fontSize: '36px' }}>{exceededTrips}</div>
                  <div className="metric-stat-label">Exceeded Trips</div>
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
                    onCopy={handleCopyTable}
                    onPrint={handlePrint}
                    onCSV={handleExportCSV}
                    onPDF={handleExportPDF}
                    onExcel={handleExportExcel}
                    containerClassName="export-buttons-group"
                    buttonClassName="export-btn"
                  />
                  {copiedNotification && <span className="copy-toast">Copied!</span>}

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
                        <tr>
                          <td colSpan="11" className="table-status-cell">Loading vehicle services...</td>
                        </tr>
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
      </MainLayout>
    </div>
  );
};

export default Dashboard;
