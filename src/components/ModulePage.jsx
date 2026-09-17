import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Bus, FileText, Fuel, Droplet, Settings, Wrench, AlertTriangle, Battery, Disc
} from 'lucide-react';
import CustomTabs from './CustomTabs';
import MainLayout from './MainLayout';
import { SIDEBAR_MODULE_CONFIG } from '../config/modules.config';
import { createStaffItem, deleteStaffItem } from '../services/api';

const MODULE_ICONS = {
  Staff: Users,
  Vehicles: Bus,
  Certificates: FileText,
  Fuels: Fuel,
  'Ad-Blue': Droplet,
  Services: Settings,
  'Repair Bills': Wrench,
  'Bus Breakdown': AlertTriangle,
  Batteries: Battery,
  'Vehicle Tyres': Disc,
};

const ModulePage = ({ moduleKey }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  const currentConfig = SIDEBAR_MODULE_CONFIG[moduleKey];

  const [moduleSubTab, setModuleSubTab] = useState(
    currentConfig?.subTabs[0]?.id || ''
  );
  const [moduleData, setModuleData] = useState([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [moduleEntriesPerPage, setModuleEntriesPerPage] = useState(10);
  const [moduleCurrentPage, setModuleCurrentPage] = useState(1);
  const [moduleCopiedNotification, setModuleCopiedNotification] = useState(false);

  // New record modal state
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffSubmitting, setNewStaffSubmitting] = useState(false);
  const [staffSuccessToast, setStaffSuccessToast] = useState('');

  const cacheRef = useRef({});

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

  const fetchModuleData = async (subTab, branch, forceRefresh = false) => {
    if (!currentConfig) return;
    const activeSub = subTab || currentConfig.subTabs[0].id;
    const cacheKey = `${moduleKey}_${activeSub}_${branch || 'ALL'}`;
    if (!forceRefresh && cacheRef.current[cacheKey]) {
      setModuleData(cacheRef.current[cacheKey]);
      setModuleCurrentPage(1);
      setModuleLoading(false);
      return;
    }

    setModuleLoading(true);
    try {
      const res = await currentConfig.apiFn(activeSub, branch);
      const data = res?.data || [];
      cacheRef.current[cacheKey] = data;
      setModuleData(data);
      setModuleCurrentPage(1);
    } catch (err) {
      console.error(`Error fetching ${moduleKey} data:`, err);
      setModuleData([]);
    } finally {
      setModuleLoading(false);
    }
  };

  useEffect(() => {
    if (currentConfig) {
      const validSub = currentConfig.subTabs.some(s => s.id === moduleSubTab)
        ? moduleSubTab
        : currentConfig.subTabs[0].id;
      if (validSub !== moduleSubTab) {
        setModuleSubTab(validSub);
      }
      fetchModuleData(validSub, selectedBranch);
    }
  }, [moduleKey, moduleSubTab, selectedBranch]);

  const filteredModuleData = useMemo(() => {
    if (!moduleSearchQuery.trim()) return moduleData;
    const q = moduleSearchQuery.toLowerCase();
    return moduleData.filter(item =>
      Object.entries(item).some(([k, val]) =>
        k !== '_id' && k !== 'id' && val && String(val).toLowerCase().includes(q)
      )
    );
  }, [moduleData, moduleSearchQuery]);

  const totalModulePages = Math.ceil(filteredModuleData.length / moduleEntriesPerPage) || 1;
  const paginatedModuleData = useMemo(() => {
    const start = (moduleCurrentPage - 1) * moduleEntriesPerPage;
    return filteredModuleData.slice(start, start + moduleEntriesPerPage);
  }, [filteredModuleData, moduleCurrentPage, moduleEntriesPerPage]);

  const activeSub = moduleSubTab || currentConfig?.subTabs[0]?.id;
  const activeCols = typeof currentConfig?.columns === 'function'
    ? currentConfig.columns(activeSub)
    : (currentConfig?.columns || []);

  const handleCopyModuleTable = (cols) => {
    if (!filteredModuleData.length) return;
    const headerRow = cols.map(c => c.label).join('\t');
    const dataRows = filteredModuleData.map(row => cols.map(c => row[c.key] ?? '').join('\t'));
    const tsv = [headerRow, ...dataRows].join('\n');
    navigator.clipboard.writeText(tsv);
    setModuleCopiedNotification(true);
    setTimeout(() => setModuleCopiedNotification(false), 2000);
  };

  const handleExportModuleCSV = (cols) => {
    if (!filteredModuleData.length) return;
    const headerRow = cols.map(c => c.label).join(',');
    const dataRows = filteredModuleData.map(row =>
      cols.map(c => `"${String(row[c.key] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${moduleKey}_${moduleSubTab}_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintModuleTable = () => {
    window.print();
  };

  const handleDeleteRecord = async (subTab, id) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    try {
      if (moduleKey === 'Staff') {
        await deleteStaffItem(subTab, id);
      }
      cacheRef.current = {};
      fetchModuleData(subTab, selectedBranch, true);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item.');
    }
  };

  const handleCreateRecord = async (e) => {
    e.preventDefault();
    if (!newStaffName.trim()) {
      alert('Please enter a name');
      return;
    }
    setNewStaffSubmitting(true);
    try {
      if (moduleKey === 'Staff') {
        await createStaffItem(activeSub, {
          name: newStaffName.trim(),
          staffname: newStaffName.trim(),
          cleanername: newStaffName.trim(),
          branch: selectedBranch !== 'ALL' && selectedBranch !== 'College' ? selectedBranch : undefined
        });
      }
      setShowNewStaffModal(false);
      setNewStaffName('');
      setStaffSuccessToast('Record created successfully!');
      setTimeout(() => setStaffSuccessToast(''), 3000);
      cacheRef.current = {};
      fetchModuleData(activeSub, selectedBranch, true);
    } catch (err) {
      console.error('Failed to create record:', err);
      alert('Error creating record: ' + (err.response?.data?.message || err.message));
    } finally {
      setNewStaffSubmitting(false);
    }
  };

  const IconComponent = MODULE_ICONS[moduleKey] || FileText;

  return (
    <MainLayout
      mobileLeftOpen={mobileLeftOpen}
      setMobileLeftOpen={setMobileLeftOpen}
      activeTab={moduleKey}
      user={user}
      handleLogout={handleLogout}
    >
      <div className="admin-page-container">
        {/* Module Header Badge */}
        <div className="module-top-badge-wrapper">
          <div className="module-top-badge">
            <div className="module-top-badge-icon">
              <IconComponent size={16} />
            </div>
            <div className="module-top-badge-label">{moduleKey}</div>
          </div>
        </div>

        {/* Subtabs Ribbon using CustomTabs */}
        {currentConfig && currentConfig.subTabs.length > 1 && (
          <div className="flex justify-center mb-6 mt-4 max-w-full overflow-x-auto">
            <CustomTabs
              activeTab={activeSub}
              onChange={(id) => setModuleSubTab(id)}
              tabs={currentConfig.subTabs}
            />
          </div>
        )}

        {/* Action Buttons: View Data / Add New */}
        <div className="admin-actions-bar">
          <button
            type="button"
            className="admin-action-btn"
            disabled={moduleLoading}
            onClick={() => fetchModuleData(activeSub, selectedBranch, true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            {moduleLoading ? (
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
            Add New
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
              <button
                type="button"
                className="admin-export-btn"
                onClick={() => handleCopyModuleTable(activeCols)}
                title="Copy to clipboard"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                Copy
              </button>
              <button type="button" className="admin-export-btn" onClick={handlePrintModuleTable} title="Print table">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                Print
              </button>
              <button type="button" className="admin-export-btn" onClick={() => handleExportModuleCSV(activeCols)} title="Export CSV">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                csv
              </button>
              <button type="button" className="admin-export-btn" onClick={() => handleExportModuleCSV(activeCols)} title="Export PDF">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                pdf
              </button>
              <button type="button" className="admin-export-btn" onClick={() => handleExportModuleCSV(activeCols)} title="Export Excel">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                Excel
              </button>
              {moduleCopiedNotification && (
                <span className="admin-toast-feedback">Copied!</span>
              )}
            </div>

            {/* Entries Control */}
            <div className="admin-entries-control">
              <span>Show</span>
              <select
                value={moduleEntriesPerPage}
                onChange={(e) => {
                  setModuleEntriesPerPage(Number(e.target.value));
                  setModuleCurrentPage(1);
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
                value={moduleSearchQuery}
                onChange={(e) => {
                  setModuleSearchQuery(e.target.value);
                  setModuleCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table responsive */}
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th className="sortable">▴ S.No</th>
                  {activeCols.map(col => (
                    <th key={col.key}>{col.label}</th>
                  ))}
                  <th>Edit</th>
                  <th>Remove</th>
                </tr>
              </thead>
              <tbody>
                {moduleLoading ? (
                  <tr>
                    <td colSpan={activeCols.length + 3} className="admin-loading-cell">
                      <div className="admin-table-loader-box">
                        <div className="admin-spinner" />
                        <p className="admin-loader-text">Loading {activeSub} records, please wait...</p>
                      </div>
                    </td>
                  </tr>
                ) : paginatedModuleData.length > 0 ? (
                  paginatedModuleData.map((row, idx) => (
                    <tr key={row._id || row.id || idx}>
                      <td>{(moduleCurrentPage - 1) * moduleEntriesPerPage + idx + 1}</td>
                      {activeCols.map(col => (
                        <td key={col.key}>
                          {String(row[col.key] ?? '-')}
                        </td>
                      ))}
                      <td>
                        <button
                          type="button"
                          className="admin-icon-btn edit"
                          title="Edit"
                          onClick={() => {
                            setNewStaffName(row.name || row.staffname || '');
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
                          onClick={() => handleDeleteRecord(activeSub, row._id || row.id)}
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
                    <td colSpan={activeCols.length + 3} className="empty-cell">
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
              Showing {filteredModuleData.length === 0 ? 0 : (moduleCurrentPage - 1) * moduleEntriesPerPage + 1} to {Math.min(moduleCurrentPage * moduleEntriesPerPage, filteredModuleData.length)} of {filteredModuleData.length} entries
            </div>
            <div className="admin-pagination-group">
              <button
                type="button"
                className="admin-pbtn"
                disabled={moduleCurrentPage === 1}
                onClick={() => setModuleCurrentPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalModulePages) }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  type="button"
                  className={`admin-pbtn ${moduleCurrentPage === num ? 'active' : ''}`}
                  onClick={() => setModuleCurrentPage(num)}
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                className="admin-pbtn"
                disabled={moduleCurrentPage >= totalModulePages}
                onClick={() => setModuleCurrentPage(p => Math.min(totalModulePages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>

        {/* New Item Modal */}
        {showNewStaffModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowNewStaffModal(false)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>Add New Record - {moduleKey} ({activeSub})</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowNewStaffModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleCreateRecord}>
                <div className="admin-modal-body">
                  <div className="admin-form-field">
                    <label>Record Name / Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="Enter title or name..."
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
                    {newStaffSubmitting ? 'Saving...' : 'Save Record'}
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

export default ModulePage;
