import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users, Bus, FileText, Fuel, Droplet, Settings, Wrench, AlertTriangle, Battery, Disc
} from 'lucide-react';
import CustomTabs from './CustomTabs';
import MainLayout from './MainLayout';
import ExportButtons from './ExportButtons';
import { TableLoader } from './Loader';
import { SIDEBAR_MODULE_CONFIG } from '../config/modules.config';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import ConfirmModal from './ConfirmModal';
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
  createAdminItem, updateAdminItem, deleteAdminItem,
  getAdminData, getStaffData
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

  const currentSubTabObj = useMemo(() => {
    return currentConfig?.subTabs?.find(t => t.id === moduleSubTab);
  }, [currentConfig, moduleSubTab]);

  const [moduleChildSubTab, setModuleChildSubTab] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  useEffect(() => {
    if (currentSubTabObj?.childSubTabs?.length > 0) {
      setModuleChildSubTab(currentSubTabObj.childSubTabs[0].id);
    } else {
      setModuleChildSubTab('');
    }
  }, [currentSubTabObj]);

  useEffect(() => {
    const tabFromUrl = new URLSearchParams(location.search).get('tab');
    if (tabFromUrl && currentConfig?.subTabs?.some(t => t.id === tabFromUrl)) {
      setModuleSubTab(tabFromUrl);
    }
  }, [location.search, currentConfig]);
  const [moduleData, setModuleData] = useState([]);
  const [moduleLoading, setModuleLoading] = useState(true);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [moduleEntriesPerPage, setModuleEntriesPerPage] = useState(10);
  const [moduleCurrentPage, setModuleCurrentPage] = useState(1);

  // Second-level nested tab state (e.g. for Ad_Bus_Fillings)
  const [nestedSubTab, setNestedSubTab] = useState('');
  const [reportFromDate, setReportFromDate] = useState('');
  const [reportToDate, setReportToDate] = useState('');
  const [busSearchRegNo, setBusSearchRegNo] = useState('');
  const [busRegisterNoFilter, setBusRegisterNoFilter] = useState('');
  const [busDataFetched, setBusDataFetched] = useState(false);

  // Services Register No search & autocomplete state
  const [serviceRegNoInput, setServiceRegNoInput] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [appliedServiceRegNo, setAppliedServiceRegNo] = useState('');

  const serviceVehicleSuggestions = useMemo(() => {
    if (!serviceRegNoInput.trim()) return [];
    const q = serviceRegNoInput.trim().toLowerCase();
    const set = new Set();
    moduleData.forEach(item => {
      const reg = item.vehicleno || item.vehicleregno || item.busnumber || item.regno || '';
      if (reg && String(reg).toLowerCase().includes(q)) {
        set.add(String(reg).toUpperCase());
      }
    });
    return Array.from(set);
  }, [moduleData, serviceRegNoInput]);

  // Generic modal state for Add & Edit
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Custom Delete Confirm Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    subTab: null,
    id: null,
    itemName: '',
    loading: false
  });

  // Image preview modal state
  const [previewImageModal, setPreviewImageModal] = useState(null);

  // Metadata states for dropdowns
  const [societiesList, setSocietiesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);
  const [designationsList, setDesignationsList] = useState([]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const socRes = await getAdminData('societies', 'ALL').catch(() => null);
        const socData = Array.isArray(socRes) ? socRes : (Array.isArray(socRes?.data) ? socRes.data : []);
        const socNames = socData.map(item => item.name || item.societyname || item.society).filter(Boolean);
        setSocietiesList([...new Set(socNames)].sort());

        const branchRes = await getAdminData('branches', 'ALL').catch(() => null);
        const branchData = Array.isArray(branchRes) ? branchRes : (Array.isArray(branchRes?.data) ? branchRes.data : []);
        const branches = branchData.map(b => ({
          name: (b.name || b.branchname || '').trim(),
          society: (b.test || b.society || '').trim()
        })).filter(b => b.name);
        setBranchesList(branches);

        const desRes = await getStaffData({ type: 'designations' }, 'ALL').catch(() => null);
        const desData = Array.isArray(desRes?.data) ? desRes.data : (Array.isArray(desRes) ? desRes : []);
        const desNames = desData.map(d => d.name || d.designation).filter(Boolean);
        const defaultDes = ['DRIVER', 'BUS SUPERVISOR', 'CLEANER', 'MECHANIC', 'HELPER', 'ATTENDER', 'JUNIOR ASSISTANT', 'OFFICE SUBORDINATE'];
        setDesignationsList(Array.from(new Set([...desNames, ...defaultDes])).sort());
      } catch (e) {
        console.error('Failed to load form metadata:', e);
      }
    };
    fetchMetadata();
  }, []);

  const availableBranches = useMemo(() => {
    if (!formData.society) {
      return Array.from(new Set(branchesList.map(b => b.name))).sort();
    }
    const filtered = branchesList
      .filter(b => b.society.toLowerCase() === formData.society.toLowerCase())
      .map(b => b.name);
    return Array.from(new Set(filtered)).sort();
  }, [branchesList, formData.society]);

  const formatDateForInput = (val) => {
    if (!val) return '';
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const ddmmyyyy = str.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyy) {
      const [, d, m, y] = ddmmyyyy;
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const dt = new Date(str);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString().split('T')[0];
    }
    return str;
  };

  const cacheRef = useRef({});

  const handleImageFileChange = (e, key) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size exceeds 5MB limit. Please choose a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, [key]: reader.result }));
    };
    reader.readAsDataURL(file);
  };

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

    if (moduleKey === 'Services' && appliedServiceRegNo.trim()) {
      const q = appliedServiceRegNo.trim().toLowerCase();
      result = result.filter(item => {
        const reg = item.vehicleno || item.vehicleregno || item.busnumber || item.regno || '';
        return String(reg).toLowerCase().includes(q);
      });
    }

    if (moduleKey === 'Repair Bills' && activeSub === 'generatereport') {
      if (fromDate) {
        result = result.filter(item => {
          const d = item.repairdate || item.date || item.createdAt;
          if (!d) return true;
          let itemDate = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
          return itemDate >= fromDate;
        });
      }
      if (toDate) {
        result = result.filter(item => {
          const d = item.repairdate || item.date || item.createdAt;
          if (!d) return true;
          let itemDate = typeof d === 'string' ? d.slice(0, 10) : new Date(d).toISOString().slice(0, 10);
          return itemDate <= toDate;
        });
      }
    }

    if (!moduleSearchQuery.trim()) return result;
    const q = moduleSearchQuery.toLowerCase();
    return result.filter(item =>
      Object.entries(item).some(([k, val]) =>
        k !== '_id' && k !== 'id' && val && String(val).toLowerCase().includes(q)
      )
    );
  }, [moduleData, moduleSearchQuery, nestedSubTab, activeSub, busDataFetched, busRegisterNoFilter, reportFromDate, reportToDate, busSearchRegNo, appliedServiceRegNo]);

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

  const getModuleExportData = (cols) => {
    if (!filteredModuleData.length) {
      alert('No data available to export');
      return null;
    }
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

  const handlePromptDelete = (subTab, row) => {
    const rawId = row._id || row.id;
    const id = typeof rawId === 'object' ? (rawId?._id || rawId?.$oid || String(rawId)) : (rawId ? String(rawId) : '');
    const itemName = row.name || row.staffname || row.drivername || row.cleanername || row.vehicleno || row.regno || row.society || row.branch || '';
    setDeleteConfirmModal({
      isOpen: true,
      subTab,
      id,
      itemName,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    const { subTab, id } = deleteConfirmModal;
    if (!id) {
      setDeleteConfirmModal({ isOpen: false, subTab: null, id: null, itemName: '', loading: false });
      return;
    }
    setDeleteConfirmModal(prev => ({ ...prev, loading: true }));
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

      setSuccessToast('Record removed successfully!');
      setTimeout(() => setSuccessToast(''), 3000);
      setDeleteConfirmModal({ isOpen: false, subTab: null, id: null, itemName: '', loading: false });
      cacheRef.current = {};
      fetchModuleData(subTab, selectedBranch, true);
    } catch (err) {
      console.error('Error deleting item:', err);
      setDeleteConfirmModal({ isOpen: false, subTab: null, id: null, itemName: '', loading: false });
      alert('Failed to delete item: ' + (err.response?.data?.message || err.message));
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

  const showPDFColumn = moduleKey === 'Vehicles' && activeSub === 'accidents';

  const handleGeneratePDF = (row) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>Vehicle Accident Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
        h2 { text-align: center; color: #0b5299; border-bottom: 2px solid #0b5299; padding-bottom: 8px; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 14px; font-size: 13px; text-align: left; }
        th { background-color: #f1f5f9; width: 35%; font-weight: 600; }
      </style>
      </head><body>
      <h2>Vehicle Accident Report</h2>
      <table>
        ${activeCols.map(c => `<tr><th>${c.label}</th><td>${row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '-'}</td></tr>`).join('')}
      </table>
      </body></html>
    `);
    win.document.close();
    win.print();
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

        {/* Tracking Header Banner for Track Battery & Track Tyre */}
        {(activeSub === 'trackbattery' || activeSub === 'tracktyre') && (
          <div style={{
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  padding: '12px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <IconComponent size={24} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
                    {activeSub === 'trackbattery' ? 'Battery Movement Tracking' : 'Tyre Movement Tracking'}
                  </h2>
                  <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#94a3b8' }}>
                    {activeSub === 'trackbattery'
                      ? 'By using Battery number, track how many times a battery has shifted from one bus to another bus.'
                      : 'By using Tyre number, track how many times a tyre has shifted from one bus to another bus.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                    Tracked Items
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#38bdf8' }}>
                    {filteredModuleData.length}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                    Total Shift Logs
                  </div>
                  <div style={{ fontSize: '20px', fontWeight: '800', color: '#a78bfa' }}>
                    {filteredModuleData.reduce((acc, curr) => acc + (Number(curr.shift_count) || 0), 0)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Date Filter & Report Metrics Banner for Repair Bills Generate Report */}
        {moduleKey === 'Repair Bills' && activeSub === 'generatereport' && (
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#ffffff',
            borderRadius: '12px',
            padding: '20px 24px',
            marginBottom: '20px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: '#f8fafc' }}>
                  Repair Bills Report Generation
                </h2>
                <p style={{ fontSize: '13px', margin: '4px 0 12px 0', color: '#94a3b8' }}>
                  Select From Date and To Date to filter repair bills and generate report.
                </p>
                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>From Date:</label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #475569',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#cbd5e1' }}>To Date:</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '6px',
                        border: '1px solid #475569',
                        backgroundColor: '#1e293b',
                        color: '#f8fafc',
                        fontSize: '13px'
                      }}
                    />
                  </div>
                  {(fromDate || toDate) && (
                    <button
                      type="button"
                      onClick={() => { setFromDate(''); setToDate(''); }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid rgba(239, 68, 68, 0.4)',
                        color: '#fca5a5',
                        fontSize: '12px',
                        fontWeight: '600',
                        cursor: 'pointer'
                      }}
                    >
                      Clear Filter
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                    Total Repair Bills
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#38bdf8' }}>
                    {filteredModuleData.length}
                  </div>
                </div>

                <div style={{
                  background: 'rgba(255, 255, 255, 0.07)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '8px',
                  padding: '10px 18px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#94a3b8' }}>
                    Total Amount (₹)
                  </div>
                  <div style={{ fontSize: '22px', fontWeight: '800', color: '#4ade80' }}>
                    ₹{filteredModuleData.reduce((acc, row) => acc + (parseFloat(row.amount) || 0), 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Module Register No Search Bar & Controls */}
        {moduleKey === 'Services' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '16px',
            padding: '12px 16px',
            backgroundColor: '#f1f5f9',
            borderRadius: '6px',
            border: '1px solid #cbd5e1',
            flexWrap: 'wrap'
          }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                Register No:
              </label>
              <div style={{ position: 'relative', width: '220px' }}>
                <input
                  type="text"
                  placeholder="Enter reg no..."
                  value={serviceRegNoInput}
                  onChange={(e) => {
                    setServiceRegNoInput(e.target.value);
                    setShowServiceSuggestions(true);
                  }}
                  onFocus={() => setShowServiceSuggestions(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setAppliedServiceRegNo(serviceRegNoInput.trim());
                      setShowServiceSuggestions(false);
                    }
                  }}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    fontSize: '14px',
                    border: '1px solid #94a3b8',
                    borderRadius: '4px',
                    outline: 'none',
                    backgroundColor: '#ffffff',
                    color: '#0f172a'
                  }}
                />
                {/* Autocomplete Suggestions Dropdown */}
                {showServiceSuggestions && serviceVehicleSuggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '0 0 6px 6px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    marginTop: '2px'
                  }}>
                    {serviceVehicleSuggestions.map((suggestion, idx) => (
                      <div
                        key={idx}
                        onClick={() => {
                          setServiceRegNoInput(suggestion);
                          setAppliedServiceRegNo(suggestion);
                          setShowServiceSuggestions(false);
                        }}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#1e293b',
                          borderBottom: idx < serviceVehicleSuggestions.length - 1 ? '1px solid #f1f5f9' : 'none'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#f8fafc'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#ffffff'}
                      >
                        {suggestion}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAppliedServiceRegNo(serviceRegNoInput.trim());
                setShowServiceSuggestions(false);
              }}
              style={{
                backgroundColor: '#46b8da',
                color: '#ffffff',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              getdata
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: '#5bc0de',
                color: '#ffffff',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '4px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              Add New
            </button>

            {appliedServiceRegNo && (
              <button
                type="button"
                onClick={() => {
                  setServiceRegNoInput('');
                  setAppliedServiceRegNo('');
                  setShowServiceSuggestions(false);
                }}
                style={{
                  backgroundColor: '#d9534f',
                  color: '#ffffff',
                  border: 'none',
                  padding: '7px 14px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : (
          /* Action Buttons: View Data / Add New */
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
              onClick={handleOpenAddModal}
            >
              Add New Record
            </button>
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
            {/* Export Buttons */}
            <ExportButtons
              onCSV={() => handleExportModuleCSV(activeCols)}
              onPDF={() => handleExportModulePDF(activeCols)}
              onExcel={() => handleExportModuleExcel(activeCols)}
            />

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

            {/* Search control */}
            <div className="admin-search-control">
              <label>{(activeSub === 'trackbattery' || activeSub === 'tracktyre') ? 'Search Number / Bus:' : 'Search:'}</label>
              <input
                type="text"
                placeholder={(activeSub === 'trackbattery' ? 'Filter by battery number...' : activeSub === 'tracktyre' ? 'Filter by tyre number...' : '')}
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
                  <th style={{ width: '60px', textAlign: 'center' }}>Edit</th>
                  <th style={{ width: '70px', textAlign: 'center' }}>Remove</th>
                </tr>
              </thead>
              <tbody>
                {moduleLoading ? (
                  <TableLoader
                    colSpan={activeCols.length + 3}
                    message={`Loading ${moduleKey} (${moduleSubTab.replace('_', ' ')}) records, please wait...`}
                  />
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
                      <td style={{ textAlign: 'center' }}>
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
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="admin-icon-btn remove"
                          title="Remove"
                          onClick={() => handlePromptDelete(activeSub, row)}
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
                  {activeCols.map(col => {
                    const isImageField = col.key === 'profilepic' || col.type === 'image';
                    return (
                      <div
                        key={col.key}
                        className="admin-form-field"
                        style={{ gridColumn: (activeCols.length === 1 || isImageField) ? 'span 2' : 'span 1' }}
                      >
                        <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                          {col.label}
                        </label>

                        {isImageField ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {formData[col.key] ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                <img
                                  src={
                                    formData[col.key].startsWith('data:') || formData[col.key].startsWith('http')
                                      ? formData[col.key]
                                      : `http://localhost:1002/uploads/${formData[col.key]}`
                                  }
                                  alt="Preview"
                                  style={{
                                    width: '64px',
                                    height: '74px',
                                    objectFit: 'cover',
                                    borderRadius: '6px',
                                    border: '2px solid #0b5299',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                  }}
                                  onError={(e) => { e.target.style.display = 'none'; }}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                  <label
                                    htmlFor={`file-upload-${col.key}`}
                                    style={{
                                      padding: '5px 12px',
                                      backgroundColor: '#0b5299',
                                      color: '#ffffff',
                                      borderRadius: '4px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                      display: 'inline-block',
                                      textAlign: 'center'
                                    }}
                                  >
                                    Change Photo
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, [col.key]: '' })}
                                    style={{
                                      padding: '4px 10px',
                                      backgroundColor: '#fee2e2',
                                      color: '#dc2626',
                                      border: '1px solid #fca5a5',
                                      borderRadius: '4px',
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Remove Photo
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <label
                                htmlFor={`file-upload-${col.key}`}
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '16px',
                                  border: '2px dashed #0b5299',
                                  borderRadius: '8px',
                                  backgroundColor: '#f0f9ff',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                              >
                                <span style={{ fontSize: '24px', marginBottom: '4px' }}>📷</span>
                                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0b5299' }}>Click to Upload Profile Photo</span>
                                <span style={{ fontSize: '11px', color: '#64748b' }}>PNG, JPG or WEBP (Max 5MB)</span>
                              </label>
                            )}
                            <input
                              id={`file-upload-${col.key}`}
                              type="file"
                              accept="image/*"
                              style={{ display: 'none' }}
                              onChange={e => handleImageFileChange(e, col.key)}
                            />
                          </div>
                        ) : col.type === 'society-select' || col.key === 'society' ? (
                          <select
                            value={formData[col.key] ?? ''}
                            onChange={e => {
                              const val = e.target.value;
                              setFormData(prev => ({ ...prev, [col.key]: val, branch: '' }));
                            }}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <option value="">-- Select Society --</option>
                            {societiesList.map((soc, idx) => (
                              <option key={idx} value={soc}>{soc}</option>
                            ))}
                          </select>
                        ) : col.type === 'branch-select' || col.key === 'branch' ? (
                          <select
                            value={formData[col.key] ?? ''}
                            onChange={e => setFormData({ ...formData, [col.key]: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <option value="">-- Select Branch --</option>
                            {availableBranches.map((b, idx) => (
                              <option key={idx} value={b}>{b}</option>
                            ))}
                          </select>
                        ) : col.type === 'designation-select' || col.key === 'designation' ? (
                          <select
                            value={formData[col.key] ?? ''}
                            onChange={e => setFormData({ ...formData, [col.key]: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '13px',
                              backgroundColor: '#ffffff'
                            }}
                          >
                            <option value="">-- Select Designation --</option>
                            {designationsList.map((des, idx) => (
                              <option key={idx} value={des}>{des}</option>
                            ))}
                          </select>
                        ) : col.type === 'date' || col.key === 'dateofjoin' || col.key === 'rdate' || col.key === 'valid' ? (
                          <input
                            type="date"
                            value={formatDateForInput(formData[col.key])}
                            onChange={e => setFormData({ ...formData, [col.key]: e.target.value })}
                            style={{
                              width: '100%',
                              padding: '8px 10px',
                              border: '1px solid #cbd5e1',
                              borderRadius: '4px',
                              fontSize: '13px'
                            }}
                          />
                        ) : (
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
                        )}
                      </div>
                    );
                  })}
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

        {/* Custom Confirmation Modal for Delete */}
        <ConfirmModal
          isOpen={deleteConfirmModal.isOpen}
          title={`Remove ${moduleKey} Record`}
          message="Are you sure you want to remove this record? This action cannot be undone."
          itemName={deleteConfirmModal.itemName}
          confirmText="Yes, Remove"
          cancelText="Cancel"
          confirmVariant="danger"
          loading={deleteConfirmModal.loading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmModal({ isOpen: false, subTab: null, id: null, itemName: '', loading: false })}
        />

        {/* Full Image Preview Modal */}
        {previewImageModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.85)',
              backdropFilter: 'blur(5px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '24px'
            }}
            onClick={() => setPreviewImageModal(null)}
          >
            <div
              style={{
                position: 'relative',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                padding: '16px',
                maxWidth: '90vw',
                maxHeight: '90vh',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
              }}
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewImageModal(null)}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ✕
              </button>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', color: '#0f172a', fontWeight: 600 }}>
                Profile Photo Preview
              </h4>
              <img
                src={previewImageModal}
                alt="Profile Preview"
                style={{
                  maxWidth: '80vw',
                  maxHeight: '75vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ModulePage;
