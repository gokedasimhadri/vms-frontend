import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import CustomTabs from '../components/CustomTabs';
import MainLayout from '../components/MainLayout';
import { getAdminData, deleteAdminItem } from '../services/api';

const ADMIN_SUBTABS = [
  { id: 'Societies', label: 'Societies' },
  { id: 'Branches', label: 'Branches' },
  { id: 'Route_Details', label: 'Route_Details' },
  { id: 'Handovers', label: 'Handovers' },
  { id: 'Issues', label: 'Issues' },
  { id: 'Transfers', label: 'Transfers' },
];

const Admin = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  // Subtabs & Data
  const [adminSubTab, setAdminSubTab] = useState('Societies');
  const [adminData, setAdminData] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminEntriesPerPage, setAdminEntriesPerPage] = useState(10);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const [adminCopiedNotification, setAdminCopiedNotification] = useState(false);

  // New Record Modal
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffSubmitting, setNewStaffSubmitting] = useState(false);
  const [staffSuccessToast, setStaffSuccessToast] = useState('');

  const adminCacheRef = useRef({});

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const fetchAdminData = async (subTab, branch, forceRefresh = false) => {
    const activeSub = subTab || 'Societies';
    const effectiveBranch = (branch && branch !== 'VMS' && branch !== 'College') ? branch : 'ALL';
    const cacheKey = `${activeSub}_${effectiveBranch}`;
    if (!forceRefresh && adminCacheRef.current[cacheKey]) {
      setAdminData(adminCacheRef.current[cacheKey]);
      setAdminCurrentPage(1);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    try {
      const typeKey = activeSub.toLowerCase();
      const res = await getAdminData(typeKey, effectiveBranch, user?.username);
      const data = res?.data || [];
      adminCacheRef.current[cacheKey] = data;
      setAdminData(data);
      setAdminCurrentPage(1);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      setAdminData([]);
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(adminSubTab, selectedBranch);
  }, [adminSubTab, selectedBranch, user]);

  const filteredAdminData = useMemo(() => {
    if (!adminSearchQuery.trim()) return adminData;
    const q = adminSearchQuery.toLowerCase();
    return adminData.filter(item =>
      Object.entries(item).some(([k, val]) =>
        k !== '_id' && k !== 'id' && val && String(val).toLowerCase().includes(q)
      )
    );
  }, [adminData, adminSearchQuery]);

  const totalAdminPages = Math.ceil(filteredAdminData.length / adminEntriesPerPage) || 1;
  const paginatedAdminData = useMemo(() => {
    const start = (adminCurrentPage - 1) * adminEntriesPerPage;
    return filteredAdminData.slice(start, start + adminEntriesPerPage);
  }, [filteredAdminData, adminCurrentPage, adminEntriesPerPage]);

  const handleCopyAdminTable = () => {
    if (!filteredAdminData.length) return;
    const sample = filteredAdminData[0];
    const keys = Object.keys(sample).filter(k => k !== '_id' && k !== 'id');
    const headerRow = keys.join('\t');
    const dataRows = filteredAdminData.map(row => keys.map(k => row[k] ?? '').join('\t'));
    const tsv = [headerRow, ...dataRows].join('\n');
    navigator.clipboard.writeText(tsv);
    setAdminCopiedNotification(true);
    setTimeout(() => setAdminCopiedNotification(false), 2000);
  };

  const handleExportAdminCSV = () => {
    if (!filteredAdminData.length) return;
    const sample = filteredAdminData[0];
    const keys = Object.keys(sample).filter(k => k !== '_id' && k !== 'id');
    const headerRow = keys.join(',');
    const dataRows = filteredAdminData.map(row =>
      keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `Admin_${adminSubTab}_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAdminTable = () => {
    window.print();
  };

  const handleDeleteAdminRecord = async (id) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    try {
      const typeKey = adminSubTab.toLowerCase();
      await deleteAdminItem(typeKey, id);
      adminCacheRef.current = {};
      fetchAdminData(adminSubTab, selectedBranch, true);
    } catch (err) {
      console.error('Error deleting admin item:', err);
      alert('Failed to delete item.');
    }
  };

  return (
    <MainLayout
      mobileLeftOpen={mobileLeftOpen}
      setMobileLeftOpen={setMobileLeftOpen}
      activeTab="Admin"
      user={user}
      handleLogout={handleLogout}
    >
      <div className="admin-page-container">
        {/* Module Header Badge */}
        <div className="module-top-badge-wrapper">
          <div className="module-top-badge">
            <div className="module-top-badge-icon">
              <User size={16} />
            </div>
            <div className="module-top-badge-label">Admin</div>
          </div>
        </div>

        {/* Subtabs matching Staff page tabs design */}
        <div className="flex justify-center mb-6 mt-4 max-w-full overflow-x-auto">
          <CustomTabs
            activeTab={adminSubTab}
            onChange={(id) => setAdminSubTab(id)}
            tabs={ADMIN_SUBTABS}
          />
        </div>

        {/* Action Buttons: [ View Data ] [ New Record ] */}
        <div className="admin-actions-bar">
          <button
            type="button"
            className="admin-action-btn"
            disabled={adminLoading}
            onClick={() => fetchAdminData(adminSubTab, selectedBranch, true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {adminLoading ? (
              <>
                <span className="btn-spinner" />
                <span>Loading...</span>
              </>
            ) : (
              'View Data'
            )}
          </button>
          <button
            type="button"
            className="admin-action-btn"
            onClick={() => {
              setNewStaffName('');
              setShowNewStaffModal(true);
            }}
          >
            {adminSubTab === 'Societies' ? 'New Society' : adminSubTab === 'Branches' ? 'New Branch' : `New ${adminSubTab.replace(/_/g, ' ')}`}
          </button>
          {staffSuccessToast && (
            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', marginLeft: '10px' }}>
              ✓ {staffSuccessToast}
            </span>
          )}
        </div>

        {/* Data Table Card */}
        <div className="admin-table-card">
          <div className="admin-table-toolbar">
            {/* Export Buttons */}
            <div className="admin-export-group">
              <button type="button" className="admin-export-btn" onClick={handleCopyAdminTable} title="Copy to clipboard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy
              </button>
              <button type="button" className="admin-export-btn" onClick={handlePrintAdminTable} title="Print table">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print
              </button>
              <button type="button" className="admin-export-btn" onClick={handleExportAdminCSV} title="Export CSV">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                csv
              </button>
              <button type="button" className="admin-export-btn" onClick={handleExportAdminCSV} title="Export PDF">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                pdf
              </button>
              <button type="button" className="admin-export-btn" onClick={handleExportAdminCSV} title="Export Excel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                Excel
              </button>
              {adminCopiedNotification && (
                <span className="admin-toast-feedback">Copied!</span>
              )}
            </div>

            {/* Entries control */}
            <div className="admin-entries-control">
              <span>Show</span>
              <select
                value={adminEntriesPerPage}
                onChange={(e) => {
                  setAdminEntriesPerPage(Number(e.target.value));
                  setAdminCurrentPage(1);
                }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>entries</span>
            </div>

            {/* Search */}
            <div className="admin-search-control">
              <label>Search:</label>
              <input
                type="text"
                value={adminSearchQuery}
                onChange={(e) => {
                  setAdminSearchQuery(e.target.value);
                  setAdminCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table responsive */}
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                {adminSubTab === 'Societies' && (
                  <tr>
                    <th className="sortable">▴ S.No</th>
                    <th>Society Name</th>
                    <th>Edit</th>
                    <th>Remove</th>
                  </tr>
                )}
                {adminSubTab === 'Branches' && (
                  <tr>
                    <th className="sortable">▴ S.No</th>
                    <th>Society Name</th>
                    <th>Branch Name</th>
                    <th>Edit</th>
                    <th>Remove</th>
                  </tr>
                )}
                {adminSubTab === 'Route_Details' && (
                  <tr>
                    <th className="sortable">▴ S.No</th>
                    <th>Society</th>
                    <th>Branch</th>
                    <th>Registration No</th>
                    <th>Route Name</th>
                    <th>Start Point</th>
                    <th>Start Time</th>
                    <th>Distance(in kms)</th>
                    <th>Edit</th>
                    <th>Remove</th>
                  </tr>
                )}
                {adminSubTab === 'Handovers' && (
                  <tr>
                    <th className="sortable">▴ S.No</th>
                    <th>Society</th>
                    <th>Branch</th>
                    <th>Vehicle Reg.No</th>
                    <th>Handover Date</th>
                    <th>Staff / Driver</th>
                    <th>Status</th>
                    <th>Edit</th>
                    <th>Remove</th>
                  </tr>
                )}
                {adminSubTab === 'Issues' && (
                  <tr>
                    <th className="sortable">▴ S.No</th>
                    <th>Society</th>
                    <th>Branch</th>
                    <th>Vehicle Reg.No</th>
                    <th>Issue Date</th>
                    <th>Issue Description</th>
                    <th>Status</th>
                    <th>Edit</th>
                    <th>Remove</th>
                  </tr>
                )}
                {adminSubTab === 'Transfers' && (
                  <tr>
                    <th className="sortable">▴ S.No</th>
                    <th>Society</th>
                    <th>Branch</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Vehicle Reg.No</th>
                    <th>Transfer Branch</th>
                    <th>Transfer Date</th>
                    <th>CMR</th>
                    <th>Edit</th>
                    <th>Remove</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {adminLoading ? (
                  <tr>
                    <td colSpan="11" className="admin-loading-cell">
                      <div className="admin-table-loader-box">
                        <div className="admin-spinner" />
                        <p className="admin-loader-text">Loading {adminSubTab} records, please wait...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedAdminData.length > 0 ? (
                  paginatedAdminData.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td>{(adminCurrentPage - 1) * adminEntriesPerPage + idx + 1}</td>
                      {adminSubTab === 'Societies' && (
                        <td>{row.name || row.societyname || '-'}</td>
                      )}
                      {adminSubTab === 'Branches' && (
                        <>
                          <td>{row.society || '-'}</td>
                          <td>{row.branchname || row.name || '-'}</td>
                        </>
                      )}
                      {adminSubTab === 'Route_Details' && (
                        <>
                          <td>{row.society || '-'}</td>
                          <td>{row.branch || '-'}</td>
                          <td><strong>{row.regno || '-'}</strong></td>
                          <td>{row.routename || '-'}</td>
                          <td>{row.startpoint || '-'}</td>
                          <td>{row.starttime || '-'}</td>
                          <td>{row.distance || '0'}</td>
                        </>
                      )}
                      {adminSubTab === 'Handovers' && (
                        <>
                          <td>{row.society || '-'}</td>
                          <td>{row.branch || '-'}</td>
                          <td><strong>{row.regno || '-'}</strong></td>
                          <td>{row.date || '-'}</td>
                          <td>{row.driver || '-'}</td>
                          <td>{row.status || 'Completed'}</td>
                        </>
                      )}
                      {adminSubTab === 'Issues' && (
                        <>
                          <td>{row.society || '-'}</td>
                          <td>{row.branch || '-'}</td>
                          <td><strong>{row.regno || '-'}</strong></td>
                          <td>{row.date || '-'}</td>
                          <td>{row.description || '-'}</td>
                          <td>{row.status || 'Pending'}</td>
                        </>
                      )}
                      {adminSubTab === 'Transfers' && (
                        <>
                          <td>{row.society || '-'}</td>
                          <td>{row.branch || '-'}</td>
                          <td>{row.make || '-'}</td>
                          <td>{row.model || '-'}</td>
                          <td><strong>{row.regno || '-'}</strong></td>
                          <td>{row.transferbranch || '-'}</td>
                          <td>{row.transferdate || '-'}</td>
                          <td>{row.cmr || '-'}</td>
                        </>
                      )}
                      <td>
                        <button
                          type="button"
                          className="admin-icon-btn edit"
                          title="Edit"
                          onClick={() => {
                            setNewStaffName(row.name || row.societyname || row.routename || '');
                            setShowNewStaffModal(true);
                          }}
                        >
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="admin-icon-btn remove"
                          title="Remove"
                          onClick={() => handleDeleteAdminRecord(row.id)}
                        >
                          <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="empty-cell">
                      No data available in table
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="admin-table-footer">
            <div>
              Showing {filteredAdminData.length === 0 ? 0 : (adminCurrentPage - 1) * adminEntriesPerPage + 1} to {Math.min(adminCurrentPage * adminEntriesPerPage, filteredAdminData.length)} of {filteredAdminData.length} entries
            </div>
            <div className="admin-pagination-group">
              <button
                type="button"
                className="admin-pbtn"
                disabled={adminCurrentPage === 1}
                onClick={() => setAdminCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalAdminPages) }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  type="button"
                  className={`admin-pbtn ${adminCurrentPage === num ? 'active' : ''}`}
                  onClick={() => setAdminCurrentPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="admin-pbtn"
                disabled={adminCurrentPage >= totalAdminPages}
                onClick={() => setAdminCurrentPage(p => Math.min(totalAdminPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* Modal Popup for New Record */}
        {showNewStaffModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowNewStaffModal(false)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Add New Record - {adminSubTab}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowNewStaffModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                setStaffSuccessToast('Record created successfully!');
                setShowNewStaffModal(false);
                setTimeout(() => setStaffSuccessToast(''), 3000);
              }}>
                <div className="admin-modal-body">
                  <div className="admin-form-field">
                    <label>Record Name / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder={`Enter ${adminSubTab} name...`}
                      value={newStaffName}
                      onChange={e => setNewStaffName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-modal-btn-cancel"
                    onClick={() => setShowNewStaffModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-modal-btn-submit"
                    disabled={newStaffSubmitting}
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Admin;
