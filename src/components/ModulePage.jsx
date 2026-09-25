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
import * as XLSX from 'xlsx';
import ConfirmModal from './ConfirmModal';
import VehicleAutocomplete from './VehicleAutocomplete';
import {
  createStaffItem, updateStaffItem, deleteStaffItem,
  createVehicleItem, bulkCreateVehicleItems, updateVehicleItem, deleteVehicleItem,
  createCertificateItem, updateCertificateItem, deleteCertificateItem,
  createFuelItem, updateFuelItem, deleteFuelItem,
  createAdBlueItem, updateAdBlueItem, deleteAdBlueItem,
  createServiceItem, updateServiceItem, deleteServiceItem,
  createRepairBill, updateRepairBill, deleteRepairBill,
  createBusBreakdownItem, updateBusBreakdownItem, deleteBusBreakdownItem,
  createBatteryItem, updateBatteryItem, deleteBatteryItem,
  createVehicleTyreItem, updateVehicleTyreItem, deleteVehicleTyreItem,
  createAdminItem, updateAdminItem, deleteAdminItem,
  getAdminData, getStaffData, getVehiclesData
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

  const [moduleChildSubTab, setModuleChildSubTab] = useState(() => {
    const subObj = currentConfig?.subTabs?.find(t => t.id === (validRequestedTab || currentConfig?.subTabs[0]?.id));
    return subObj?.childSubTabs?.length > 0 ? subObj.childSubTabs[0].id : '';
  });
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
  const [busDataFetched, setBusDataFetched] = useState(true);

  // Services Register No search & autocomplete state
  const [serviceRegNoInput, setServiceRegNoInput] = useState('');
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [appliedServiceRegNo, setAppliedServiceRegNo] = useState('');

  // Repair Bills Register No search & autocomplete state
  const [repairRegNoInput, setRepairRegNoInput] = useState('');
  const [appliedRepairRegNo, setAppliedRepairRegNo] = useState('');

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
  const [vehiclesList, setVehiclesList] = useState([]);
  const [makesList, setMakesList] = useState([]);
  const [modelsList, setModelsList] = useState([]);
  const [staffList, setStaffList] = useState([]);

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

        const desRes = await getStaffData('designations', 'ALL').catch(() => null);
        const desData = Array.isArray(desRes?.data) ? desRes.data : (Array.isArray(desRes) ? desRes : []);
        const desNames = desData.map(d => d.name || d.designation).filter(Boolean);
        const defaultDes = ['DRIVER', 'BUS SUPERVISOR', 'CLEANER', 'MECHANIC', 'HELPER', 'ATTENDER', 'JUNIOR ASSISTANT', 'OFFICE SUBORDINATE'];
        setDesignationsList(Array.from(new Set([...desNames, ...defaultDes])).sort());

        const vehicleRes = await getVehiclesData('branch', 'ALL').catch(() => null);
        const vehicleData = Array.isArray(vehicleRes?.data) ? vehicleRes.data : (Array.isArray(vehicleRes) ? vehicleRes : []);
        setVehiclesList(vehicleData);

        const infoRes = await getVehiclesData('info', 'ALL').catch(() => null);
        const infoData = Array.isArray(infoRes?.data) ? infoRes.data : (Array.isArray(infoRes) ? infoRes : []);
        const makesRes = await getVehiclesData('makes', 'ALL').catch(() => null);
        const makesData = Array.isArray(makesRes?.data) ? makesRes.data : (Array.isArray(makesRes) ? makesRes : []);

        const fetchedMakes = new Set();
        const fetchedModels = new Set();

        infoData.forEach(item => {
          if (item.make || item.vehiclemake || item.name) fetchedMakes.add(String(item.make || item.vehiclemake || item.name).trim());
          if (item.model) fetchedModels.add(String(item.model).trim());
        });
        makesData.forEach(item => {
          if (item.make || item.name) fetchedMakes.add(String(item.make || item.name).trim());
          if (item.model) fetchedModels.add(String(item.model).trim());
        });

        const defaultMakes = [
          'ASHOK', 'ASHOK LAYLAND', 'ASHOK LEYLAND', 'ASHOK LEYLAND STAG', 'ASHOK LEYLAND SUNSHINE',
          'BAJAJ', 'BHARATH BENZ', 'DISCOVERY', 'EICHER', 'FORCE', 'FORD', 'FXDF', 'HERO', 'HONDA',
          'JAGUAR LAND ROVER', 'LAND ROVER', 'MAHINDRA', 'MARUTHI SUZUKI', 'MARUTI', 'MERCEDES',
          'MERCEDUS', 'NISSAN', 'SML ISUZU LTD', 'SML MAHINDRA LTD', 'SWARAJ', 'SWARAJ AC',
          'TATA', 'TATA MOTOR LTD', 'TATA MOTORS LTD', 'TOYOTA', 'VE COMMERCIAL VEHICLES LTD',
          'VENTO', 'VOLVO'
        ];

        const defaultModels = [
          '1014R BSIV', '2090 L SKL SCL BSVI', '235 AIR FLOW', 'A L BS VI-2023', 'ACTIVA',
          'ASHOK LEYLAND', 'ASHOK LEYLAND STAG', 'ASHOK LEYLAND SUNSHINE', 'BENZ', 'BOLEORO',
          'BOLERO BS-VI', 'DISCOVERY', 'DISCOVERY3.0IT', 'DOSTU (HYDRALIC)', 'DYNA FAT BOB',
          'EECO AMBULANCE SHELL', 'EICHER', 'EICHER PRO 2110C BSIV', 'ERTIGA', 'FORCE',
          'FORTUNER', 'HYCROSS', 'HYUNDAI', 'INNOVA', 'INTRA V 20', 'INVICTO', 'INVICTO ALPHA PLUS',
          'LEYLAND', 'MARUTHI SUZUKI', 'MINI BUS', 'OMNI', 'ROXOR', 'SCORPIO', 'SWIFT',
          'TAISAR', 'TATA', 'TATA ACE', 'TATA ULTRA PRIME', 'TOYOTA', 'TRAVELER', 'URBANIA',
          'VAN', 'VENTO', 'VOLVO', 'XL 6', 'YODHA'
        ];

        setMakesList(Array.from(new Set([...fetchedMakes, ...defaultMakes])).sort());
        setModelsList(Array.from(new Set([...fetchedModels, ...defaultModels])).sort());

        // Fetch Staff metadata
        const staffRegRes = await getStaffData('register', 'ALL').catch(() => null);
        const staffRegData = Array.isArray(staffRegRes?.data) ? staffRegRes.data : (Array.isArray(staffRegRes) ? staffRegRes : []);
        const staffMeetRes = await getStaffData('meeting', 'ALL').catch(() => null);
        const staffMeetData = Array.isArray(staffMeetRes?.data) ? staffMeetRes.data : (Array.isArray(staffMeetRes) ? staffMeetRes : []);

        const fetchedStaff = new Set();
        staffRegData.forEach(s => {
          const n = s.name || s.staffname || s.drivername;
          if (n) fetchedStaff.add(String(n).trim());
        });
        staffMeetData.forEach(s => {
          const n = s.name || s.staffname || s.drivername;
          if (n) fetchedStaff.add(String(n).trim());
        });

        const defaultStaff = [
          'K VISWANADHA REDDY', 'P.SURESH', 'KATTA YEDUKONDALU', 'N SRINIVAS', 'K NAGA NOOKA REDDY',
          'G GANESH', 'M SESHUBABU', 'K VENKATESWARA RAO', 'KONA ADINARAYANA', 'CHIRLA DHANAKOTI VENKATA REDDY',
          'K KANNAYYA', 'CHANDURI SATYA SURYA BALAJI', 'PULIDINDI DURGA PRASAD', 'VASIREDDY SATYA NARASIMHA BALAJI',
          'BALANTARAPU SUBRAMANYAM', 'CH N V PRATAP REDDY', 'MADINA BABI', 'VENKATESWARARAO GUNDABOGULA',
          'MADUTHURI NARAYANA'
        ];

        setStaffList(Array.from(new Set([...fetchedStaff, ...defaultStaff])).sort());
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

  const availableVehicles = useMemo(() => {
    let list = vehiclesList;
    if (formData.society) {
      list = list.filter(v => !v.society || String(v.society).toLowerCase() === String(formData.society).toLowerCase());
    }
    if (formData.branch) {
      list = list.filter(v => !v.branch || String(v.branch).toLowerCase() === String(formData.branch).toLowerCase());
    }
    const regNos = list.map(v => (v.vehicleregno || v.regno || v.busno || v.vehicleno || v.name || '').trim()).filter(Boolean);
    if (formData.vehicleno && !regNos.includes(formData.vehicleno)) {
      regNos.push(formData.vehicleno);
    }
    return Array.from(new Set(regNos)).sort();
  }, [vehiclesList, formData.society, formData.branch, formData.vehicleno]);

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

  const fetchModuleData = async (subTab, branch, forceRefresh = false, extraParams = {}) => {
    if (!currentConfig) return;
    const activeSub = subTab || currentConfig.subTabs[0].id;
    const cacheKey = `${moduleKey}_${activeSub}_${branch || 'ALL'}_${JSON.stringify(extraParams)}`;
    if (!forceRefresh && Array.isArray(cacheRef.current[cacheKey]) && cacheRef.current[cacheKey].length > 0) {
      setModuleData(cacheRef.current[cacheKey]);
      setModuleCurrentPage(1);
      setModuleLoading(false);
      return;
    }

    setModuleLoading(true);
    try {
      const res = await currentConfig.apiFn(activeSub, branch, '', extraParams);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      if (data.length > 0) {
        cacheRef.current[cacheKey] = data;
      }
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
      const activeSubToFetch = (currentSubTabObj?.childSubTabs?.length > 0 && moduleChildSubTab)
        ? moduleChildSubTab
        : validSub;
      fetchModuleData(activeSubToFetch, selectedBranch);
    }
  }, [moduleKey, moduleSubTab, moduleChildSubTab, selectedBranch]);

  const activeSub = moduleSubTab || currentConfig?.subTabs[0]?.id;
  const currentSubConfig = currentConfig?.subTabs?.find(s => s.id === activeSub);

  useEffect(() => {
    if (currentSubConfig?.nestedTabs && currentSubConfig.nestedTabs.length > 0) {
      setNestedSubTab(currentSubConfig.nestedTabs[0].id);
    } else {
      setNestedSubTab('');
    }
    setBusDataFetched(true);
    setBusRegisterNoFilter('');
  }, [activeSub]);

  const filteredModuleData = useMemo(() => {
    let result = Array.isArray(moduleData) ? moduleData : [];

    if (activeSub === 'adbluebusfill' || activeSub === 'busfill') {
      if (nestedSubTab === 'entry_data' && busRegisterNoFilter.trim()) {
        const bq = busRegisterNoFilter.trim().toLowerCase();
        result = result.filter(item => {
          const reg = item?.regno || item?.vehicleregno || item?.vehicleno || '';
          return String(reg).toLowerCase().includes(bq);
        });
      }
      if (nestedSubTab === 'generate_report') {
        if (reportFromDate) {
          result = result.filter(item => {
            const d = item?.date || item?.filldate;
            if (!d) return true;
            let itemDate = String(d);
            if (itemDate.includes('-')) {
              const parts = itemDate.split('-');
              if (parts[0]?.length === 2 && parts[2]?.length === 4) {
                itemDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }
            return itemDate >= reportFromDate;
          });
        }
        if (reportToDate) {
          result = result.filter(item => {
            const d = item?.date || item?.filldate;
            if (!d) return true;
            let itemDate = String(d);
            if (itemDate.includes('-')) {
              const parts = itemDate.split('-');
              if (parts[0]?.length === 2 && parts[2]?.length === 4) {
                itemDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
              }
            }
            return itemDate <= reportToDate;
          });
        }
      }
      if (nestedSubTab === 'search_bus_report' && busSearchRegNo.trim()) {
        const sq = busSearchRegNo.trim().toLowerCase();
        result = result.filter(item => {
          const reg = item?.regno || item?.vehicleregno || item?.vehicleno || '';
          return String(reg).toLowerCase().includes(sq);
        });
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

  const isReportTab = (activeSub === 'adbluebusfill' || activeSub === 'busfill') && nestedSubTab === 'generate_report';
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

  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        society: 'SAROJINI EDUCATIONAL SOCIETY',
        branch: 'MARIKAVALASA-SES',
        regno: 'AP39YB8591',
        routename: 'MRK-RAVINDRA NAGAR',
        date: '22-09-2026',
        capacity: 51,
        students: 31,
        strength: 26,
        omr: 92452,
        cmr: 92560,
        kms: 108,
        distance: 90,
        remarks: ''
      },
      {
        society: 'ADITYA ACADEMY',
        branch: 'MARIKAVALASA-AA',
        regno: 'AP39V4654',
        routename: 'MRK-CHINNAMUSIRIWADA',
        date: '22-09-2026',
        capacity: 50,
        students: 14,
        strength: 23,
        omr: 95674,
        cmr: 95758,
        kms: 84,
        distance: 90,
        remarks: ''
      }
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData, {
      header: ['society', 'branch', 'regno', 'routename', 'date', 'capacity', 'students', 'strength', 'omr', 'cmr', 'kms', 'distance', 'remarks']
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'format');
    XLSX.writeFile(wb, 'format.xlsx');
  };

  const handleUploadExcel = async () => {
    if (!selectedExcelFile) {
      alert('Please choose an Excel file first.');
      return;
    }
    try {
      setUploadingExcel(true);
      const data = await selectedExcelFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

      if (!jsonRows || jsonRows.length === 0) {
        alert('The selected Excel file is empty.');
        setUploadingExcel(false);
        return;
      }

      const mappedRecords = jsonRows.map(row => {
        const obj = {};
        Object.keys(row).forEach(k => {
          const keyClean = k.trim().toLowerCase().replace(/[\s._-]/g, '');
          const val = row[k];
          if (keyClean === 'society') obj.society = String(val).trim();
          else if (keyClean === 'branch') obj.branch = String(val).trim();
          else if (keyClean === 'regno' || keyClean === 'vehicleregno' || keyClean === 'vno') obj.regno = String(val).trim();
          else if (keyClean === 'routename' || keyClean === 'route') obj.route = String(val).trim();
          else if (keyClean === 'date') obj.date = String(val).trim();
          else if (keyClean === 'capacity') obj.capacity = val;
          else if (keyClean === 'students' || keyClean === 'studentsstrength') obj.studentsstrength = val;
          else if (keyClean === 'strength' || keyClean === 'fixedstrength') obj.fixedstrength = val;
          else if (keyClean === 'omr') obj.omr = val;
          else if (keyClean === 'cmr') obj.cmr = val;
          else if (keyClean === 'kms') obj.kms = val;
          else if (keyClean === 'distance' || keyClean === 'distanceinkms') obj.distance = val;
          else if (keyClean === 'remarks') obj.remarks = String(val).trim();
          else obj[k] = val;
        });
        return obj;
      });

      const res = await bulkCreateVehicleItems('trips', mappedRecords);
      alert(res.message || `Successfully uploaded ${mappedRecords.length} vehicle trip records.`);
      setSelectedExcelFile(null);
      fetchModuleData(activeSub, selectedBranch, true);
    } catch (err) {
      console.error('Error parsing/uploading Excel file:', err);
      alert('Failed to upload Excel file: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingExcel(false);
    }
  };

  const handleExportModuleExcel = (cols) => {
    const data = getModuleExportData(cols);
    if (data) exportToExcel(data.headers, data.rows, `${moduleKey}_${moduleSubTab}_Data`);
  };

  // Handle modal input changes with auto-calculated KMS (CMR - OMR) for Vehicle Trips
  const handleInputChange = (key, value) => {
    setFormData(prev => {
      const updated = { ...prev, [key]: value };

      if (key === 'omr' || key === 'cmr' || key === 'distance') {
        const omrVal = updated.omr !== undefined && updated.omr !== null ? String(updated.omr).trim() : '';
        const cmrVal = updated.cmr !== undefined && updated.cmr !== null ? String(updated.cmr).trim() : '';
        const distVal = updated.distance !== undefined && updated.distance !== null ? String(updated.distance).trim() : '';

        if (omrVal !== '' && cmrVal !== '' && !isNaN(Number(omrVal)) && !isNaN(Number(cmrVal))) {
          const kmsCalc = Number(cmrVal) - Number(omrVal);
          updated.kms = kmsCalc;

          if (distVal !== '' && !isNaN(Number(distVal))) {
            const distNum = Number(distVal);
            if (kmsCalc > distNum) {
              updated.result = `exceed${kmsCalc - distNum}`;
            } else {
              updated.result = '';
            }
          }
        } else if (omrVal === '' || cmrVal === '') {
          updated.kms = '';
        }
      }
      return updated;
    });
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
    if (initial.omr !== undefined && initial.cmr !== undefined) {
      const omrVal = String(initial.omr).trim();
      const cmrVal = String(initial.cmr).trim();
      if (omrVal !== '' && cmrVal !== '' && !isNaN(Number(omrVal)) && !isNaN(Number(cmrVal))) {
        initial.kms = Number(cmrVal) - Number(omrVal);
      }
    }
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

  const renderTableCell = (row, col) => {
    const rawVal = row[col.key];
    if (rawVal === undefined || rawVal === null || rawVal === '' || rawVal === 'null' || rawVal === 'undefined') {
      return '-';
    }

    const valStr = String(rawVal).trim();
    if (!valStr || valStr === '-') return '-';

    const colKeyLower = (col.key || '').toLowerCase();
    const isFileCol = col.type === 'image' || col.type === 'file' || [
      'file', 'upload', 'profilepic', 'image', 'pic', 'aadharpic', 'liciensepic', 'licensepic', 'photo'
    ].includes(colKeyLower);

    const isPdf = /\.pdf$/i.test(valStr);
    const isImg = /\.(jpg|jpeg|png|webp|gif|bmp|svg)$/i.test(valStr) || valStr.startsWith('data:image/') || col.type === 'image';

    if (isFileCol || isPdf || isImg) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:1002';
      let fileUrl = valStr;
      if (!valStr.startsWith('http://') && !valStr.startsWith('https://') && !valStr.startsWith('data:')) {
        const cleanPath = valStr.startsWith('/') ? valStr.slice(1) : valStr;
        if (cleanPath.startsWith('uploads/')) {
          fileUrl = `${baseUrl}/${cleanPath}`;
        } else {
          fileUrl = `${baseUrl}/uploads/${cleanPath}`;
        }
      }

      if (isImg) {
        return (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <img
              src={fileUrl}
              alt={col.label || 'Preview'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '6px',
                objectFit: 'cover',
                border: '1px solid #cbd5e1',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
              onClick={() => setPreviewImageModal({ url: fileUrl, title: col.label || 'Image Preview', name: valStr })}
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={() => setPreviewImageModal({ url: fileUrl, title: col.label || 'Image Preview', name: valStr })}
              style={{
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                border: '1px solid #bae6fd',
                borderRadius: '4px',
                padding: '4px 8px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                whiteSpace: 'nowrap'
              }}
            >
              🖼️ View Image
            </button>
          </div>
        );
      }

      if (isPdf) {
        return (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: '#fee2e2',
              color: '#dc2626',
              border: '1px solid #fca5a5',
              borderRadius: '4px',
              padding: '4px 10px',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              whiteSpace: 'nowrap',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
            title={`Open PDF: ${valStr}`}
          >
            <span>📄</span>
            <span>View PDF</span>
          </a>
        );
      }

      return (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            backgroundColor: '#f1f5f9',
            color: '#0284c7',
            border: '1px solid #cbd5e1',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '12px',
            fontWeight: 600,
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            maxWidth: '220px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
          title={`Open file: ${valStr}`}
        >
          <span>📎</span>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{valStr}</span>
        </a>
      );
    }

    return valStr;
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
          <div className="flex justify-center mb-4 mt-4 max-w-full overflow-x-auto">
            <CustomTabs
              activeTab={activeSub}
              onChange={(id) => setModuleSubTab(id)}
              tabs={currentConfig.subTabs}
            />
          </div>
        )}

        {/* 2nd Level Nested Subtabs Ribbon (e.g. for Ad_Bus_Fillings / Bus Fillings) */}
        {currentSubConfig?.nestedTabs && currentSubConfig.nestedTabs.length > 0 && (
          <div className="flex justify-center mb-6 mt-1 max-w-full overflow-x-auto">
            <CustomTabs
              activeTab={nestedSubTab}
              onChange={(id) => {
                setNestedSubTab(id);
                setBusDataFetched(false);
              }}
              tabs={currentSubConfig.nestedTabs}
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

        {/* Ad_Bus_Fillings / Bus Fillings Controls Bar */}
        {(activeSub === 'adbluebusfill' || activeSub === 'busfill') ? (
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
            {nestedSubTab === 'generate_report' ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>fromdate:</label>
                  <input
                    type="date"
                    value={reportFromDate}
                    onChange={(e) => setReportFromDate(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '700', color: '#1e293b' }}>todate:</label>
                  <input
                    type="date"
                    value={reportToDate}
                    onChange={(e) => setReportToDate(e.target.value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13px',
                      backgroundColor: '#ffffff'
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setBusDataFetched(true)}
                  style={{
                    backgroundColor: '#46b8da',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 18px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  getdata
                </button>
              </>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <label style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b' }}>
                    Register No:
                  </label>
                  <div style={{ position: 'relative', width: '220px' }}>
                    <VehicleAutocomplete
                      value={nestedSubTab === 'entry_data' ? busRegisterNoFilter : busSearchRegNo}
                      onChange={(val) => {
                        if (nestedSubTab === 'entry_data') setBusRegisterNoFilter(val);
                        else setBusSearchRegNo(val);
                      }}
                      onSelectVehicle={(veh) => {
                        const selectedReg = veh.regno || veh;
                        if (nestedSubTab === 'entry_data') setBusRegisterNoFilter(selectedReg);
                        else setBusSearchRegNo(selectedReg);
                        setBusDataFetched(true);
                      }}
                      placeholder="Enter reg no..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setBusDataFetched(true)}
                  style={{
                    backgroundColor: '#46b8da',
                    color: '#ffffff',
                    border: 'none',
                    padding: '7px 18px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  getdata
                </button>

                {nestedSubTab === 'entry_data' && (
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
                      cursor: 'pointer'
                    }}
                  >
                    Add New
                  </button>
                )}
              </>
            )}
          </div>
        ) : moduleKey === 'Services' ? (
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
                <VehicleAutocomplete
                  value={serviceRegNoInput}
                  onChange={(val) => {
                    setServiceRegNoInput(val);
                  }}
                  onSelectVehicle={(veh) => {
                    const selectedReg = veh.regno || veh;
                    setServiceRegNoInput(selectedReg);
                    setAppliedServiceRegNo(selectedReg);
                  }}
                  placeholder="Enter reg no..."
                />
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
        ) : (moduleKey === 'Repair Bills' && activeSub === 'repairbills') ? (
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
                <VehicleAutocomplete
                  value={repairRegNoInput}
                  onChange={(val) => {
                    setRepairRegNoInput(val);
                  }}
                  onSelectVehicle={(veh) => {
                    const selectedReg = veh.regno || veh;
                    setRepairRegNoInput(selectedReg);
                    setAppliedRepairRegNo(selectedReg);
                  }}
                  placeholder="Enter reg no..."
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAppliedRepairRegNo(repairRegNoInput.trim());
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
              onClick={() => {
                setRepairRegNoInput('');
                setAppliedRepairRegNo('');
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
              get all data
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
          </div>
        ) : (currentSubTabObj?.childSubTabs?.length > 0 || currentSubConfig?.nestedTabs?.length > 0) ? null : (
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

        {/* Child Sub-Tabs Ribbon using CustomTabs (e.g. Entry Data / Generate Report, Light Motor / Heavy Motor) */}
        {currentSubTabObj?.childSubTabs?.length > 0 && (
          <div className="flex justify-center mb-6 mt-2 max-w-full overflow-x-auto">
            <CustomTabs
              activeTab={moduleChildSubTab || currentSubTabObj.childSubTabs[0].id}
              onChange={(id) => {
                setModuleChildSubTab(id);
                fetchModuleData(id, selectedBranch, false);
              }}
              tabs={currentSubTabObj.childSubTabs}
            />
          </div>
        )}

        {moduleKey === 'Vehicles' && (moduleChildSubTab === 'generatereport' || activeSub === 'generatereport') ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              backgroundColor: '#ffffff',
              padding: '12px 18px',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #cbd5e1'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>fromdate:</label>
              <input
                type="date"
                value={reportFromDate}
                onChange={e => setReportFromDate(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>todate:</label>
              <input
                type="date"
                value={reportToDate}
                onChange={e => setReportToDate(e.target.value)}
                style={{
                  padding: '6px 12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '13px',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
              />
            </div>

            <button
              type="button"
              disabled={moduleLoading}
              onClick={() => fetchModuleData('generatereport', selectedBranch, true, { fromDate: reportFromDate, toDate: reportToDate })}
              style={{
                backgroundColor: '#5bc0de',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              {moduleLoading ? 'Loading...' : 'Get Data'}
            </button>
          </div>
        ) : moduleKey === 'Vehicles' && (activeSub === 'trips' || activeSub === 'entrydata' || moduleChildSubTab === 'entrydata') && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px',
              flexWrap: 'wrap',
              backgroundColor: '#ffffff',
              padding: '12px 18px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0'
            }}
          >
            <button
              type="button"
              onClick={() => fetchModuleData(moduleChildSubTab || activeSub, selectedBranch, true)}
              style={{
                backgroundColor: '#54d4f3',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              View Data
            </button>
            <button
              type="button"
              onClick={handleOpenAddModal}
              style={{
                backgroundColor: '#54d4f3',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Add New
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={e => setSelectedExcelFile(e.target.files[0] || null)}
                style={{
                  fontSize: '13px',
                  padding: '5px 8px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  backgroundColor: '#ffffff'
                }}
              />
            </div>
            <button
              type="button"
              disabled={uploadingExcel}
              onClick={handleUploadExcel}
              style={{
                backgroundColor: '#54d4f3',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                opacity: uploadingExcel ? 0.7 : 1
              }}
            >
              {uploadingExcel ? 'Uploading...' : 'Upload Excel'}
            </button>
            <button
              type="button"
              onClick={handleDownloadSampleExcel}
              style={{
                backgroundColor: '#54d4f3',
                color: '#ffffff',
                border: 'none',
                borderRadius: '4px',
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Download Excel
            </button>
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
                  {hasActionCols && (
                    <>
                      <th style={{ width: '60px', textAlign: 'center' }}>Edit</th>
                      <th style={{ width: '70px', textAlign: 'center' }}>Delete</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {moduleLoading ? (
                  <TableLoader
                    colSpan={activeCols.length + (hasActionCols ? 3 : 1)}
                    message={`Loading ${moduleKey} (${moduleSubTab.replace('_', ' ')}) records, please wait...`}
                  />
                ) : paginatedModuleData.length > 0 ? (
                  paginatedModuleData.map((row, index) => (
                    <tr key={typeof (row._id || row.id) === 'object' ? (row._id?.$oid || row._id?.toString() || index) : (row._id || row.id || index)}>
                      <td><strong>{(moduleCurrentPage - 1) * moduleEntriesPerPage + index + 1}</strong></td>
                      {activeCols.map(col => (
                        <td key={col.key} style={{ fontWeight: 600 }}>
                          {renderTableCell(row, col)}
                        </td>
                      ))}
                      {hasActionCols && (
                        <>
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
            {(() => {
              const isVehicleInfo = (moduleKey === 'Vehicles' && (activeSub === 'info' || activeSub === 'lightmotor' || activeSub === 'heavymotor'));
              const isBranchVehicle = (moduleKey === 'Vehicles' && activeSub === 'branch');
              const isSingleColumnMode = isVehicleInfo || isBranchVehicle;

              return (
                <div
                  className="admin-modal-card"
                  style={{
                    maxWidth: isSingleColumnMode ? '520px' : '650px',
                    width: '100%'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    className="admin-modal-header"
                    style={
                      isSingleColumnMode
                        ? { backgroundColor: '#54d4f3', borderBottom: 'none', padding: '14px 20px' }
                        : {}
                    }
                  >
                    <h3 style={{ width: '100%', textAlign: isSingleColumnMode ? 'center' : 'left', fontSize: '1.2rem', fontWeight: 600 }}>
                      {isBranchVehicle
                        ? 'Branch Vehicle Information'
                        : isVehicleInfo
                          ? 'Vehicle Information'
                          : `${editingId ? 'Edit' : 'Add New'} Record - ${moduleKey} (${activeSub})`}
                    </h3>
                    <button
                      type="button"
                      className="admin-modal-close-btn"
                      onClick={() => setShowModal(false)}
                    >
                      ✕
                    </button>
                  </div>
                  <form onSubmit={handleSaveRecord}>
                    <div
                      className="admin-modal-body"
                      style={{
                        maxHeight: '65vh',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: isSingleColumnMode ? '1fr' : '1fr 1fr',
                        gap: '14px',
                        padding: '20px'
                      }}
                    >
                      {(() => {
                        let fieldsToRender = activeCols;
                        if (isVehicleInfo) {
                          const statusCol = activeCols.find(c => c.key === 'status');
                          const otherCols = activeCols.filter(c => c.key !== 'status');
                          const modelIdx = otherCols.findIndex(c => c.key === 'model');
                          if (modelIdx !== -1 && statusCol) {
                            const copy = [...otherCols];
                            copy.splice(modelIdx + 1, 0, statusCol);
                            fieldsToRender = copy;
                          }
                        }
                        return fieldsToRender.map(col => {
                          const colKeyLower = (col.key || '').toLowerCase();
                          const isImageField = col.type === 'image' || col.type === 'file' || [
                            'file', 'upload', 'profilepic', 'image', 'pic', 'photo', 'aadharpic', 'liciensepic', 'licensepic'
                          ].includes(colKeyLower);

                          return (
                            <div
                              key={col.key}
                              className="admin-form-field"
                              style={{ gridColumn: (isSingleColumnMode || fieldsToRender.length === 1 || isImageField || col.type === 'textarea' || col.type === 'file' || col.key === 'points') ? 'span 1' : 'span 1' }}
                            >
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                                {col?.modalLabel || ((col?.label || col?.key || '').endsWith(':') ? (col?.label || col?.key || '') : `${col?.label || col?.key || ''} :`)}
                              </label>

                              {isImageField ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                  <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '14px',
                                    backgroundColor: '#ffffff',
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: '1px solid #cbd5e1'
                                  }}>
                                    {formData[col.key] ? (
                                      <img
                                        src={
                                          formData[col.key].startsWith('data:') || formData[col.key].startsWith('http')
                                            ? formData[col.key]
                                            : `${import.meta.env.VITE_API_URL || 'http://localhost:1002'}/uploads/${formData[col.key]}`
                                        }
                                        alt="Preview"
                                        style={{
                                          width: '64px',
                                          height: '64px',
                                          objectFit: 'cover',
                                          borderRadius: '6px',
                                          border: '2px solid #0b5299',
                                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                        }}
                                        onError={(e) => { e.target.style.display = 'none'; }}
                                      />
                                    ) : (
                                      <div style={{
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '6px',
                                        border: '2px dashed #cbd5e1',
                                        backgroundColor: '#f8fafc',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#94a3b8',
                                        fontSize: '22px'
                                      }}>
                                        🖼️
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                      <label
                                        htmlFor={`file-upload-${col.key}`}
                                        style={{
                                          padding: '7px 16px',
                                          backgroundColor: '#0b5299',
                                          color: '#ffffff',
                                          borderRadius: '6px',
                                          fontSize: '13px',
                                          fontWeight: 600,
                                          cursor: 'pointer',
                                          display: 'inline-block',
                                          textAlign: 'center',
                                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                                        }}
                                      >
                                        Change Photo
                                      </label>
                                      <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, [col.key]: '' }))}
                                        style={{
                                          padding: '5px 14px',
                                          backgroundColor: '#fef2f2',
                                          color: '#dc2626',
                                          border: '1px solid #fca5a5',
                                          borderRadius: '6px',
                                          fontSize: '12px',
                                          fontWeight: 600,
                                          cursor: 'pointer'
                                        }}
                                      >
                                        Remove Photo
                                      </button>
                                    </div>
                                  </div>
                                  <input
                                    id={`file-upload-${col.key}`}
                                    type="file"
                                    accept="image/*,application/pdf"
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
                        });
                      })()}
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
              );
            })()}
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
                padding: '20px',
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
                  top: '12px',
                  right: '12px',
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
              <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', color: '#0f172a', fontWeight: 600 }}>
                {typeof previewImageModal === 'object' ? (previewImageModal.title || previewImageModal.name || 'File Preview') : 'File Preview'}
              </h4>
              <img
                src={typeof previewImageModal === 'object' ? previewImageModal.url : previewImageModal}
                alt="Preview"
                style={{
                  maxWidth: '80vw',
                  maxHeight: '70vh',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}
              />
              <div style={{ marginTop: '14px', display: 'flex', gap: '12px' }}>
                <a
                  href={typeof previewImageModal === 'object' ? previewImageModal.url : previewImageModal}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Open Full File in New Tab
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ModulePage;
