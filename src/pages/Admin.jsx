import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User } from 'lucide-react';
import CustomTabs from '../components/CustomTabs';
import MainLayout from '../components/MainLayout';
import ExportButtons from '../components/ExportButtons';
import { TableLoader } from '../components/Loader';
import { getAdminData, createAdminItem, updateAdminItem, deleteAdminItem, getRouteFormOptions, getTransferFormOptions } from '../services/api';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import ConfirmModal from '../components/ConfirmModal';
import SocietyMultiSelect from '../components/SocietyMultiSelect';
import VehicleAutocomplete from '../components/VehicleAutocomplete';

const TAB_FIELDS = {
  Societies: [
    { key: 'name', label: 'Society Name', type: 'text', required: true }
  ],
  Branches: [
    { key: 'society', label: 'Society Name', type: 'society-multiselect', required: true },
    { key: 'name', label: 'Branch Name', type: 'text', required: true }
  ],
  Route_Details: [
    { key: 'society', label: 'Society', type: 'society-select' },
    { key: 'branch', label: 'Branch', type: 'branch-select' },
    { key: 'routename', label: 'Route Name', type: 'route-select', required: true },
    { key: 'startpoint', label: 'Start Point', type: 'startpoint-select' },
    { key: 'starttime', label: 'Start Time', type: 'time-ampm' },
    { key: 'distance', label: 'Distance', type: 'number' },
    { key: 'regno', label: 'Vehicle Reg.No', type: 'vehicle-autocomplete', required: true }
  ],
  Handovers: [
    { key: 'society', label: 'Society', type: 'society-select' },
    { key: 'branch', label: 'Branch', type: 'branch-select' },
    { key: 'regno', label: 'Vehicle Reg.No', type: 'vehicle-autocomplete', required: true },
    { key: 'date', label: 'Handover Date', type: 'date' },
    { key: 'driver', label: 'Staff / Driver', type: 'text' },
    { key: 'status', label: 'Status', type: 'select', options: ['Completed', 'Pending'] }
  ],
  Issues: [
    { key: 'society', label: 'Society', type: 'society-select' },
    { key: 'branch', label: 'Branch', type: 'branch-select' },
    { key: 'regno', label: 'Vehicle Reg.No', type: 'vehicle-autocomplete', required: true },
    { key: 'date', label: 'Issue Date', type: 'date' },
    { key: 'description', label: 'Issue Description', type: 'textarea', required: true },
    { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Resolved'] }
  ],
  Transfers: [
    { key: 'society', label: 'Society', type: 'society-select' },
    { key: 'branch', label: 'Present Branch', type: 'branch-select' },
    { key: 'cmr', label: 'CMR', type: 'text' },
    { key: 'make', label: 'Make', type: 'make-select' },
    { key: 'model', label: 'Model', type: 'model-select' },
    { key: 'regno', label: 'Vehicle Reg.No', type: 'vehicle-autocomplete', required: true },
    { key: 'service', label: 'Service No', type: 'text' },
    { key: 'transferbranch', label: 'Transfered To', type: 'branch-select', required: true },
    { key: 'transferdate', label: 'Date of transfer', type: 'date' }
  ]
};

const parseTimeParts = (val) => {
  if (!val) return { time: '', period: 'AM' };
  const str = String(val).trim();
  const ampmMatch = str.match(/(am|pm)/i);
  let period = ampmMatch ? ampmMatch[1].toUpperCase() : '';

  const numMatch = str.match(/(\d{1,2}):(\d{2})/);
  if (!numMatch) return { time: '', period: period || 'AM' };

  let h = parseInt(numMatch[1], 10);
  const m = numMatch[2];

  if (!period) {
    if (h >= 12) {
      period = 'PM';
      if (h > 12) h -= 12;
    } else {
      period = 'AM';
      if (h === 0) h = 12;
    }
  } else {
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
  }

  const paddedH = String(h).padStart(2, '0');
  return {
    time: `${paddedH}:${m}`,
    period: period || 'AM'
  };
};

const formatToDbTime = (time, period = 'AM') => {
  if (!time) return '';
  const match = String(time).match(/(\d{1,2}):(\d{2})/);
  if (!match) return time;
  let h = parseInt(match[1], 10);
  const m = match[2];
  let p = (period || 'AM').toLowerCase();
  if (h > 12) {
    h -= 12;
    p = 'pm';
  } else if (h === 0) {
    h = 12;
  }
  const paddedH = String(h).padStart(2, '0');
  return `${paddedH}:${m}:00 ${p}`;
};

const formatTableTime = (val) => {
  if (!val) return '-';
  const str = String(val).trim();
  if (/am|pm/i.test(str)) return str;
  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    let h = parseInt(match[1], 10);
    const m = match[2];
    const p = h >= 12 ? 'pm' : 'am';
    if (h > 12) h -= 12;
    if (h === 0) h = 12;
    const paddedH = String(h).padStart(2, '0');
    return `${paddedH}:${m}:00 ${p}`;
  }
  return str;
};

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

const ADMIN_SUBTABS = [
  { id: 'Societies', label: 'Societies' },
  { id: 'Branches', label: 'Branches' },
  { id: 'Route_Details', label: 'Route_Details' },
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
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminEntriesPerPage, setAdminEntriesPerPage] = useState(10);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);

  // Modal and CRUD State
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({});
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [actionSuccessToast, setActionSuccessToast] = useState('');
  const [societiesList, setSocietiesList] = useState([]);
  const [branchesList, setBranchesList] = useState([]);

  // Custom Delete Confirm Modal State
  const [deleteConfirmModal, setDeleteConfirmModal] = useState({
    isOpen: false,
    id: null,
    itemName: '',
    loading: false
  });

  const [adminFetchError, setAdminFetchError] = useState('');

  const adminCacheRef = useRef({});

  // Fetch available societies and branches from database collections
  const fetchFormMetadata = async () => {
    try {
      const socRes = await getAdminData('societies', 'ALL');
      const socData = Array.isArray(socRes) ? socRes : (Array.isArray(socRes?.data) ? socRes.data : []);
      const socNames = socData.map(item => item.name || item.societyname || item.society).filter(Boolean);
      setSocietiesList([...new Set(socNames)].sort());

      const branchRes = await getAdminData('branches', 'ALL');
      const branchData = Array.isArray(branchRes) ? branchRes : (Array.isArray(branchRes?.data) ? branchRes.data : []);
      const branches = branchData.map(b => ({
        name: (b.name || b.branchname || '').trim(),
        society: (b.test || b.society || '').trim()
      })).filter(b => b.name);
      setBranchesList(branches);
    } catch (e) {
      console.error('Failed to load form metadata:', e);
    }
  };

  useEffect(() => {
    fetchFormMetadata();
  }, []);

  // Filtered branches for single-select dropdown based on selected society
  const availableBranches = useMemo(() => {
    if (!formData.society) {
      return Array.from(new Set(branchesList.map(b => b.name))).sort();
    }
    const filtered = branchesList
      .filter(b => b.society.toLowerCase() === formData.society.toLowerCase())
      .map(b => b.name);
    return Array.from(new Set(filtered)).sort();
  }, [branchesList, formData.society]);

  // Route Details options (Route Name and Start Point dropdowns)
  const [routeFormOptions, setRouteFormOptions] = useState({
    routes: [],
    stages: [],
    routesWithDetails: []
  });

  useEffect(() => {
    if (adminSubTab === 'Route_Details' && showModal) {
      const fetchRouteOpts = async () => {
        try {
          const res = await getRouteFormOptions({
            branch: formData.branch || '',
            society: formData.society || ''
          });
          const opts = res?.data || res || {};
          if (Array.isArray(opts.routes) || Array.isArray(opts.stages)) {
            setRouteFormOptions({
              routes: opts.routes || [],
              stages: opts.stages || [],
              routesWithDetails: opts.routesWithDetails || []
            });
          }
        } catch (err) {
          console.error('Failed to fetch route form options:', err);
        }
      };
      fetchRouteOpts();
    }
  }, [adminSubTab, showModal, formData.branch, formData.society]);

  // Transfers options (Make and Model dropdowns)
  const [transferFormOptions, setTransferFormOptions] = useState({
    makes: [],
    models: [],
    vehicleMakes: []
  });

  useEffect(() => {
    if (adminSubTab === 'Transfers' && showModal) {
      const fetchTransferOpts = async () => {
        try {
          const res = await getTransferFormOptions();
          const opts = res?.data || res || {};
          setTransferFormOptions({
            makes: opts.makes || [],
            models: opts.models || [],
            vehicleMakes: opts.vehicleMakes || []
          });
        } catch (err) {
          console.error('Failed to fetch transfer form options:', err);
        }
      };
      fetchTransferOpts();
    }
  }, [adminSubTab, showModal]);

  const availableTransferModels = useMemo(() => {
    if (!formData.make) {
      return transferFormOptions.models || [];
    }
    const filtered = (transferFormOptions.vehicleMakes || [])
      .filter(vm => (vm.name || vm.make || '').trim().toLowerCase() === formData.make.trim().toLowerCase())
      .map(vm => (vm.model || '').trim())
      .filter(Boolean);
    const set = new Set(filtered);
    if (set.size > 0) {
      return Array.from(set).sort();
    }
    return transferFormOptions.models || [];
  }, [transferFormOptions, formData.make]);

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
    if (!forceRefresh && adminCacheRef.current[cacheKey] && adminCacheRef.current[cacheKey].length > 0) {
      setAdminData(adminCacheRef.current[cacheKey]);
      setAdminCurrentPage(1);
      setAdminLoading(false);
      setAdminFetchError('');
      return;
    }

    setAdminLoading(true);
    setAdminFetchError('');
    try {
      const typeKey = activeSub.toLowerCase();
      const res = await getAdminData(typeKey, effectiveBranch, user?.username);
      const data = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      if (data && data.length > 0) {
        adminCacheRef.current[cacheKey] = data;
      }
      setAdminData(data);
      setAdminCurrentPage(1);
    } catch (err) {
      console.error('Error fetching admin data:', err);
      delete adminCacheRef.current[cacheKey];
      setAdminData([]);
      if (err.response?.status === 401) {
        setAdminFetchError('Your session has expired. Please log in again.');
      } else {
        setAdminFetchError(err.response?.data?.message || err.message || 'Failed to fetch data from server.');
      }
    } finally {
      setAdminLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData(adminSubTab, selectedBranch);
  }, [adminSubTab, selectedBranch]);

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

  const getAdminExportData = () => {
    if (!filteredAdminData.length) {
      alert('No data available to export');
      return null;
    }

    let headers = [];
    let rowMapper = null;

    if (adminSubTab === 'Societies') {
      headers = ['S.No', 'Society Name'];
      rowMapper = (row, idx) => [idx + 1, row.name || row.societyname || row.society || ''];
    } else if (adminSubTab === 'Branches') {
      headers = ['S.No', 'Society Name', 'Branch Name'];
      rowMapper = (row, idx) => [idx + 1, row.society || '', row.branchname || row.name || ''];
    } else if (adminSubTab === 'Route_Details') {
      headers = ['S.No', 'Society', 'Branch', 'Registration No', 'Route Name', 'Start Point', 'Start Time', 'Distance(in kms)'];
      rowMapper = (row, idx) => [idx + 1, row.society || '', row.branch || '', row.regno || '', row.routename || '', row.startpoint || '', row.starttime || '', row.distance ?? '0'];
    } else if (adminSubTab === 'Handovers') {
      headers = ['S.No', 'Society', 'Branch', 'Vehicle Reg.No', 'Handover Date', 'Staff / Driver', 'Status'];
      rowMapper = (row, idx) => [idx + 1, row.society || '', row.branch || '', row.regno || '', row.date || '', row.driver || '', row.status || 'Completed'];
    } else if (adminSubTab === 'Issues') {
      headers = ['S.No', 'Society', 'Branch', 'Vehicle Reg.No', 'Issue Date', 'Issue Description', 'Status'];
      rowMapper = (row, idx) => [idx + 1, row.society || '', row.branch || '', row.regno || '', row.date || '', row.description || '', row.status || 'Pending'];
    } else if (adminSubTab === 'Transfers') {
      headers = ['S.No', 'Society', 'Present Branch', 'CMR', 'Make', 'Model', 'Registration No.', 'Service No', 'Transfered To', 'Date of transfer'];
      rowMapper = (row, idx) => [
        idx + 1,
        row.society || '',
        row.branch || '',
        row.cmr || '',
        row.make || '',
        row.model || '',
        row.regno || '',
        row.service || '',
        row.transferbranch || '',
        row.transferdate || ''
      ];
    } else {
      const sample = filteredAdminData[0];
      const keys = Object.keys(sample).filter(k => k !== '_id' && k !== 'id');
      headers = ['S.No', ...keys];
      rowMapper = (row, idx) => [idx + 1, ...keys.map(k => row[k] ?? '')];
    }

    const rows = filteredAdminData.map((row, idx) => rowMapper(row, idx));
    return { headers, rows };
  };

  const handleExportAdminCSV = () => {
    const data = getAdminExportData();
    if (data) exportToCSV(data.headers, data.rows, `Admin_${adminSubTab}_Data`);
  };

  const handleExportAdminPDF = () => {
    const data = getAdminExportData();
    if (data) exportToPDF(data.headers, data.rows, `Admin_${adminSubTab}_Data`, `Admin Data - ${adminSubTab.replace(/_/g, ' ')}`);
  };

  const handleExportAdminExcel = () => {
    const data = getAdminExportData();
    if (data) exportToExcel(data.headers, data.rows, `Admin_${adminSubTab}_Data`);
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    const fields = TAB_FIELDS[adminSubTab] || [];
    const initial = {};
    fields.forEach(f => {
      initial[f.key] = f.type === 'select' ? f.options[0] : '';
    });
    if (adminSubTab === 'Branches') {
      initial.societies = [];
      initial.society = '';
    } else if (adminSubTab === 'Route_Details' || adminSubTab === 'Handovers' || adminSubTab === 'Issues') {
      initial.society = '';
      initial.branch = '';
    } else if (adminSubTab === 'Transfers') {
      initial.society = '';
      initial.branch = '';
      const today = new Date();
      const y = today.getFullYear();
      const m = String(today.getMonth() + 1).padStart(2, '0');
      const d = String(today.getDate()).padStart(2, '0');
      initial.transferdate = `${y}-${m}-${d}`;
    } else if (selectedBranch && selectedBranch !== 'ALL' && selectedBranch !== 'College') {
      initial.branch = selectedBranch;
    }
    setFormData(initial);
    setShowModal(true);
  };

  const handleOpenEditModal = (row) => {
    const rawId = row._id || row.id;
    const id = typeof rawId === 'object' ? (rawId._id || rawId.$oid || String(rawId)) : String(rawId || '');
    setEditingId(id);
    const fields = TAB_FIELDS[adminSubTab] || [];
    const initial = {};
    fields.forEach(f => {
      let val = row[f.key];
      if (val === undefined || val === null) {
        if (f.key === 'name') val = row.societyname || row.society || row.branchname || row.name;
        else if (f.key === 'society') val = row.society || row.test || row.societyname;
        else if (f.key === 'driver') val = row.driver || row.staffname;
        else if (f.key === 'description') val = row.description || row.remarks;
      }
      initial[f.key] = val ?? (f.type === 'select' ? f.options[0] : '');
    });
    if (adminSubTab === 'Branches') {
      let socs = [];
      if (Array.isArray(row.societies) && row.societies.length > 0) {
        socs = row.societies;
      } else if (initial.society) {
        socs = String(initial.society).split(',').map(s => s.trim()).filter(Boolean);
      }
      initial.societies = socs;
      initial.society = socs.join(', ');
    } else if (adminSubTab === 'Transfers' && initial.transferdate) {
      initial.transferdate = formatDateForInput(initial.transferdate);
    }
    setFormData(initial);
    setShowModal(true);
  };

  const handleSaveRecord = async (e) => {
    e.preventDefault();
    if (adminSubTab === 'Branches') {
      if (!formData.societies || formData.societies.length === 0) {
        alert('Please select at least one Society for this branch.');
        return;
      }
    }
    setModalSubmitting(true);
    try {
      const typeKey = adminSubTab.toLowerCase();
      let payload = { ...formData };
      if (adminSubTab === 'Branches') {
        payload = {
          name: formData.name,
          societies: formData.societies
        };
      } else {
        if (!payload.branch && selectedBranch && selectedBranch !== 'ALL' && selectedBranch !== 'College') {
          payload.branch = selectedBranch;
        }
        if (adminSubTab === 'Societies') {
          payload.societyname = payload.name;
          payload.society = payload.name;
        } else if (adminSubTab === 'Handovers') {
          payload.staffname = payload.driver;
        } else if (adminSubTab === 'Issues') {
          payload.remarks = payload.description;
        }
      }

      if (editingId) {
        await updateAdminItem(typeKey, editingId, payload);
        setActionSuccessToast('Record updated successfully!');
      } else {
        await createAdminItem(typeKey, payload);
        setActionSuccessToast('Record created successfully!');
      }

      setShowModal(false);
      setTimeout(() => setActionSuccessToast(''), 3000);
      adminCacheRef.current = {};
      await fetchAdminData(adminSubTab, selectedBranch, true);
      if (adminSubTab === 'Societies' || adminSubTab === 'Branches') {
        fetchFormMetadata();
      }
    } catch (err) {
      console.error('Error saving record:', err);
      alert('Failed to save record: ' + (err.response?.data?.message || err.message));
    } finally {
      setModalSubmitting(false);
    }
  };

  const handlePromptDelete = (row) => {
    const rawId = row._id || row.id;
    const id = typeof rawId === 'object' ? (rawId?._id || rawId?.$oid || String(rawId)) : (rawId ? String(rawId) : '');
    const itemName = row.name || row.societyname || row.society || row.branchname || row.routename || row.regno || '';
    setDeleteConfirmModal({
      isOpen: true,
      id,
      itemName,
      loading: false
    });
  };

  const handleConfirmDelete = async () => {
    const { id } = deleteConfirmModal;
    if (!id) {
      setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false });
      return;
    }
    setDeleteConfirmModal(prev => ({ ...prev, loading: true }));
    try {
      const typeKey = adminSubTab.toLowerCase();
      await deleteAdminItem(typeKey, id);
      setActionSuccessToast('Record removed successfully!');
      setTimeout(() => setActionSuccessToast(''), 3000);
      setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false });
      adminCacheRef.current = {};
      await fetchAdminData(adminSubTab, selectedBranch, true);
    } catch (err) {
      console.error('Error deleting admin item:', err);
      setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false });
      alert('Failed to delete item: ' + (err.response?.data?.message || err.message));
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
            onClick={handleOpenAddModal}
          >
            {adminSubTab === 'Societies' ? '+ New Society' : adminSubTab === 'Branches' ? '+ New Branch' : `+ New ${adminSubTab.replace(/_/g, ' ')}`}
          </button>
          {actionSuccessToast && (
            <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', marginLeft: '10px' }}>
              ✓ {actionSuccessToast}
            </span>
          )}
        </div>

        {adminFetchError && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #f87171',
            color: '#b91c1c',
            padding: '10px 14px',
            borderRadius: '6px',
            marginBottom: '14px',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span>⚠️ {adminFetchError}</span>
            <button
              type="button"
              className="admin-action-btn"
              style={{ padding: '4px 10px', fontSize: '12px' }}
              onClick={() => fetchAdminData(adminSubTab, selectedBranch, true)}
            >
              Retry
            </button>
          </div>
        )}

        {/* Data Table Card */}
        <div className="admin-table-card">
          <div className="admin-table-toolbar">
            {/* Export Buttons */}
            <ExportButtons
              onCSV={handleExportAdminCSV}
              onPDF={handleExportAdminPDF}
              onExcel={handleExportAdminExcel}
            />

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
                    <th>Present Branch</th>
                    <th>CMR</th>
                    <th>Make</th>
                    <th>Model</th>
                    <th>Registration No.</th>
                    <th>Service No</th>
                    <th>Transfered To</th>
                    <th>Date of transfer</th>
                    <th>Edit</th>
                    <th>Remove</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {adminLoading ? (
                  <TableLoader
                    colSpan={
                      adminSubTab === 'Transfers' ? 12 :
                        adminSubTab === 'Route_Details' ? 10 :
                          adminSubTab === 'Handovers' || adminSubTab === 'Issues' ? 9 :
                            adminSubTab === 'Branches' ? 5 : 4
                    }
                    message={`Loading ${adminSubTab.replace('_', ' ')} records, please wait...`}
                  />
                ) : paginatedAdminData.length > 0 ? (
                  paginatedAdminData.map((row, idx) => (
                    <tr key={row.id || idx}>
                      <td>{(adminCurrentPage - 1) * adminEntriesPerPage + idx + 1}</td>
                      {adminSubTab === 'Societies' && (
                        <td>{row.name || row.societyname || row.society || '-'}</td>
                      )}
                      {adminSubTab === 'Branches' && (
                        <>
                          <td>{row.society || row.test || '-'}</td>
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
                          <td>{formatTableTime(row.starttime)}</td>
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
                          <td>{row.cmr || '-'}</td>
                          <td>{row.make || '-'}</td>
                          <td>{row.model || '-'}</td>
                          <td><strong>{row.regno || '-'}</strong></td>
                          <td>{row.service || '-'}</td>
                          <td>{row.transferbranch || '-'}</td>
                          <td>{row.transferdate || '-'}</td>
                        </>
                      )}
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
                          title="Remove"
                          onClick={() => handlePromptDelete(row)}
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

        {/* Modal Popup for Add / Edit Record */}
        {showModal && (
          <div className="admin-modal-backdrop" onClick={() => setShowModal(false)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3>{`${editingId ? 'Edit' : 'Add New'} Record - ${adminSubTab.replace(/_/g, ' ')}`}</h3>
                <button
                  type="button"
                  className="admin-modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSaveRecord}>
                <div className="admin-modal-body">
                  {(TAB_FIELDS[adminSubTab] || []).map((field) => (
                    <div className="admin-form-field" key={field.key}>
                      <label>
                        {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
                      </label>
                      {field.type === 'society-select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={e => {
                            const newSoc = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              [field.key]: newSoc,
                              branch: prev.branch && branchesList.some(b => b.name === prev.branch && b.society.toLowerCase() === newSoc.toLowerCase())
                                ? prev.branch
                                : ''
                            }));
                          }}
                          required={field.required}
                        >
                          <option value="">-- Select Society --</option>
                          {societiesList.map(soc => (
                            <option key={soc} value={soc}>{soc}</option>
                          ))}
                        </select>
                      ) : field.type === 'branch-select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                        >
                          <option value="">-- Select Branch --</option>
                          {availableBranches.map(bName => (
                            <option key={bName} value={bName}>{bName}</option>
                          ))}
                        </select>
                      ) : field.type === 'make-select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={e => {
                            const selectedMake = e.target.value;
                            setFormData(prev => ({
                              ...prev,
                              [field.key]: selectedMake
                            }));
                          }}
                          required={field.required}
                        >
                          <option value="">-- Select Make --</option>
                          {(transferFormOptions.makes || []).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                          {formData[field.key] && !(transferFormOptions.makes || []).includes(formData[field.key]) && (
                            <option value={formData[field.key]}>{formData[field.key]}</option>
                          )}
                        </select>
                      ) : field.type === 'model-select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          required={field.required}
                        >
                          <option value="">-- Select Model --</option>
                          {availableTransferModels.map(mod => (
                            <option key={mod} value={mod}>{mod}</option>
                          ))}
                          {formData[field.key] && !availableTransferModels.includes(formData[field.key]) && (
                            <option value={formData[field.key]}>{formData[field.key]}</option>
                          )}
                        </select>
                      ) : field.type === 'route-select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={e => {
                            const selectedRoute = e.target.value;
                            const matched = (routeFormOptions.routesWithDetails || []).find(r => r.routename === selectedRoute);
                            setFormData(prev => ({
                              ...prev,
                              [field.key]: selectedRoute,
                              ...(matched && matched.distance !== undefined && matched.distance !== null ? { distance: matched.distance } : {})
                            }));
                          }}
                          required={field.required}
                        >
                          <option value="">-- Select Route Name --</option>
                          {(routeFormOptions.routes || []).map(rName => (
                            <option key={rName} value={rName}>{rName}</option>
                          ))}
                          {formData[field.key] && !(routeFormOptions.routes || []).includes(formData[field.key]) && (
                            <option value={formData[field.key]}>{formData[field.key]}</option>
                          )}
                        </select>
                      ) : field.type === 'startpoint-select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                          required={field.required}
                        >
                          <option value="">-- Select Start Point --</option>
                          {(routeFormOptions.stages || []).map(st => (
                            <option key={st} value={st}>{st}</option>
                          ))}
                          {formData[field.key] && !(routeFormOptions.stages || []).includes(formData[field.key]) && (
                            <option value={formData[field.key]}>{formData[field.key]}</option>
                          )}
                        </select>
                      ) : field.type === 'vehicle-autocomplete' ? (
                        <VehicleAutocomplete
                          value={formData[field.key] ?? ''}
                          onChange={val => setFormData(prev => ({ ...prev, [field.key]: val }))}
                          onSelectVehicle={veh => {
                            setFormData(prev => {
                              const next = { ...prev, [field.key]: veh.regno || veh };
                              if (veh.make) next.make = veh.make;
                              if (veh.model) next.model = veh.model;
                              return next;
                            });
                          }}
                          placeholder={`Enter ${field.label}...`}
                          required={field.required}
                        />
                      ) : field.type === 'society-multiselect' ? (
                        <SocietyMultiSelect
                          societies={societiesList}
                          selected={formData.societies || []}
                          onChange={(selected) => {
                            setFormData(prev => ({
                              ...prev,
                              societies: selected,
                              society: selected.join(', ')
                            }));
                          }}
                          placeholder="Select societies..."
                        />
                      ) : field.type === 'select' ? (
                        <select
                          value={formData[field.key] ?? ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                        >
                          {field.options.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                        </select>
                      ) : field.type === 'time-ampm' ? (
                        <div className="time-ampm-input-group">
                          <input
                            type="time"
                            value={(() => {
                              const parsed = parseTimeParts(formData[field.key]);
                              return parsed.time;
                            })()}
                            onChange={e => {
                              const newTime = e.target.value;
                              const currentParsed = parseTimeParts(formData[field.key]);
                              let period = currentParsed.period || 'AM';
                              if (newTime) {
                                const h = parseInt(newTime.split(':')[0], 10);
                                if (h >= 12) {
                                  period = 'PM';
                                }
                              }
                              setFormData(prev => ({
                                ...prev,
                                [field.key]: formatToDbTime(newTime, period)
                              }));
                            }}
                            required={field.required}
                          />
                          <select
                            className="time-period-select"
                            value={(() => {
                              const parsed = parseTimeParts(formData[field.key]);
                              return parsed.period || 'AM';
                            })()}
                            onChange={e => {
                              const newPeriod = e.target.value;
                              const currentParsed = parseTimeParts(formData[field.key]);
                              setFormData(prev => ({
                                ...prev,
                                [field.key]: formatToDbTime(currentParsed.time || '07:00', newPeriod)
                              }));
                            }}
                          >
                            <option value="AM">AM</option>
                            <option value="PM">PM</option>
                          </select>
                        </div>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          rows={3}
                          value={formData[field.key] ?? ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                          placeholder={`Enter ${field.label}...`}
                        />
                      ) : field.type === 'date' ? (
                        <input
                          type="date"
                          value={formatDateForInput(formData[field.key])}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                        />
                      ) : (
                        <input
                          type={field.type || 'text'}
                          value={formData[field.key] ?? ''}
                          onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          required={field.required}
                          placeholder={`Enter ${field.label}...`}
                        />
                      )}
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
                    disabled={modalSubmitting}
                  >
                    {modalSubmitting ? 'Saving...' : (editingId ? 'Update Record' : 'Save Record')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Custom Confirmation Modal for Delete */}
        <ConfirmModal
          isOpen={deleteConfirmModal.isOpen}
          title={`Remove ${adminSubTab.replace(/_/g, ' ')} Record`}
          message="Are you sure you want to remove this record? This action cannot be undone."
          itemName={deleteConfirmModal.itemName}
          confirmText="Yes, Remove"
          cancelText="Cancel"
          confirmVariant="danger"
          loading={deleteConfirmModal.loading}
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirmModal({ isOpen: false, id: null, itemName: '', loading: false })}
        />
      </div>
    </MainLayout>
  );
};

export default Admin;
