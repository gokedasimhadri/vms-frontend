import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Bus, FileText, Fuel, Droplet, Settings, Wrench, AlertTriangle, Battery, Disc
} from 'lucide-react';
import CustomTabs from './CustomTabs';
import MainLayout from './MainLayout';
import ExportButtons from './ExportButtons';
import { SIDEBAR_MODULE_CONFIG } from '../config/modules.config';
import { exportToCSV, exportToExcel, exportToPDF, printTable } from '../utils/exportUtils';
import {
  createStaffItem, updateStaffItem, deleteStaffItem,
  createVehicleItem, updateVehicleItem, deleteVehicleItem,
  createCertificateItem, updateCertificateItem, deleteCertificateItem,
  createFuelItem, updateFuelItem, deleteFuelItem,
  createAdBlueItem, updateAdBlueItem, deleteAdBlueItem,
  createServiceItem, updateServiceItem, deleteServiceItem,
  createRepairBill, updateRepairBill, deleteRepairBill,
  createBusBreakdownItem, updateBusBreakdownItem, deleteBusBreakdownItem,
  createBatteryItem, updateBatteryItem, deleteBatteryItem,
  createVehicleTyreItem, updateVehicleTyreItem, deleteVehicleTyreItem,
  createAdminItem, updateAdminItem, deleteAdminItem
} from '../services/api';

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
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  const currentConfig = SIDEBAR_MODULE_CONFIG[moduleKey];

  const requestedTab = new URLSearchParams(location.search).get('tab');
  const validRequestedTab = currentConfig?.subTabs?.some(t => t.id === requestedTab) ? requestedTab : null;

  const [moduleSubTab, setModuleSubTab] = useState(
    validRequestedTab || currentConfig?.subTabs[0]?.id || ''
  );

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(location.search).get('tab');
    if (tabFromUrl && currentConfig?.subTabs?.some(t => t.id === tabFromUrl)) {
      setModuleSubTab(tabFromUrl);
    }
  }, [location.search, currentConfig]);
  const [moduleData, setModuleData] = useState([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [moduleEntriesPerPage, setModuleEntriesPerPage] = useState(10);
  const [moduleCurrentPage, setModuleCurrentPage] = useState(1);
  const [moduleCopiedNotification, setModuleCopiedNotification] = useState(false);

  // Second-level nested tab state (e.g. for Ad_Bus_Fillings)
  const [nestedSubTab, setNestedSubTab] = useState('');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [busSearchRegNo, setBusSearchRegNo] = useState('');
  const [busRegisterNoFilter, setBusRegisterNoFilter] = useState('');
  const [busDataFetched, setBusDataFetched] = useState(false);

  // Generic modal state for Add & Edit
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

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

  const activeSub = moduleSubTab || currentConfig?.subTabs[0]?.id;
  const currentSubConfig = currentConfig?.subTabs?.find(s => s.id === activeSub);

  useEffect(() => {
    if (currentSubConfig?.nestedTabs && currentSubConfig.nestedTabs.length > 0) {
      setNestedSubTab(currentSubConfig.nestedTabs[0].id);
    } else {
      setNestedSubTab('');
    }
    setBusDataFetched(false);
    setBusRegisterNoFilter('');
  }, [activeSub]);

  const filteredModuleData = useMemo(() => {
    let result = moduleData;

    if (activeSub === 'adbluebusfill') {
      if (!busDataFetched) {
        return [];
      }
      if (nestedSubTab === 'entry_data' && busRegisterNoFilter.trim()) {
        const bq = busRegisterNoFilter.trim().toLowerCase();
        result = result.filter(item =>
          (item.regno && String(item.regno).toLowerCase().includes(bq)) ||
          (item.vehicleno && String(item.vehicleno).toLowerCase().includes(bq))
        );
      }
      if (nestedSubTab === 'generate_report') {
        if (reportFromDate) {
          result = result.filter(item => {
            const d = item.date || item.filldate;
            if (!d) return true;
            let itemDate = d;
            if (typeof d === 'string' && d.includes('-')) {
              const parts = d.split('-');
              if (parts[0].length === 2 && parts[2]?.length === 4) {
                itemDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }
            return itemDate >= reportFromDate;
          });
        }
        if (reportToDate) {
          result = result.filter(item => {
            const d = item.date || item.filldate;
            if (!d) return true;
            let itemDate = d;
            if (typeof d === 'string' && d.includes('-')) {
              const parts = d.split('-');
              if (parts[0].length === 2 && parts[2]?.length === 4) {
                itemDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }
            return itemDate <= reportToDate;
          });
        }
      }
      if (nestedSubTab === 'search_bus_report' && busSearchRegNo.trim()) {
        const bq = busSearchRegNo.trim().toLowerCase();
        result = result.filter(item =>
          (item.regno && String(item.regno).toLowerCase().includes(bq)) ||
          (item.vehicleno && String(item.vehicleno).toLowerCase().includes(bq))
        );
      }
    }

    if (!moduleSearchQuery.trim()) return result;
    const q = moduleSearchQuery.toLowerCase();
    return result.filter(item =>
      Object.entries(item).some(([k, val]) =>
        k !== '_id' && k !== 'id' && val && String(val).toLowerCase().includes(q)
      )
    );
  }, [moduleData, moduleSearchQuery, nestedSubTab, activeSub, busDataFetched, busRegisterNoFilter, reportFromDate, reportToDate, busSearchRegNo]);

  const totalModulePages = Math.ceil(filteredModuleData.length / moduleEntriesPerPage) || 1;
  const paginatedModuleData = useMemo(() => {
    const start = (moduleCurrentPage - 1) * moduleEntriesPerPage;
    return filteredModuleData.slice(start, start + moduleEntriesPerPage);
  }, [filteredModuleData, moduleCurrentPage, moduleEntriesPerPage]);

  const activeCols = typeof currentConfig?.columns === 'function'
    ? currentConfig.columns(activeSub, nestedSubTab)
    : (currentConfig?.columns || []);

  const isReportTab = activeSub === 'adbluebusfill' && nestedSubTab === 'generate_report';
  const hasActionCols = !isReportTab;

  const handleCopyModuleTable = (cols) => {
    if (!filteredModuleData.length) return;
    const headerRow = cols.map(c => c.label).join('\t');
    const dataRows = filteredModuleData.map(row => cols.map(c => row[c.key] ?? '').join('\t'));
    const tsv = [headerRow, ...dataRows].join('\n');
    navigator.clipboard.writeText(tsv);
    setModuleCopiedNotification(true);
    setTimeout(() => setModuleCopiedNotification(false), 2000);
  };

  const getModuleExportData = (cols) => {
    if (!filteredModuleData.length) return null;
    const headers = cols.map(c => c.label);
    const rows = filteredModuleData.map(row => cols.map(c => row[c.key] ?? ''));
    return { headers, rows };
  };

  const handleExportModuleCSV = (cols) => {
    const data = getModuleExportData(cols);
    if (data) exportToCSV(data.headers, data.rows, `${moduleKey}_${moduleSubTab}_Data`);
  };

  const handleExportModulePDF = (cols) => {
    const data = getModuleExportData(cols);
    if (data) exportToPDF(data.headers, data.rows, `${moduleKey}_${moduleSubTab}_Data`, `${moduleKey} - ${moduleSubTab}`);
  };

  const handleExportModuleExcel = (cols) => {
    const data = getModuleExportData(cols);
    if (data) exportToExcel(data.headers, data.rows, `${moduleKey}_${moduleSubTab}_Data`);
  };

  const handlePrintModuleTable = () => {
    printTable('.admin-data-table', `${moduleKey} - ${moduleSubTab}`);
  };

  // Open modal for Adding a new record
  const handleOpenAddModal = () => {
    setEditingId(null);
    const initial = {};
    activeCols.forEach(col => {
      initial[col.key] = '';
    });
    if (selectedBranch && selectedBranch !== 'ALL' && selectedBranch !== 'College') {
      initial.branch = selectedBranch;
    }
    setFormData(initial);
    setShowModal(true);
  };

  // Open modal for Editing an existing record
  const handleOpenEditModal = (row) => {
    setEditingId(row._id || row.id);
    const initial = {};
    activeCols.forEach(col => {
      initial[col.key] = row[col.key] ?? '';
    });
    setFormData(initial);
    setShowModal(true);
  };

  // Generic delete dispatcher
  const handleDeleteRecord = async (subTab, id) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    try {
      if (moduleKey === 'Staff') await deleteStaffItem(subTab, id);
      else if (moduleKey === 'Vehicles') await deleteVehicleItem(subTab, id);
      else if (moduleKey === 'Certificates') await deleteCertificateItem(subTab, id);
      else if (moduleKey === 'Fuels') await deleteFuelItem(subTab, id);
      else if (moduleKey === 'Ad-Blue') await deleteAdBlueItem(subTab, id);
      else if (moduleKey === 'Services') await deleteServiceItem(subTab, id);
      else if (moduleKey === 'Repair Bills') await deleteRepairBill(id);
      else if (moduleKey === 'Bus Breakdown') await deleteBusBreakdownItem(id);
      else if (moduleKey === 'Batteries') await deleteBatteryItem(subTab, id);
      else if (moduleKey === 'Vehicle Tyres') await deleteVehicleTyreItem(subTab, id);
      else if (moduleKey === 'Admin') await deleteAdminItem(subTab, id);

      cacheRef.current = {};
      fetchModuleData(subTab, selectedBranch, true);
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item.');
    }
  };

  // Generic create/update dispatcher
  const handleSaveRecord = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.branch && selectedBranch !== 'ALL' && selectedBranch !== 'College') {
        payload.branch = selectedBranch;
      }

      if (editingId) {
        // UPDATE
        if (moduleKey === 'Staff') await updateStaffItem(activeSub, editingId, payload);
        else if (moduleKey === 'Vehicles') await updateVehicleItem(activeSub, editingId, payload);
        else if (moduleKey === 'Certificates') await updateCertificateItem(activeSub, editingId, payload);
        else if (moduleKey === 'Fuels') await updateFuelItem(activeSub, editingId, payload);
        else if (moduleKey === 'Ad-Blue') await updateAdBlueItem(activeSub, editingId, payload);
        else if (moduleKey === 'Services') await updateServiceItem(activeSub, editingId, payload);
        else if (moduleKey === 'Repair Bills') await updateRepairBill(editingId, payload);
        else if (moduleKey === 'Bus Breakdown') await updateBusBreakdownItem(editingId, payload);
        else if (moduleKey === 'Batteries') await updateBatteryItem(activeSub, editingId, payload);
        else if (moduleKey === 'Vehicle Tyres') await updateVehicleTyreItem(activeSub, editingId, payload);
        else if (moduleKey === 'Admin') await updateAdminItem(activeSub, editingId, payload);
        setSuccessToast('Record updated successfully!');
      } else {
        // CREATE
        if (moduleKey === 'Staff') await createStaffItem(activeSub, payload);
        else if (moduleKey === 'Vehicles') await createVehicleItem(activeSub, payload);
        else if (moduleKey === 'Certificates') await createCertificateItem(activeSub, payload);
        else if (moduleKey === 'Fuels') await createFuelItem(activeSub, payload);
        else if (moduleKey === 'Ad-Blue') await createAdBlueItem(activeSub, payload);
        else if (moduleKey === 'Services') await createServiceItem(activeSub, payload);
        else if (moduleKey === 'Repair Bills') await createRepairBill(payload);
        else if (moduleKey === 'Bus Breakdown') await createBusBreakdownItem(payload);
        else if (moduleKey === 'Batteries') await createBatteryItem(activeSub, payload);
        else if (moduleKey === 'Vehicle Tyres') await createVehicleTyreItem(activeSub, payload);
        else if (moduleKey === 'Admin') await createAdminItem(activeSub, payload);
        setSuccessToast('Record created successfully!');
      }

      setShowModal(false);
      setTimeout(() => setSuccessToast(''), 3000);
      cacheRef.current = {};
      fetchModuleData(activeSub, selectedBranch, true);
    } catch (err) {
      console.error('Failed to save record:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
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

        {/* Full-width Rectangular Tabs Ribbon */}
        {currentConfig && currentConfig.subTabs.length > 0 && (
          <div className="module-nav-ribbon-container">
            {/* Top Level SubTabs */}
            <div className="module-nav-ribbon">
              {currentConfig.subTabs.map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  className={`module-nav-tab ${activeSub === tab.id ? 'active' : ''}`}
                  onClick={() => {
                    setModuleSubTab(tab.id);
                    setBusDataFetched(false);
                    setBusRegisterNoFilter('');
                    if (tab.nestedTabs && tab.nestedTabs.length > 0) {
                      setNestedSubTab(tab.nestedTabs[0].id);
                    } else {
                      setNestedSubTab('');
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Second-Level Nested Tabs (e.g. for Ad_Bus_Fillings: Entry Data | Generate Report | Search Bus Report) */}
            {currentSubConfig?.nestedTabs && currentSubConfig.nestedTabs.length > 0 && (
              <div className="module-nested-nav-ribbon">
                {currentSubConfig.nestedTabs.map(nt => (
                  <button
                    key={nt.id}
                    type="button"
                    className={`module-nested-nav-tab ${nestedSubTab === nt.id ? 'active' : ''}`}
                    onClick={() => {
                      setNestedSubTab(nt.id);
                      setBusDataFetched(false);
                      setBusRegisterNoFilter('');
                    }}
                  >
                    {nt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ad_Bus_Fillings -> Generate Report Controls (fromdate: todate: getdata as per image) */}
        {activeSub === 'adbluebusfill' && nestedSubTab === 'generate_report' && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '15px', marginTop: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#212529' }}>fromdate:</label>
              <input
                type="date"
                value={reportFromDate}
                onChange={e => setReportFromDate(e.target.value)}
                style={{ height: '34px', width: '200px', padding: '6px 12px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', background: '#ffffff', color: '#495057', outline: 'none' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#212529' }}>todate:</label>
              <input
                type="date"
                value={reportToDate}
                onChange={e => setReportToDate(e.target.value)}
                style={{ height: '34px', width: '200px', padding: '6px 12px', fontSize: '13px', border: '1px solid #ced4da', borderRadius: '4px', background: '#ffffff', color: '#495057', outline: 'none' }}
              />
            </div>
            <button
              type="button"
              className="bus-filling-btn-getdata"
              disabled={moduleLoading}
              onClick={() => {
                setBusDataFetched(true);
                fetchModuleData(activeSub, selectedBranch, true);
              }}
            >
              {moduleLoading ? 'Loading...' : 'getdata'}
            </button>
          </div>
        )}

        {/* Ad_Bus_Fillings -> Search Bus Report Controls (as per reference image) */}
        {activeSub === 'adbluebusfill' && nestedSubTab === 'search_bus_report' && (
          <div className="bus-filling-entry-bar">
            <label className="bus-filling-entry-label">Register No:</label>
            <div className="bus-filling-entry-actions">
              <input
                type="text"
                className="bus-filling-entry-input"
                value={busSearchRegNo}
                onChange={e => setBusSearchRegNo(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setBusDataFetched(true);
                    fetchModuleData(activeSub, selectedBranch, true);
                  }
                }}
              />
              <button
                type="button"
                className="bus-filling-btn-getdata"
                disabled={moduleLoading}
                onClick={() => {
                  setBusDataFetched(true);
                  fetchModuleData(activeSub, selectedBranch, true);
                }}
              >
                {moduleLoading ? 'Loading...' : 'getdata'}
              </button>
            </div>
          </div>
        )}

        {/* Ad_Bus_Fillings -> Entry Data Controls (as per reference image) */}
        {activeSub === 'adbluebusfill' && nestedSubTab === 'entry_data' && (
          <div className="bus-filling-entry-bar">
            <label className="bus-filling-entry-label">Register No:</label>
            <div className="bus-filling-entry-actions">
              <input
                type="text"
                className="bus-filling-entry-input"
                value={busRegisterNoFilter}
                onChange={e => setBusRegisterNoFilter(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setBusDataFetched(true);
                    fetchModuleData(activeSub, selectedBranch, true);
                  }
                }}
              />
              <button
                type="button"
                className="bus-filling-btn-getdata"
                disabled={moduleLoading}
                onClick={() => {
                  setBusDataFetched(true);
                  fetchModuleData(activeSub, selectedBranch, true);
                }}
              >
                {moduleLoading ? 'Loading...' : 'getdata'}
              </button>
              <button
                type="button"
                className="bus-filling-btn-addnew"
                onClick={handleOpenAddModal}
              >
                Add New
              </button>
            </div>
          </div>
        )}

        {/* Default Action Buttons: View Data / Add New for other subtabs */}
        {activeSub !== 'adbluebusfill' && (
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
            {(!nestedSubTab || nestedSubTab === 'entry_data') && (
              <button
                type="button"
                className="admin-action-btn"
                onClick={handleOpenAddModal}
              >
                Add New Record
              </button>
            )}
          </div>
        )}

        {/* Success Banner */}
        {successToast && (
          <div className="mb-4 p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded text-sm text-center font-medium">
            {successToast}
          </div>
        )}

        {/* Main Data Table Card */}
        <div className="admin-table-card">
          {/* Table Toolbar */}
          <div className="admin-table-toolbar">
<<<<<<< Updated upstream
            {/* Export Buttons */}
            <div className="admin-export-group">
              <ExportButtons
                onCopy={() => handleCopyModuleTable(activeCols)}
                onPrint={handlePrintModuleTable}
                onCSV={() => handleExportModuleCSV(activeCols)}
                onPDF={() => handleExportModulePDF(activeCols)}
                onExcel={() => handleExportModuleExcel(activeCols)}
              />
              {moduleCopiedNotification && (
                <span className="admin-toast-feedback">Copied!</span>
              )}
            </div>
=======
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              {/* Export Buttons */}
              <div className="admin-export-group">
                <button
                  type="button"
                  className="admin-export-btn"
                  onClick={() => handleCopyModuleTable(activeCols)}
                  title="Copy to clipboard"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                  Copy
                </button>
                <button
                  type="button"
                  className="admin-export-btn"
                  onClick={handlePrintModuleTable}
                  title="Print table"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                  Print
                </button>
                <button
                  type="button"
                  className="admin-export-btn"
                  onClick={() => handleExportModuleCSV(activeCols)}
                  title="Export CSV"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                  csv
                </button>
                <button
                  type="button"
                  className="admin-export-btn"
                  onClick={() => handleExportModuleCSV(activeCols)}
                  title="Export PDF"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                  pdf
                </button>
                <button
                  type="button"
                  className="admin-export-btn"
                  onClick={() => handleExportModuleCSV(activeCols)}
                  title="Export Excel"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                  Excel
                </button>
                {moduleCopiedNotification && (
                  <span className="admin-toast-feedback">Copied!</span>
                )}
              </div>
>>>>>>> Stashed changes

              {/* Entries control */}
              <div className="admin-entries-control">
                <span>Show</span>
                <select
                  value={moduleEntriesPerPage}
                  onChange={e => {
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
            </div>

            {/* Search control */}
            <div className="admin-search-control">
              <label>Search:</label>
              <input
                type="text"
                value={moduleSearchQuery}
                onChange={e => {
                  setModuleSearchQuery(e.target.value);
                  setModuleCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Table Element */}
          <div className="admin-table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th style={{ width: '60px' }}>
                    {(activeSub === 'adblue' || nestedSubTab === 'search_bus_report') ? 'S.No' : '▴ S.No'}
                  </th>
                  {activeCols.map((col, idx) => (
                    <th key={col.key || idx}>
                      {idx === 0 && activeSub === 'adblue'
                        ? `▴ ${col.label}`
                        : col.label}
                    </th>
                  ))}
                  {hasActionCols && (
                    <>
                      <th style={{ width: '140px', minWidth: '120px' }}>Edit</th>
                      <th style={{ width: '140px', minWidth: '120px' }}>
                        {activeSub === 'adblue' ? 'Remove' : 'Delete'}
                      </th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {moduleLoading ? (
                  <tr>
                    <td colSpan={activeCols.length + (hasActionCols ? 3 : 1)} className="empty-cell">
                      <span className="btn-spinner" style={{ marginRight: '8px' }} />
                      Loading records...
                    </td>
                  </tr>
                ) : paginatedModuleData.length > 0 ? (
                  paginatedModuleData.map((row, index) => (
                    <tr key={row._id || row.id || index}>
                      <td><strong>{(moduleCurrentPage - 1) * moduleEntriesPerPage + index + 1}</strong></td>
                      {activeCols.map(col => (
                        <td key={col.key} style={{ fontWeight: 600 }}>
                          {row[col.key] !== undefined && row[col.key] !== null
                            ? String(row[col.key])
                            : '-'}
                        </td>
                      ))}
                      {hasActionCols && (
                        <>
                          <td>
                            <button
                              type="button"
                              className="admin-icon-btn edit"
                              title="Edit"
                              onClick={() => handleOpenEditModal(row)}
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
                              title={activeSub === 'adblue' ? 'Remove' : 'Delete'}
                              onClick={() => handleDeleteRecord(activeSub, row._id || row.id)}
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={activeCols.length + (hasActionCols ? 3 : 1)} className="empty-cell">
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

        {/* Dynamic Modal for Create / Edit */}
        {showModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="admin-modal-card" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{editingId ? 'Edit' : 'Add New'} Record - {moduleKey} ({activeSub})</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveRecord}>
                <div className="admin-modal-body" style={{ maxHeight: '65vh', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {activeCols.map(col => (
                    <div key={col.key} className="admin-form-field" style={{ gridColumn: activeCols.length === 1 ? 'span 2' : 'span 1' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                        {col.label}
                      </label>
                      <input
                        type="text"
                        placeholder={`Enter ${col.label.toLowerCase()}...`}
                        value={formData[col.key] ?? ''}
                        onChange={e => setFormData({ ...formData, [col.key]: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '8px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          fontSize: '13px'
                        }}
                      />
                    </div>
                  ))}
                </div>
                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="admin-modal-btn-cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="admin-modal-btn-submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingId ? 'Update Record' : 'Save Record'}
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
