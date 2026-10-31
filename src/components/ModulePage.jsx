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
  getAdminData, getStaffData, getVehiclesData, getVehicleMasterList, getLastFuelReading
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

const VEHICLE_TYPES_LIST = [
  'AUTO', 'BENZE', 'BIKE', 'BUS', 'CAR', 'DOSTU (HYDRALIC)', 'FORCE', 'TATA AC', 'TRACTOR', 'TRUCK', 'VAN'
];

const VEHICLE_FUELS_LIST = ['Diesel', 'Petrol', 'Others', 'CNG', 'Electric'];

const VEHICLE_STATUSES_LIST = ['Active', 'In Active', 'SOLD', 'SOLD OUT'];

const VEHICLE_INFO_FORM_FIELDS = [
  { key: 'vehicleregno', label: 'Vehicle Reg.No', modalLabel: 'Vehicle Reg.No :', type: 'text' },
  { key: 'make', label: 'Vehicle Make', modalLabel: 'Vehicle Make :', type: 'make-select' },
  { key: 'type', label: 'Vehicle Type', modalLabel: 'Vehicle Type :', type: 'vehicle-type-select' },
  { key: 'fuel', label: 'Fuel', modalLabel: 'Fuel :', type: 'fuel-select' },
  { key: 'model', label: 'Vehicle Model', modalLabel: 'Vehicle Model :', type: 'model-select' },
  { key: 'status', label: 'Vehicle Status', modalLabel: 'Vehicle Status :', type: 'status-select' },
  { key: 'fueltank', label: 'Fuel tank Capacity', modalLabel: 'Fuel tank Capacity :', type: 'text' },
  { key: 'capacity', label: 'Sitting Capacity', modalLabel: 'Sitting Capacity :', type: 'text' },
  { key: 'ekmpl', label: 'E.KMPL', modalLabel: 'E.KMPL :', type: 'text' },
  { key: 'serviceperiod', label: 'Service Period', modalLabel: 'Service Period :', type: 'text' },
  { key: 'servicemilaege', label: 'Service Milaege', modalLabel: 'Service Milaege :', type: 'text' },
  { key: 'tyres', label: 'Tyres', modalLabel: 'Tyres :', type: 'text' },
];

const formatTimeStr = (val, timestamp) => {
  if (val !== undefined && val !== null && val !== '') {
    if (val instanceof Date) {
      const h = String(val.getHours()).padStart(2, '0');
      const m = String(val.getMinutes()).padStart(2, '0');
      return `${h}:${m}`;
    }
    if (typeof val === 'number') {
      if (val >= 0 && val < 1) {
        const totalSeconds = Math.round(val * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      if (val > 1000000000) {
        const d = new Date(val);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      }
    }
    const str = String(val).trim();
    if (str && str !== '-') {
      const num = Number(str);
      if (!isNaN(num) && num >= 0 && num < 1 && str.includes('.')) {
        const totalSeconds = Math.round(num * 86400);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      }
      const timeMatch = str.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s*(AM|PM))?$/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1], 10);
        const minutes = timeMatch[2];
        const meridiem = timeMatch[4];
        if (meridiem) {
          if (meridiem.toUpperCase() === 'PM' && hours < 12) hours += 12;
          if (meridiem.toUpperCase() === 'AM' && hours === 12) hours = 0;
        }
        return `${String(hours).padStart(2, '0')}:${minutes}`;
      }
      return str;
    }
  }
  if (timestamp) {
    const tsNum = Number(timestamp);
    if (!isNaN(tsNum) && tsNum > 0) {
      const d = new Date(tsNum);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }
  }
  return '';
};

const ModulePage = ({ moduleKey }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(() => {
    try {
      const userStr = sessionStorage.getItem('user') || localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
      return null;
    }
  });
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  const currentConfig = SIDEBAR_MODULE_CONFIG[moduleKey];

  const isVmsUser = useMemo(() => {
    const u = user || (() => {
      try {
        const uStr = sessionStorage.getItem('user') || localStorage.getItem('user');
        return uStr ? JSON.parse(uStr) : null;
      } catch (e) { return null; }
    })();
    if (!u) return false;
    const usernameLower = (u.username || '').toLowerCase();
    const roleUpper = (u.role || '').toUpperCase();
    const b = u.branch || '';

    if (roleUpper === 'BRANCH_ADMIN' || roleUpper === 'BRANCH_USER' || usernameLower.includes('adchr')) {
      return false;
    }

    return ['vms', 'vmskkd', 'vc', 'admin'].includes(usernameLower) ||
      ['ADMIN', 'SUPER_ADMIN'].includes(roleUpper) ||
      b === 'VMS' || b === 'ALL';
  }, [user]);

  const visibleSubTabs = useMemo(() => {
    if (!currentConfig?.subTabs) return [];
    if (moduleKey === 'Staff' && !isVmsUser) {
      return currentConfig.subTabs.filter(st => st.id !== 'Designations');
    }
    if (moduleKey === 'Vehicles' && !isVmsUser) {
      return currentConfig.subTabs.filter(st => st.id !== 'makes' && st.id !== 'info');
    }
    if (moduleKey === 'Fuels' && !isVmsUser) {
      return currentConfig.subTabs.filter(st => !['suppliers', 'bunk', 'servicing', 'fuelfill'].includes(st.id));
    }
    return currentConfig.subTabs;
  }, [currentConfig, moduleKey, isVmsUser]);

  const requestedTab = new URLSearchParams(location.search).get('tab');
  const validRequestedTab = visibleSubTabs.some(t => t.id === requestedTab) ? requestedTab : null;

  const [moduleSubTab, setModuleSubTab] = useState(
    validRequestedTab || visibleSubTabs[0]?.id || ''
  );

  const currentSubTabObj = useMemo(() => {
    return visibleSubTabs.find(t => t.id === moduleSubTab);
  }, [visibleSubTabs, moduleSubTab]);

  const [moduleChildSubTab, setModuleChildSubTab] = useState(() => {
    const subObj = visibleSubTabs.find(t => t.id === (validRequestedTab || visibleSubTabs[0]?.id));
    return subObj?.childSubTabs?.length > 0 ? subObj.childSubTabs[0].id : '';
  });
  const getTodayIsoString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getThirtyDaysAgoIsoString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

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
  const [wasValidated, setWasValidated] = useState(false);
  const [formErrors, setFormErrors] = useState({});

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

        // Use the master endpoint: merges branchvehicle + vehicleinfo per registration number
        const masterRes = await getVehicleMasterList().catch(() => null);
        const combinedVehicles = Array.isArray(masterRes?.data) ? masterRes.data : (Array.isArray(masterRes) ? masterRes : []);
        setVehiclesList(combinedVehicles);

        const makesRes = await getVehiclesData('makes', 'ALL').catch(() => null);
        const makesData = Array.isArray(makesRes?.data) ? makesRes.data : (Array.isArray(makesRes) ? makesRes : []);

        const fetchedMakes = new Set();
        const fetchedModels = new Set();

        combinedVehicles.forEach(item => {
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



  const selectableBranches = useMemo(() => {
    if (isVmsUser) {
      const allNames = branchesList.map(b => b.name).filter(Boolean);
      return Array.from(new Set(allNames)).sort();
    }
    if (user?.branches && user.branches.length > 0) {
      return user.branches.filter(b => b && b !== 'ALL' && b !== 'College' && b !== 'VMS');
    }
    if (user?.branch && user.branch !== 'ALL' && user.branch !== 'VMS' && user.branch !== 'College') {
      return [user.branch];
    }
    return [];
  }, [user, isVmsUser, branchesList]);

  const availableBranches = useMemo(() => {
    let list = branchesList.map(b => b.name).filter(Boolean);
    if (formData.society) {
      list = branchesList
        .filter(b => b.society.toLowerCase() === formData.society.toLowerCase())
        .map(b => b.name);
    }
    if (!isVmsUser && selectableBranches.length > 0) {
      list = list.filter(b => selectableBranches.includes(b));
      if (list.length === 0) list = selectableBranches;
    }
    return Array.from(new Set(list)).sort();
  }, [branchesList, formData.society, isVmsUser, selectableBranches]);

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
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/');
      return;
    }
    const userStr = sessionStorage.getItem('user');
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setUser(parsed);
        const usernameLower = (parsed.username || '').toLowerCase();
        const roleUpper = (parsed.role || '').toUpperCase();
        const isVms = ['vms', 'vmskkd', 'vc', 'admin'].includes(usernameLower) ||
          ['ADMIN', 'SUPER_ADMIN'].includes(roleUpper) ||
          parsed.branch === 'VMS' || parsed.branch === 'ALL';
        if (!isVms && parsed.branch && parsed.branch !== 'College' && (!parsed.branches || parsed.branches.length === 0)) {
          setSelectedBranch(parsed.branch);
        } else {
          setSelectedBranch('ALL');
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
  }, [navigate]);

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const fetchModuleData = async (subTab, branch, forceRefresh = false, extraParams = {}, searchQueryParam = '') => {
    if (!currentConfig) return;
    const activeSub = subTab || visibleSubTabs[0]?.id || currentConfig.subTabs[0].id;
    const cacheKey = `${moduleKey}_${activeSub}_${branch || 'ALL'}_${searchQueryParam}_${JSON.stringify(extraParams)}`;
    if (!forceRefresh && Array.isArray(cacheRef.current[cacheKey]) && cacheRef.current[cacheKey].length > 0) {
      setModuleData(cacheRef.current[cacheKey]);
      setModuleCurrentPage(1);
      setModuleLoading(false);
      return;
    }

    setModuleLoading(true);
    try {
      const res = await currentConfig.apiFn(activeSub, branch, searchQueryParam, extraParams);
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
    if (currentConfig && visibleSubTabs.length > 0) {
      const validSub = visibleSubTabs.some(s => s.id === moduleSubTab)
        ? moduleSubTab
        : visibleSubTabs[0].id;
      if (validSub !== moduleSubTab) {
        setModuleSubTab(validSub);
      }
      const activeSubToFetch = (currentSubTabObj?.childSubTabs?.length > 0 && moduleChildSubTab)
        ? moduleChildSubTab
        : validSub;

      if (isVmsUser && (activeSubToFetch === 'busfill' || activeSubToFetch === 'adbluebusfill')) {
        if (!busDataFetched) {
          setModuleLoading(false);
          setModuleData([]);
          return;
        }
      }

      const extraParams = (activeSubToFetch === 'generatereport' || activeSubToFetch === 'generate_report' || nestedSubTab === 'generate_report' || nestedSubTab === 'generatereport')
        ? { fromDate: reportFromDate || '', toDate: reportToDate || '' }
        : {};
      fetchModuleData(activeSubToFetch, selectedBranch, false, extraParams);
    }
  }, [moduleKey, moduleSubTab, moduleChildSubTab, selectedBranch, busDataFetched, visibleSubTabs, nestedSubTab]);

  const activeSub = moduleSubTab || visibleSubTabs[0]?.id || currentConfig?.subTabs[0]?.id;
  const currentSubConfig = visibleSubTabs.find(s => s.id === activeSub) || currentConfig?.subTabs?.find(s => s.id === activeSub);
  const effectiveSubTab = (currentSubConfig?.childSubTabs?.length > 0 && moduleChildSubTab)
    ? moduleChildSubTab
    : activeSub;

  const activeCols = useMemo(() => {
    if (typeof currentConfig?.columns === 'function') {
      return currentConfig.columns(effectiveSubTab, isVmsUser);
    }
    return currentConfig?.columns || [];
  }, [currentConfig, effectiveSubTab, isVmsUser]);

  const [showOptingVehicleDropdown, setShowOptingVehicleDropdown] = useState(false);
  const [showVehicleInfoDropdown, setShowVehicleInfoDropdown] = useState(false);
  const [autoPopulatedFromVehicle, setAutoPopulatedFromVehicle] = useState(false);

  const isVehicleInfo = useMemo(() => {
    return (
      moduleKey === 'Vehicles' &&
      (activeSub === 'info' || activeSub === 'lightmotor' || activeSub === 'heavymotor' ||
       effectiveSubTab === 'info' || effectiveSubTab === 'lightmotor' || effectiveSubTab === 'heavymotor')
    );
  }, [moduleKey, activeSub, effectiveSubTab]);

  const isVehicleFirstTab = useMemo(() => {
    const excludedSubtabs = [
      'makes', 'info', 'lightmotor', 'heavymotor',
      'suppliers', 'bunk', 'servicing', 'fuelfill',
      'Designations', 'Office_Staff', 'BusStaff_Information', 'BusCleaner_Information', 'Staff_Meeting_Register', 'Staff_Remarks',
      'trackbattery', 'tracktyre'
    ];
    if (excludedSubtabs.includes(effectiveSubTab) || excludedSubtabs.includes(activeSub)) return false;

    const vehicleKeys = ['vehicleno', 'vehicleregno', 'regno', 'busnumber', 'busno'];
    const hasVehicleCol = activeCols.some(c => vehicleKeys.includes(c.key) || c.type === 'vehicle-select' || c.type === 'vehicle-autocomplete');
    const hasSocietyOrBranchCol = activeCols.some(c => c.key === 'society' || c.key === 'branch' || c.type === 'society-select' || c.type === 'branch-select');

    return (hasVehicleCol && hasSocietyOrBranchCol) || activeSub === 'otherfillings';
  }, [effectiveSubTab, activeSub, activeCols]);

  const currentVehNoVal = useMemo(() => {
    return String(formData.busnumber || formData.vehicleregno || formData.vehicleno || formData.regno || '').trim();
  }, [formData.busnumber, formData.vehicleregno, formData.vehicleno, formData.regno]);

  const optingVehicleOptions = useMemo(() => {
    if (!isVehicleFirstTab) return [];
    const set = new Set();
    vehiclesList.forEach(v => {
      const reg = (v.vehicleregno || v.regno || v.vehicleno || v.busnumber || v.vno || '').trim();
      if (reg) set.add(reg);
    });
    return Array.from(set).sort();
  }, [vehiclesList, isVehicleFirstTab]);

  const optingVehicleMatches = useMemo(() => {
    if (!isVehicleFirstTab || !currentVehNoVal) return [];
    const query = currentVehNoVal.toLowerCase();
    return vehiclesList.filter(v => {
      const reg = String(v.vehicleregno || v.regno || v.vehicleno || v.busnumber || v.vno || '').trim().toLowerCase();
      return reg === query || reg.includes(query);
    });
  }, [vehiclesList, currentVehNoVal, isVehicleFirstTab]);

  const optingSocietiesList = useMemo(() => {
    if (!isVehicleFirstTab) return societiesList;
    if (!currentVehNoVal) return [];
    const set = new Set();
    optingVehicleMatches.forEach(v => {
      const s = (v.society || v.societyname || '').trim();
      if (s) set.add(s);
    });
    const result = Array.from(set).sort();
    if (formData.society && !result.includes(formData.society)) {
      result.push(formData.society);
    }
    return result;
  }, [isVehicleFirstTab, currentVehNoVal, formData.society, optingVehicleMatches, societiesList]);

  const optingBranchesList = useMemo(() => {
    if (!isVehicleFirstTab) return availableBranches;
    if (!currentVehNoVal) return [];
    const set = new Set();
    optingVehicleMatches.forEach(v => {
      const b = (v.branch || v.branchname || '').trim();
      if (b) set.add(b);
    });
    const result = Array.from(set).sort();
    if (formData.branch && !result.includes(formData.branch)) {
      result.push(formData.branch);
    }
    return result;
  }, [isVehicleFirstTab, currentVehNoVal, formData.branch, optingVehicleMatches, availableBranches]);

  const filteredOptingVehicles = useMemo(() => {
    if (!isVehicleFirstTab) return [];
    const query = currentVehNoVal.toLowerCase();
    if (!query) return optingVehicleOptions.slice(0, 50);
    return optingVehicleOptions.filter(v => v.toLowerCase().includes(query));
  }, [isVehicleFirstTab, currentVehNoVal, optingVehicleOptions]);

  const handleOptingVehicleSelect = (selectedVehNo, colKey) => {
    const vehStr = (selectedVehNo || '').trim();
    const targetKey = colKey || activeCols.find(c => ['vehicleno', 'vehicleregno', 'regno', 'busnumber', 'busno'].includes(c.key) || c.type === 'vehicle-select')?.key || 'vehicleregno';
    if (!vehStr) {
      setFormData(prev => ({
        ...prev,
        [targetKey]: '',
        society: '',
        branch: ''
      }));
      setFormErrors(prev => ({
        ...prev,
        ...(prev[targetKey] ? { [targetKey]: null } : {})
      }));
      return;
    }

    // vehiclesList is now one merged record per reg (from /vehicles/master)
    const match = vehiclesList.find(v => {
      const reg = String(v.vehicleregno || v.regno || v.vehicleno || v.busnumber || v.vno || '').trim().toLowerCase();
      return reg === vehStr.toLowerCase();
    });

    const matchedSoc = match ? (match.society || match.societyname || '') : '';
    const matchedBranch = match ? (match.branch || match.branchname || '') : '';
    const matchedRoute = match ? (match.route || match.routename || '') : '';
    const matchedCapacity = match ? (match.capacity || match.fixedstrength || '') : '';
    const matchedStaff = match ? (match.staffname || match.drivername || '') : '';
    const matchedModel = match ? (match.model || match.vehiclemodel || '') : '';
    const matchedMake = match ? (match.make || match.vehiclemake || '') : '';
    const matchedType = match ? (match.type || match.vehicletype || '') : '';
    const matchedPurchaseDate = match ? (match.purchasedate || '') : '';
    const matchedExpireDate = match ? (match.expiredate || '') : '';
    const matchedFuel = match ? (match.fuel || '') : '';

    setFormData(prev => ({
      ...prev,
      [targetKey]: vehStr,
      ...(matchedSoc ? { society: matchedSoc } : (prev.society !== undefined ? { society: prev.society || '' } : {})),
      ...(matchedBranch ? { branch: matchedBranch } : (prev.branch !== undefined ? { branch: prev.branch || '' } : {})),
      ...(prev.model !== undefined ? { model: matchedModel || prev.model || '' } : {}),
      ...(prev.make !== undefined ? { make: matchedMake || prev.make || '' } : {}),
      ...(prev.vehiclemake !== undefined ? { vehiclemake: matchedMake || prev.vehiclemake || '' } : {}),
      ...(prev.type !== undefined ? { type: matchedType || prev.type || (activeSub === 'busfill' ? 'Own Vehicle' : '') } : {}),
      ...(prev.vehicletype !== undefined ? { vehicletype: activeSub === 'otherfillings' ? prev.vehicletype : (matchedType || prev.vehicletype || (activeSub === 'busfill' ? 'Own Vehicle' : '')) } : {}),
      ...(prev.fuelsupplier !== undefined && !prev.fuelsupplier && activeSub === 'busfill' ? { fuelsupplier: 'Indian Oil Corporation Limited' } : {}),
      ...(prev.purchasedate !== undefined ? { purchasedate: matchedPurchaseDate || prev.purchasedate || '' } : {}),
      ...(prev.expiredate !== undefined ? { expiredate: matchedExpireDate || prev.expiredate || '' } : {}),
      ...(prev.fuel !== undefined ? { fuel: matchedFuel || prev.fuel || '' } : {}),
      ...(prev.route !== undefined ? { route: matchedRoute || prev.route || '' } : {}),
      ...(prev.routename !== undefined ? { routename: matchedRoute || prev.routename || '' } : {}),
      ...(prev.presentroute !== undefined ? { presentroute: matchedRoute || prev.presentroute || '' } : {}),
      ...(prev.capacity !== undefined ? { capacity: matchedCapacity || prev.capacity || '' } : {}),
      ...(prev.fixedstrength !== undefined ? { fixedstrength: matchedCapacity || prev.fixedstrength || '' } : {}),
      ...(prev.staffname !== undefined ? { staffname: matchedStaff || prev.staffname || '' } : {}),
      ...(prev.drivername !== undefined ? { drivername: matchedStaff || prev.drivername || '' } : {})
    }));

    // If in Fuels (busfill) or AdBlue (adbluebusfill), auto-fill previous reading into OMR
    if (activeSub !== 'otherfillings' && (activeSub === 'busfill' || moduleKey === 'Fuels' || activeSub === 'adbluebusfill')) {
      const localRecent = (moduleData || []).find(r => {
        const reg = String(r.vehicleregno || r.regno || '').trim().toLowerCase();
        return reg === vehStr.toLowerCase() && (r.cmr !== undefined && r.cmr !== null && String(r.cmr).trim() !== '');
      });
      if (localRecent && localRecent.cmr) {
        const prevCmr = String(localRecent.cmr).trim();
        setFormData(prev => {
          const upd = { ...prev, omr: prevCmr };
          if (upd.cmr && !isNaN(Number(upd.cmr)) && !isNaN(Number(prevCmr))) {
            const kms = Math.max(0, Number(upd.cmr) - Number(prevCmr));
            upd.kms = kms;
            upd.totalkms = kms;
            if (upd.quantity && !isNaN(Number(upd.quantity)) && Number(upd.quantity) > 0) {
              const kmpl = (kms / Number(upd.quantity)).toFixed(2);
              upd.kmpl = kmpl;
              upd.avgkmpl = kmpl;
            }
          }
          return upd;
        });
      }

      getLastFuelReading(vehStr, activeSub).then(res => {
        if (res && res.success && res.lastCmr) {
          const prevCmr = String(res.lastCmr).trim();
          setFormData(prev => {
            const upd = { ...prev, omr: prevCmr };
            if (upd.cmr && !isNaN(Number(upd.cmr)) && !isNaN(Number(prevCmr))) {
              const kms = Math.max(0, Number(upd.cmr) - Number(prevCmr));
              upd.kms = kms;
              upd.totalkms = kms;
              if (upd.quantity && !isNaN(Number(upd.quantity)) && Number(upd.quantity) > 0) {
                const kmpl = (kms / Number(upd.quantity)).toFixed(2);
                upd.kmpl = kmpl;
                upd.avgkmpl = kmpl;
              }
            }
            return upd;
          });
        }
      }).catch(err => console.error('Failed to get last fuel reading:', err));
    }

    setFormErrors(prev => ({
      ...prev,
      ...(prev[targetKey] ? { [targetKey]: null } : {}),
      ...(matchedSoc && prev.society ? { society: null } : {}),
      ...(matchedBranch && prev.branch ? { branch: null } : {})
    }));
  };

  const allAvailableVehicles = useMemo(() => {
    const map = new Map();
    (vehiclesList || []).forEach(v => {
      const reg = String(v.vehicleregno || v.regno || v.vehicleno || v.busnumber || '').trim().toUpperCase();
      if (reg) map.set(reg, v);
    });
    (moduleData || []).forEach(v => {
      const reg = String(v.vehicleregno || v.regno || v.vehicleno || v.busnumber || '').trim().toUpperCase();
      if (reg) {
        if (!map.has(reg)) {
          map.set(reg, v);
        } else {
          map.set(reg, { ...v, ...map.get(reg) });
        }
      }
    });
    return Array.from(map.values());
  }, [vehiclesList, moduleData]);

  const vehicleInfoSuggestions = useMemo(() => {
    if (!isVehicleInfo) return [];
    const query = String(formData.vehicleregno || formData.regno || '').trim().toLowerCase();
    const cleanQuery = query.replace(/[\s-]/g, '');
    if (!query) {
      return allAvailableVehicles.slice(0, 50);
    }
    return allAvailableVehicles.filter(v => {
      const reg = String(v.vehicleregno || v.regno || v.vehicleno || v.busnumber || '').trim().toLowerCase();
      const cleanReg = reg.replace(/[\s-]/g, '');
      const make = String(v.make || v.vehiclemake || '').toLowerCase();
      const model = String(v.model || v.vehiclemodel || '').toLowerCase();
      return reg.includes(query) || cleanReg.includes(cleanQuery) || make.includes(query) || model.includes(query);
    }).slice(0, 50);
  }, [isVehicleInfo, formData.vehicleregno, formData.regno, allAvailableVehicles]);

  const handleVehicleInfoSelect = (vehicleItem) => {
    if (!vehicleItem) return;
    const selectedReg = (vehicleItem.vehicleregno || vehicleItem.regno || vehicleItem.vehicleno || '').trim().toUpperCase();

    // Normalize fuel to match VEHICLE_FUELS_LIST casing
    let matchedFuel = vehicleItem.fuel || '';
    if (matchedFuel) {
      const foundFuel = VEHICLE_FUELS_LIST.find(f => f.toLowerCase() === matchedFuel.toLowerCase());
      if (foundFuel) matchedFuel = foundFuel;
    }

    // Normalize type to match VEHICLE_TYPES_LIST casing
    let matchedType = vehicleItem.type || vehicleItem.vehicletype || '';
    if (matchedType) {
      const foundType = VEHICLE_TYPES_LIST.find(t => t.toLowerCase() === matchedType.toLowerCase());
      if (foundType) matchedType = foundType;
    }

    // Normalize status to match VEHICLE_STATUSES_LIST casing
    let matchedStatus = vehicleItem.status || 'Active';
    if (matchedStatus) {
      const foundStatus = VEHICLE_STATUSES_LIST.find(s => s.toLowerCase() === matchedStatus.toLowerCase());
      if (foundStatus) matchedStatus = foundStatus;
    }

    // Normalize make to match makesList casing
    let matchedMake = vehicleItem.make || vehicleItem.vehiclemake || '';
    if (matchedMake) {
      const foundMake = makesList.find(m => m.toLowerCase() === matchedMake.toLowerCase());
      if (foundMake) matchedMake = foundMake;
    }

    // Normalize model to match modelsList casing
    let matchedModel = vehicleItem.model || vehicleItem.vehiclemodel || '';
    if (matchedModel) {
      const foundModel = modelsList.find(m => m.toLowerCase() === matchedModel.toLowerCase());
      if (foundModel) matchedModel = foundModel;
    }

    setFormData(prev => ({
      ...prev,
      vehicleregno: selectedReg,
      regno: selectedReg,
      make: matchedMake || prev.make || '',
      type: matchedType || prev.type || '',
      fuel: matchedFuel || prev.fuel || '',
      model: matchedModel || prev.model || '',
      status: matchedStatus || prev.status || 'Active',
      fueltank: vehicleItem.fueltank !== undefined && vehicleItem.fueltank !== null ? String(vehicleItem.fueltank) : (prev.fueltank || ''),
      capacity: vehicleItem.capacity !== undefined && vehicleItem.capacity !== null ? String(vehicleItem.capacity) : (prev.capacity || ''),
      ekmpl: vehicleItem.ekmpl !== undefined && vehicleItem.ekmpl !== null ? String(vehicleItem.ekmpl) : (prev.ekmpl || ''),
      serviceperiod: vehicleItem.serviceperiod !== undefined && vehicleItem.serviceperiod !== null ? String(vehicleItem.serviceperiod) : (prev.serviceperiod || ''),
      servicemilaege: vehicleItem.servicemilaege !== undefined && vehicleItem.servicemilaege !== null ? String(vehicleItem.servicemilaege) : (prev.servicemilaege || ''),
      tyres: vehicleItem.tyres !== undefined && vehicleItem.tyres !== null ? String(vehicleItem.tyres) : (prev.tyres || ''),
      society: vehicleItem.society || prev.society || '',
      branch: vehicleItem.branch || prev.branch || '',
    }));

    setFormErrors(prev => {
      const updated = { ...prev };
      [
        'vehicleregno', 'regno', 'make', 'type', 'fuel', 'model', 'status',
        'fueltank', 'capacity', 'ekmpl', 'serviceperiod', 'servicemilaege', 'tyres'
      ].forEach(k => {
        delete updated[k];
      });
      return updated;
    });

    setAutoPopulatedFromVehicle(true);
    setShowVehicleInfoDropdown(false);
  };

  const handleVehicleRegInputChange = (val) => {
    const upperVal = val.toUpperCase();
    setFormData(prev => ({
      ...prev,
      vehicleregno: upperVal,
      regno: upperVal
    }));

    if (formErrors.vehicleregno || formErrors.regno) {
      setFormErrors(prev => ({ ...prev, vehicleregno: null, regno: null }));
    }

    const cleanVal = upperVal.replace(/[\s-]/g, '');
    if (!cleanVal) {
      setAutoPopulatedFromVehicle(false);
      return;
    }

    // Check if there is an exact match in allAvailableVehicles
    const exactMatch = allAvailableVehicles.find(v => {
      const r = String(v.vehicleregno || v.regno || v.vehicleno || v.busnumber || '').trim().toUpperCase();
      return r === upperVal.trim() || r.replace(/[\s-]/g, '') === cleanVal;
    });

    if (exactMatch) {
      handleVehicleInfoSelect(exactMatch);
    } else {
      setAutoPopulatedFromVehicle(false);
    }
  };


  useEffect(() => {
    if (moduleKey === 'Ad-Blue' && !isVmsUser) {
      if (moduleSubTab !== 'adbluebusfill') {
        setModuleSubTab('adbluebusfill');
      }
    }
  }, [moduleKey, isVmsUser, moduleSubTab]);

  useEffect(() => {
    if (currentSubConfig?.nestedTabs && currentSubConfig.nestedTabs.length > 0 && !(moduleKey === 'Ad-Blue' && !isVmsUser)) {
      setNestedSubTab(currentSubConfig.nestedTabs[0].id);
    } else {
      setNestedSubTab('');
    }
        if (isVmsUser && (activeSub === 'busfill' || activeSub === 'adbluebusfill' || activeSub === 'otherfillings')) {
      setBusDataFetched(false);
      setModuleLoading(false);
      setModuleData([]);
    } else {
      setBusDataFetched(true);
    }
    setBusRegisterNoFilter('');
    setBusSearchRegNo('');
  }, [activeSub, moduleKey, isVmsUser, currentSubConfig]);

  const handleBusFillGetData = (regNoOverride = null) => {
    let targetReg = regNoOverride;
    if (targetReg === null) {
      targetReg = (nestedSubTab === 'entry_data' || !nestedSubTab) ? busRegisterNoFilter : busSearchRegNo;
    } else {
      if (nestedSubTab === 'entry_data') setBusRegisterNoFilter(regNoOverride);
      else setBusSearchRegNo(regNoOverride);
    }
    setBusDataFetched(true);
    const extraParams = (nestedSubTab === 'generate_report' || nestedSubTab === 'generatereport')
      ? { fromDate: reportFromDate || '', toDate: reportToDate || '' }
      : {};
    fetchModuleData(activeSub, selectedBranch, true, extraParams, targetReg);
  };

  const filteredModuleData = useMemo(() => {
    let result = Array.isArray(moduleData) ? moduleData : [];

        if (isVmsUser && (activeSub === 'adbluebusfill' || activeSub === 'busfill' || activeSub === 'otherfillings')) {
      if (!busDataFetched) {
        return [];
      }
      if (nestedSubTab === 'entry_data' && busRegisterNoFilter.trim()) {
        const bq = busRegisterNoFilter.trim().toLowerCase();
        result = result.filter(item => {
          const reg = item?.regno || item?.vehicleregno || item?.vehicleno || '';
          return String(reg).toLowerCase().includes(bq);
        });
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

    if (!moduleSearchQuery.trim()) return result;
    const q = moduleSearchQuery.toLowerCase();
    return result.filter(item =>
      Object.entries(item).some(([k, val]) =>
        k !== '_id' && k !== 'id' && val && String(val).toLowerCase().includes(q)
      )
    );
  }, [moduleData, moduleSearchQuery, nestedSubTab, activeSub, busDataFetched, busRegisterNoFilter, busSearchRegNo, appliedServiceRegNo, moduleKey, moduleChildSubTab]);

  const totalModulePages = Math.ceil(filteredModuleData.length / moduleEntriesPerPage) || 1;
  const paginatedModuleData = useMemo(() => {
    const start = (moduleCurrentPage - 1) * moduleEntriesPerPage;
    return filteredModuleData.slice(start, start + moduleEntriesPerPage);
  }, [filteredModuleData, moduleCurrentPage, moduleEntriesPerPage]);

  const isReportTab = isVmsUser && (activeSub === 'adbluebusfill' || activeSub === 'busfill' || activeSub === 'otherfillings') && nestedSubTab === 'generate_report';
  const hasActionCols = !isReportTab;

  const getModuleExportData = (cols) => {
    if (!filteredModuleData.length) {
      alert('No data available to export');
      return null;
    }
    const headers = cols.map(c => c.label);
    const rows = filteredModuleData.map(row => cols.map(c => {
      let val = row[c.key];
      if (c.key === 'time' || c.type === 'time') {
        val = formatTimeStr(val || row.triptime, row.Timestamp || row.timestamp);
      }
      return val ?? '';
    }));
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
        regno: 'AP39YB8591',
        drivername: 'Ramesh Kumar',
        phone: '9876543210',
        branch: 'MARIKAVALASA-SES',
        routename: 'MRK-RAVINDRA NAGAR',
        date: '22-09-2026',
        time: '08:30',
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
        regno: 'AP39V4654',
        drivername: 'Suresh Babu',
        phone: '9123456780',
        branch: 'MARIKAVALASA-AA',
        routename: 'MRK-CHINNAMUSIRIWADA',
        date: '22-09-2026',
        time: '08:45',
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
      header: ['regno', 'drivername', 'phone', 'branch', 'routename', 'date', 'time', 'capacity', 'students', 'strength', 'omr', 'cmr', 'kms', 'distance', 'remarks']
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
      const workbook = XLSX.read(data, { type: 'array', cellDates: false });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonRows = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

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
          else if (keyClean === 'regno' || keyClean === 'vehicleregno' || keyClean === 'vno' || keyClean === 'busnumber' || keyClean === 'vehiclenumber') {
            obj.regno = String(val).trim();
            obj.vehicleregno = String(val).trim();
          }
                    else if (keyClean === 'drivername' || keyClean === 'driver') {
            obj.drivername = String(val).trim();
          }
          else if (keyClean === 'phone' || keyClean === 'phonenumber' || keyClean === 'driverphone' || keyClean === 'contact') {
            obj.phone = String(val).trim();
          }
          else if (keyClean === 'routename' || keyClean === 'route') {
            obj.route = String(val).trim();
            obj.routename = String(val).trim();
          }
          else if (keyClean === 'date' || keyClean === 'uploaddate') {
            obj.date = String(val).trim();
            obj.uploaddate = String(val).trim();
          }
          else if (keyClean === 'time' || keyClean === 'triptime' || keyClean === 'timing' || keyClean.includes('time')) {
            const timeVal = formatTimeStr(val);
            obj.time = timeVal;
            obj.triptime = timeVal;
          }
          else if (keyClean === 'capacity') obj.capacity = val;
          else if (keyClean === 'students' || keyClean === 'studentsstrength') {
            obj.students = val;
            obj.studentsstrength = val;
          }
          else if (keyClean === 'strength' || keyClean === 'fixedstrength') {
            obj.strength = val;
            obj.fixedstrength = val;
          }
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
      cacheRef.current = {};
      fetchModuleData(effectiveSubTab, selectedBranch, true);
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

  const handleOpenAddModal = () => {
    setEditingId(null);
    setWasValidated(false);
    setFormErrors({});
    setShowVehicleInfoDropdown(false);
    setAutoPopulatedFromVehicle(false);
    const initial = {};
    activeCols.forEach(col => {
      initial[col.key] = col.defaultValue !== undefined ? col.defaultValue : '';
    });
        if (activeSub === 'busfill' || moduleKey === 'Fuels') {
      if (activeSub === 'otherfillings') {
        if (!initial.vehicletype) initial.vehicletype = 'Private';
      } else {
        if (!initial.fuelsupplier) initial.fuelsupplier = 'Indian Oil Corporation Limited';
      }
    }
    if (selectedBranch && selectedBranch !== 'ALL' && selectedBranch !== 'College') {
      initial.branch = selectedBranch;
    } else if (!isVmsUser && selectableBranches.length === 1) {
      initial.branch = selectableBranches[0];
    }
    if (isVehicleInfo) {
      initial.status = 'Active';
      if (effectiveSubTab === 'heavymotor') {
        initial.type = 'BUS';
      }
    }
    setFormData(initial);
    setShowModal(true);
  };

  // Open modal for Editing an existing record
  const handleOpenEditModal = (row) => {
    setEditingId(row._id || row.id);
    setWasValidated(false);
    setFormErrors({});
    setShowVehicleInfoDropdown(false);
    setAutoPopulatedFromVehicle(false);
    const initial = {};
    activeCols.forEach(col => {
      let val = row[col.key];
      if (val === undefined || val === null || val === '') {
        if (col.key === 'settlementmode') val = row.settlement || row.settlementmode;
        else if (col.key === 'accidentplace') val = row.place || row.accidentplace;
        else if (col.key === 'actiontaken') val = row.action || row.actiontaken;
        else if (col.key === 'claimamount') val = row.amount || row.claimamount;
        else if (col.key === 'claimedfrom') val = row.from || row.claimedfrom;
        else if (col.key === 'accidentdescription') val = row.description || row.accidentdescription;
        else if (col.key === 'driverremarks') val = row.remarks || row.driverremarks;
                else if (col.key === 'staffname') val = row.staffname || row.drivername || row.driver;
        else if (col.key === 'drivername') val = row.drivername || row.driver || row.staffname || '';
        else if (col.key === 'phone') val = row.phone || row.phonenumber || row.driverphone || '';
        else if (col.key === 'vehicletype') val = row.vehicletype || row.type || 'Private';
        else if (col.key === 'rate') val = row.rate || row.frate || '';
        else if (col.key === 'quantity') val = row.quantity || row.fquantity || row.filled_Qty || '';
        else if (col.key === 'vehicleregno') val = row.vehicleregno || row.regno || row.vehicleno || row.busnumber || row.busno;
        else if (col.key === 'regno') val = row.regno || row.vehicleregno || row.vehicleno || row.busnumber || row.busno;
        else if (col.key === 'busnumber') val = row.busnumber || row.vehicleregno || row.regno || row.vehicleno || row.busno;
        else if (col.key === 'busno') val = row.busno || row.vehicleregno || row.regno || row.vehicleno;
        else if (col.key === 'profilepic' || col.key === 'photo') val = row.profilepic || row.pic || row.photo;
        else if (col.key === 'employeeid') val = row.employeeid || row.empid || row.employee_id;
        else if (col.key === 'expiredate') val = row.expiredate || row.servicedate || row.expirydate;
        else if (col.key === 'time' || col.type === 'time') val = formatTimeStr(row.time || row.triptime, row.Timestamp || row.timestamp);
      }
      initial[col.key] = val ?? '';
    });
    if (isVehicleInfo) {
      initial.make = row.make || row.vehiclemake || '';
      initial.type = row.type || row.vehicletype || '';
      initial.fuel = row.fuel || '';
      initial.vehicleregno = row.vehicleregno || row.regno || row.vehicleno || '';
      initial.model = row.model || row.vehiclemodel || '';
      initial.status = row.status || 'Active';
      initial.fueltank = row.fueltank !== undefined && row.fueltank !== null ? row.fueltank : '';
      initial.capacity = row.capacity !== undefined && row.capacity !== null ? row.capacity : (row.sittingcapacity || '');
      initial.ekmpl = row.ekmpl !== undefined && row.ekmpl !== null ? row.ekmpl : '';
      initial.serviceperiod = row.serviceperiod !== undefined && row.serviceperiod !== null ? row.serviceperiod : '';
      initial.servicemilaege = row.servicemilaege !== undefined && row.servicemilaege !== null ? row.servicemilaege : '';
      initial.tyres = row.tyres !== undefined && row.tyres !== null ? row.tyres : '';
    }
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

  const isColumnRequired = (col, isEditing = false) => {
    if (col.autoCalc) return false;
    const k = (col.key || '').toLowerCase();
    const optionalKeys = [
      'remarks', 'description', 'points', 'file', 'upload', 'profilepic', 'image', 'pic',
      'photo', 'aadharpic', 'liciensepic', 'licensepic', 'claimamount', 'claimedfrom',
      'driverremarks', 'actiontaken', 'settlementmode', 'accidentdescription', 'accidentplace',
      'waterservicing', 'engineoil', 'chasis', 'springs', 'centerjoints', 'allubolts',
      'airfilling', 'greesing', 'batterymaintenance', 'lights', 'glasses', 'bodypaint',
      'seats', 'gearoil', 'difoil', 'brakeoil', 'atfoil', 'radiatorwater', 'meterreading',
      'warranty', 'status', 'time', 'kms', 'totalkms', 'kmpl', 'avgkmpl', 'total', 'totalrate',
      'fueltank', 'capacity', 'ekmpl', 'serviceperiod', 'servicemilaege', 'tyres'
    ];
    if (optionalKeys.includes(k)) return false;
    if ((col.type === 'image' || col.type === 'file' || k === 'employeeid' || k === 'empid' || k === 'purchasedate' || k === 'expiredate') && isEditing) return false;
    return true;
  };

  // Generic create/update dispatcher
  const handleSaveRecord = async (e) => {
    e.preventDefault();

    const payload = { ...formData };
    if (!payload.branch && selectedBranch !== 'ALL' && selectedBranch !== 'College') {
      payload.branch = selectedBranch;
    }
    if (isVehicleInfo) {
      if (!payload.regno && payload.vehicleregno) payload.regno = payload.vehicleregno;
      if (!payload.vehicleregno && payload.regno) payload.vehicleregno = payload.regno;
    }

    let fieldsToRender = isVehicleInfo ? VEHICLE_INFO_FORM_FIELDS : activeCols;

    const newErrors = {};
    for (const col of fieldsToRender) {
      if (!isColumnRequired(col, !!editingId)) continue;
      const val = payload[col.key];
      if (val === undefined || val === null || String(val).trim() === '') {
        const fieldName = (col.modalLabel || col.label || col.key).replace(/\s*:\s*$/, '');
        newErrors[col.key] = `${fieldName} is required`;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      setWasValidated(true);
      return;
    }

    const effectiveSub = (currentSubConfig?.childSubTabs?.length > 0 && moduleChildSubTab)
      ? moduleChildSubTab
      : activeSub;

    setSubmitting(true);
    try {
      if (editingId) {
        // UPDATE
        if (moduleKey === 'Staff') await updateStaffItem(effectiveSub, editingId, payload);
        else if (moduleKey === 'Vehicles') await updateVehicleItem(effectiveSub, editingId, payload);
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
        if (moduleKey === 'Staff') await createStaffItem(effectiveSub, payload);
        else if (moduleKey === 'Vehicles') await createVehicleItem(effectiveSub, payload);
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
      fetchModuleData(effectiveSub, selectedBranch, true);
    } catch (err) {
      console.error('Failed to save record:', err);
      alert('Error saving record: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGeneratePDF = (row) => {
    const win = window.open('', '_blank');
    if (!win) return;
    const title = `${moduleKey} (${activeSub.replace(/_/g, ' ')})`;
    win.document.write(`
      <!DOCTYPE html>
      <html><head><title>${title} Report</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 24px; color: #1e293b; background: #fff; }
        .header { text-align: center; border-bottom: 2px solid #0b5299; padding-bottom: 12px; margin-bottom: 20px; }
        .header h2 { margin: 0; color: #0b5299; font-size: 22px; text-transform: capitalize; }
        .header p { margin: 4px 0 0; font-size: 13px; color: #64748b; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 10px 14px; font-size: 13px; text-align: left; }
        th { background-color: #f1f5f9; width: 35%; font-weight: 600; color: #0d233b; }
        @media print {
          body { padding: 0; }
        }
      </style>
      </head><body>
      <div class="header">
        <h2>${title} Report</h2>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        ${activeCols.map(c => `<tr><th>${c.label}</th><td>${(c.key === 'time' || c.type === 'time') ? (formatTimeStr(row[c.key] || row.time || row.triptime, row.Timestamp || row.timestamp) || '-') : (row[c.key] !== undefined && row[c.key] !== null ? String(row[c.key]) : '-')}</td></tr>`).join('')}
      </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const renderTableCell = (row, col) => {
    let rawVal = row[col.key];
    if (rawVal === undefined || rawVal === null || rawVal === '' || rawVal === 'null' || rawVal === 'undefined') {
      if (col.key === 'settlementmode') rawVal = row.settlement || row.settlementmode;
      else if (col.key === 'accidentplace') rawVal = row.place || row.accidentplace;
      else if (col.key === 'actiontaken') rawVal = row.action || row.actiontaken;
      else if (col.key === 'claimamount') rawVal = row.amount || row.claimamount;
      else if (col.key === 'claimedfrom') rawVal = row.from || row.claimedfrom;
      else if (col.key === 'accidentdescription') rawVal = row.description || row.accidentdescription;
      else if (col.key === 'driverremarks') rawVal = row.remarks || row.driverremarks;
      else if (col.key === 'staffname') rawVal = row.staffname || row.drivername || row.driver;
      else if (col.key === 'vehicleregno') rawVal = row.vehicleregno || row.regno || row.vehicleno || row.busnumber || row.busno;
      else if (col.key === 'regno') rawVal = row.regno || row.vehicleregno || row.vehicleno || row.busnumber || row.busno;
      else if (col.key === 'busnumber') rawVal = row.busnumber || row.vehicleregno || row.regno || row.vehicleno || row.busno;
      else if (col.key === 'busno') rawVal = row.busno || row.vehicleregno || row.regno || row.vehicleno;
      else if (col.key === 'profilepic' || col.key === 'photo') rawVal = row.profilepic || row.pic || row.photo;
      else if (col.key === 'employeeid') rawVal = row.employeeid || row.empid || row.employee_id;
      else if (col.key === 'expiredate') rawVal = row.expiredate || row.servicedate || row.expirydate;
      else if (col.key === 'time' || col.type === 'time') rawVal = formatTimeStr(row.time || row.triptime, row.Timestamp || row.timestamp);
    }
    if (col.key === 'time' || col.type === 'time') {
      const formattedTime = formatTimeStr(rawVal, row.Timestamp || row.timestamp);
      return formattedTime || '-';
    }
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
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
          <div className="module-top-badge">
            <div className="module-top-badge-icon">
              <IconComponent size={16} />
            </div>
            <div className="module-top-badge-label">{moduleKey}</div>
          </div>

          {/* Branch selector removed */}
        </div>

        {/* Subtabs Ribbon using CustomTabs */}
        {currentConfig && visibleSubTabs.length >= 1 && (
          <div className="flex justify-center mb-4 mt-4 max-w-full overflow-x-auto">
            <CustomTabs
              activeTab={activeSub}
                            onChange={(id) => {
                if (isVmsUser && (id === 'busfill' || id === 'adbluebusfill' || id === 'otherfillings')) {
                  setBusDataFetched(false);
                  setModuleLoading(false);
                  setModuleData([]);
                }
                setModuleSubTab(id);
              }}
              tabs={visibleSubTabs}
            />
          </div>
        )}

        {/* 2nd Level Nested Subtabs Ribbon (e.g. for Ad_Bus_Fillings / Bus Fillings) */}
        {isVmsUser && currentSubConfig?.nestedTabs && currentSubConfig.nestedTabs.length > 0 && (
          <div className="flex justify-center mb-6 mt-1 max-w-full overflow-x-auto">
            <CustomTabs
              activeTab={nestedSubTab}
              onChange={(id) => {
                setNestedSubTab(id);
                setBusDataFetched(false);
                setModuleLoading(false);
                setModuleData([]);
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
                  <button
                    type="button"
                    disabled={moduleLoading}
                    onClick={() => fetchModuleData('generatereport', selectedBranch, true, { fromDate, toDate })}
                    style={{
                      padding: '6px 16px',
                      borderRadius: '6px',
                      backgroundColor: '#38bdf8',
                      border: 'none',
                      color: '#0f172a',
                      fontSize: '13px',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    {moduleLoading ? 'Loading...' : 'Get Data'}
                  </button>
                  {(fromDate || toDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setFromDate('');
                        setToDate('');
                        fetchModuleData('generatereport', selectedBranch, true, { fromDate: '', toDate: '' });
                      }}
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
        {(isVmsUser && (activeSub === 'adbluebusfill' || activeSub === 'busfill' || activeSub === 'otherfillings')) ? (
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
                  onClick={() => handleBusFillGetData()}
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
                {(reportFromDate || reportToDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setReportFromDate('');
                      setReportToDate('');
                      fetchModuleData(activeSub, selectedBranch, true, { fromDate: '', toDate: '' });
                    }}
                    style={{
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 16px',
                      borderRadius: '4px',
                      fontSize: '13px',
                      fontWeight: '600',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Filter
                  </button>
                )}
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
                        handleBusFillGetData(selectedReg);
                      }}
                      placeholder="Enter reg no..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleBusFillGetData()}
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

                {(nestedSubTab === 'entry_data' || (activeSub === 'adbluebusfill' && !isVmsUser)) && (
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

            {isVmsUser && (
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
            )}

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
        ) : (currentSubTabObj?.childSubTabs?.length > 0 || (isVmsUser && currentSubConfig?.nestedTabs?.length > 0)) ? null : (
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
              Add New
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
                const extraParams = (id === 'generatereport' || id === 'generate_report')
                  ? { fromDate: reportFromDate || '', toDate: reportToDate || '' }
                  : {};
                fetchModuleData(id, selectedBranch, false, extraParams);
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
            {(reportFromDate || reportToDate) && (
              <button
                type="button"
                disabled={moduleLoading}
                onClick={() => {
                  setReportFromDate('');
                  setReportToDate('');
                  fetchModuleData('generatereport', selectedBranch, true, { fromDate: '', toDate: '' });
                }}
                style={{
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '7px 16px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}
              >
                Clear Filter
              </button>
            )}
          </div>
        ) : moduleKey === 'Vehicles' && (activeSub === 'trips' || activeSub === 'entrydata' || moduleChildSubTab === 'entrydata') ? (
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
              onClick={() => fetchModuleData(moduleChildSubTab || activeSub, selectedBranch, true, {})}
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
        ) : (moduleKey === 'Vehicles' && (activeSub === 'info' || effectiveSubTab === 'lightmotor' || effectiveSubTab === 'heavymotor')) ? (
          <div className="admin-actions-bar">
            <button
              type="button"
              className="admin-action-btn"
              disabled={moduleLoading}
              onClick={() => fetchModuleData(effectiveSubTab, selectedBranch, true)}
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
              Add New
            </button>
          </div>
        ) : null}

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
                      <th style={{ width: '60px', textAlign: 'center' }}>Print</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {moduleLoading ? (
                  <TableLoader
                    colSpan={activeCols.length + (hasActionCols ? 4 : 1)}
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
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="admin-icon-btn print"
                              title="Print PDF"
                              onClick={() => handleGeneratePDF(row)}
                            >
                              <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H7a2 2 0 00-2 2v4h10z" />
                              </svg>
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={activeCols.length + (hasActionCols ? 4 : 1)} className="empty-cell">
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
              const isVehicleInfo = (moduleKey === 'Vehicles' && (activeSub === 'info' || activeSub === 'lightmotor' || activeSub === 'heavymotor' || effectiveSubTab === 'info' || effectiveSubTab === 'lightmotor' || effectiveSubTab === 'heavymotor'));
              const isBranchVehicle = (moduleKey === 'Vehicles' && activeSub === 'branch');
              const isSingleColumnMode = isVehicleInfo || isBranchVehicle;

              return (
                <div
                  className="admin-modal-card"
                  style={{
                    maxWidth: isSingleColumnMode ? '540px' : '650px',
                    width: '100%'
                  }}
                  onClick={e => e.stopPropagation()}
                >
                  <div
                    className="admin-modal-header"
                    style={
                      isBranchVehicle
                        ? { backgroundColor: '#54d4f3', borderBottom: 'none', padding: '14px 20px' }
                        : {}
                    }
                  >
                    <h3 style={{ width: '100%', fontSize: '1.15rem', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                      {isBranchVehicle
                        ? 'Branch Vehicle Information'
                        : isVehicleInfo
                          ? 'Vehicle Information'
                          : (activeSub === 'otherfillings' ? `${editingId ? 'Edit' : 'Add New'} Record - Other Fillings` : `${editingId ? 'Edit' : 'Add New'} Record - ${moduleKey} (${activeSub})`)}
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
                        maxHeight: '70vh',
                        overflowY: 'auto',
                        display: 'grid',
                        gridTemplateColumns: isSingleColumnMode ? '1fr' : '1fr 1fr',
                        gap: '14px',
                        padding: '24px'
                      }}
                    >
                      {wasValidated && Object.keys(formErrors).length > 0 && (
                        <div className="alert-danger-bs" style={{ gridColumn: '1 / -1' }}>
                          <span>⚠️</span>
                          <span>Please fill in all required fields highlighted below.</span>
                        </div>
                      )}
                      {(() => {
                        let fieldsToRender = isVehicleInfo ? VEHICLE_INFO_FORM_FIELDS : activeCols;
                        return fieldsToRender.map(col => {
                          const colKeyLower = (col.key || '').toLowerCase();
                          const isImageField = col.type === 'image' || col.type === 'file' || [
                            'file', 'upload', 'profilepic', 'image', 'pic', 'photo', 'aadharpic', 'liciensepic', 'licensepic'
                          ].includes(colKeyLower);

                          const isReq = isColumnRequired(col, !!editingId);
                          const isInvalid = wasValidated && !!formErrors[col.key];

                          const handleFieldChange = (val) => {
                            setFormData(prev => {
                              const updated = { ...prev, [col.key]: val };

                              // Auto-calculate KMS / Total Kms when OMR or CMR changes
                              if (col.key === 'omr' || col.key === 'cmr') {
                                const omrVal = updated.omr !== undefined && updated.omr !== null ? String(updated.omr).trim() : '';
                                const cmrVal = updated.cmr !== undefined && updated.cmr !== null ? String(updated.cmr).trim() : '';
                                if (omrVal !== '' && cmrVal !== '' && !isNaN(Number(omrVal)) && !isNaN(Number(cmrVal))) {
                                  const kmsCalc = Math.max(0, Number(cmrVal) - Number(omrVal));
                                  if (updated.kms !== undefined) updated.kms = kmsCalc;
                                  if (updated.totalkms !== undefined) updated.totalkms = kmsCalc;

                                  // Trips result
                                  const distVal = updated.distance !== undefined && updated.distance !== null ? String(updated.distance).trim() : '';
                                  if (distVal !== '' && !isNaN(Number(distVal))) {
                                    const distNum = Number(distVal);
                                    if (kmsCalc > distNum) {
                                      updated.result = `exceed${kmsCalc - distNum}`;
                                    } else {
                                      updated.result = '';
                                    }
                                  }

                                  // KMPL calculation
                                  const qtyVal = updated.quantity || updated.fquantity || '';
                                  if (qtyVal !== '' && !isNaN(Number(qtyVal)) && Number(qtyVal) > 0) {
                                    const kmpl = (kmsCalc / Number(qtyVal)).toFixed(2);
                                    if (updated.kmpl !== undefined) updated.kmpl = kmpl;
                                    if (updated.avgkmpl !== undefined) updated.avgkmpl = kmpl;
                                  }
                                } else if (omrVal === '' || cmrVal === '') {
                                  if (updated.kms !== undefined) updated.kms = '';
                                  if (updated.totalkms !== undefined) updated.totalkms = '';
                                  if (updated.kmpl !== undefined) updated.kmpl = '';
                                  if (updated.avgkmpl !== undefined) updated.avgkmpl = '';
                                }
                              }

                              // Auto-calculate KMPL and Total Rate when Quantity changes
                              if (col.key === 'quantity' || col.key === 'fquantity') {
                                const qtyVal = val !== undefined && val !== null ? String(val).trim() : '';
                                const kmsVal = updated.kms !== undefined ? updated.kms : (updated.totalkms !== undefined ? updated.totalkms : '');
                                if (qtyVal !== '' && !isNaN(Number(qtyVal)) && Number(qtyVal) > 0 && kmsVal !== '' && !isNaN(Number(kmsVal))) {
                                  const kmpl = (Number(kmsVal) / Number(qtyVal)).toFixed(2);
                                  if (updated.kmpl !== undefined) updated.kmpl = kmpl;
                                  if (updated.avgkmpl !== undefined) updated.avgkmpl = kmpl;
                                }

                                const rateVal = updated.rate || updated.frate || '';
                                if (qtyVal !== '' && !isNaN(Number(qtyVal)) && rateVal !== '' && !isNaN(Number(rateVal))) {
                                  const tot = (Number(rateVal) * Number(qtyVal)).toFixed(2);
                                  if (updated.total !== undefined) updated.total = tot;
                                  if (updated.totalrate !== undefined) updated.totalrate = tot;
                                }
                              }

                              // Auto-calculate Total Rate when Rate changes
                              if (col.key === 'rate' || col.key === 'frate') {
                                const rateVal = val !== undefined && val !== null ? String(val).trim() : '';
                                const qtyVal = updated.quantity || updated.fquantity || '';
                                if (rateVal !== '' && !isNaN(Number(rateVal)) && qtyVal !== '' && !isNaN(Number(qtyVal))) {
                                  const tot = (Number(rateVal) * Number(qtyVal)).toFixed(2);
                                  if (updated.total !== undefined) updated.total = tot;
                                  if (updated.totalrate !== undefined) updated.totalrate = tot;
                                }
                              }

                              return updated;
                            });

                            if (formErrors[col.key]) {
                              setFormErrors(prev => ({ ...prev, [col.key]: null }));
                            }
                          };

                          return (
                            <div
                              key={col.key}
                              className="admin-form-field"
                              style={{ gridColumn: (isSingleColumnMode || fieldsToRender.length === 1 || isImageField || col.type === 'textarea' || col.type === 'file' || col.key === 'points') ? 'span 1' : 'span 1' }}
                            >
                              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px', display: 'block' }}>
                                {col?.modalLabel || ((col?.label || col?.key || '').endsWith(':') ? (col?.label || col?.key || '') : `${col?.label || col?.key || ''} :`)}
                                {isReq && <span style={{ color: '#ef4444', marginLeft: '4px' }}>*</span>}
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
                                    border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1'
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
                                        onClick={() => handleFieldChange('')}
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
                                    onChange={e => {
                                      handleImageFileChange(e, col.key);
                                      if (formErrors[col.key]) {
                                        setFormErrors(prev => ({ ...prev, [col.key]: null }));
                                      }
                                    }}
                                  />
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : col.type === 'society-select' || col.key === 'society' ? (
                                <div>
                                  <select
                                    value={formData[col.key] ?? ''}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      setFormData(prev => ({ ...prev, [col.key]: val, branch: '' }));
                                      if (formErrors[col.key]) {
                                        setFormErrors(prev => ({ ...prev, [col.key]: null }));
                                      }
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      backgroundColor: '#ffffff'
                                    }}
                                  >
                                    <option value="">-- Select Society --</option>
                                    {(isVehicleFirstTab ? optingSocietiesList : societiesList).map((soc, idx) => (
                                      <option key={idx} value={soc}>{soc}</option>
                                    ))}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : col.type === 'branch-select' || col.key === 'branch' ? (
                                <div>
                                  <select
                                    value={formData[col.key] ?? ''}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      backgroundColor: '#ffffff'
                                    }}
                                  >
                                    <option value="">-- Select Branch --</option>
                                    {(isVehicleFirstTab ? optingBranchesList : availableBranches).map((b, idx) => (
                                      <option key={idx} value={b}>{b}</option>
                                    ))}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (isVehicleInfo && (col.key === 'vehicleregno' || col.key === 'regno')) ? (
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="text"
                                    className={isInvalid ? 'is-invalid' : ''}
                                    placeholder="Enter Vehicle Reg.No (e.g. 2211 or AP05TC6076)..."
                                    value={formData[col.key] ?? ''}
                                    onChange={e => handleVehicleRegInputChange(e.target.value)}
                                    onFocus={() => setShowVehicleInfoDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowVehicleInfoDropdown(false), 250)}
                                    autoComplete="off"
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: isInvalid ? '1px solid #ef4444' : (showVehicleInfoDropdown ? '1px solid #0b5299' : '1px solid #cbd5e1'),
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      backgroundColor: '#ffffff',
                                      color: '#0d233b',
                                      fontWeight: 600,
                                      outline: 'none',
                                      boxShadow: showVehicleInfoDropdown ? '0 0 0 3px rgba(11, 82, 153, 0.15)' : 'none',
                                      transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                                    }}
                                  />

                                  {autoPopulatedFromVehicle && (
                                    <div style={{
                                      marginTop: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      color: '#15803d',
                                      backgroundColor: '#f0fdf4',
                                      padding: '4px 10px',
                                      borderRadius: '6px',
                                      border: '1px solid #bbf7d0'
                                    }}>
                                      <span>✓</span>
                                      <span>Details auto-populated from vehicle database</span>
                                    </div>
                                  )}

                                  {showVehicleInfoDropdown && vehicleInfoSuggestions.length > 0 && (
                                    <ul
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        maxHeight: '220px',
                                        overflowY: 'auto',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '10px',
                                        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15), 0 8px 10px -6px rgba(0,0,0,0.1)',
                                        zIndex: 1050,
                                        margin: '4px 0 0 0',
                                        padding: '4px 0',
                                        listStyle: 'none'
                                      }}
                                    >
                                      <li style={{
                                        padding: '6px 12px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                        color: '#64748b',
                                        backgroundColor: '#f8fafc',
                                        borderBottom: '1px solid #e2e8f0'
                                      }}>
                                        Select Vehicle ({vehicleInfoSuggestions.length} found)
                                      </li>
                                      {vehicleInfoSuggestions.map((v, idx) => {
                                        const regNo = (v.vehicleregno || v.regno || v.vehicleno || '').trim();
                                        const subtitle = [v.make, v.model, v.type].filter(Boolean).join(' • ');
                                        return (
                                          <li
                                            key={idx}
                                            style={{
                                              padding: '9px 14px',
                                              cursor: 'pointer',
                                              borderBottom: idx === vehicleInfoSuggestions.length - 1 ? 'none' : '1px solid #f1f5f9',
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'space-between',
                                              transition: 'background-color 0.15s ease'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#eff6ff'}
                                            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#ffffff'}
                                            onMouseDown={() => handleVehicleInfoSelect(v)}
                                          >
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0b5299', letterSpacing: '0.02em' }}>
                                                {regNo}
                                              </span>
                                              {subtitle && (
                                                <span style={{ fontSize: '11px', color: '#64748b' }}>
                                                  {subtitle}
                                                </span>
                                              )}
                                            </div>
                                            <span style={{
                                              fontSize: '11px',
                                              padding: '3px 8px',
                                              borderRadius: '6px',
                                              backgroundColor: '#f1f5f9',
                                              color: '#475569',
                                              fontWeight: 600
                                            }}>
                                              {v.status || 'Active'}
                                            </span>
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}

                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (col.type === 'make-select' || col.key === 'make' || col.key === 'vehiclemake') ? (
                                <div>
                                  <select
                                    value={formData[col.key] ?? ''}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: isInvalid ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      backgroundColor: '#f8fafc',
                                      color: '#0d233b',
                                      fontWeight: 500,
                                      outline: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="">-- Select Vehicle Make --</option>
                                    {makesList.map((m, idx) => (
                                      <option key={idx} value={m}>{m}</option>
                                    ))}
                                    {formData[col.key] && !makesList.includes(formData[col.key]) && (
                                      <option value={formData[col.key]}>{formData[col.key]}</option>
                                    )}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (col.type === 'vehicle-type-select' || (isVehicleInfo && (col.key === 'type' || col.key === 'vehicletype'))) ? (
                                <div>
                                  <select
                                    value={formData[col.key] ?? ''}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: isInvalid ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      backgroundColor: '#f8fafc',
                                      color: '#0d233b',
                                      fontWeight: 500,
                                      outline: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="">-- Select Vehicle Type --</option>
                                    {VEHICLE_TYPES_LIST.map((t, idx) => (
                                      <option key={idx} value={t}>{t}</option>
                                    ))}
                                    {formData[col.key] && !VEHICLE_TYPES_LIST.includes(formData[col.key]) && (
                                      <option value={formData[col.key]}>{formData[col.key]}</option>
                                    )}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (col.type === 'fuel-select' || (isVehicleInfo && col.key === 'fuel')) ? (
                                <div>
                                  <select
                                    value={formData[col.key] ?? ''}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: isInvalid ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      backgroundColor: '#f8fafc',
                                      color: '#0d233b',
                                      fontWeight: 500,
                                      outline: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="">-- Select Fuel --</option>
                                    {VEHICLE_FUELS_LIST.map((f, idx) => (
                                      <option key={idx} value={f}>{f}</option>
                                    ))}
                                    {formData[col.key] && !VEHICLE_FUELS_LIST.includes(formData[col.key]) && (
                                      <option value={formData[col.key]}>{formData[col.key]}</option>
                                    )}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (col.type === 'model-select' || col.key === 'model' || col.key === 'vehiclemodel') ? (
                                <div>
                                  <select
                                    value={formData[col.key] ?? ''}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: isInvalid ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      backgroundColor: '#f8fafc',
                                      color: '#0d233b',
                                      fontWeight: 500,
                                      outline: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <option value="">-- Select Vehicle Model --</option>
                                    {modelsList.map((m, idx) => (
                                      <option key={idx} value={m}>{m}</option>
                                    ))}
                                    {formData[col.key] && !modelsList.includes(formData[col.key]) && (
                                      <option value={formData[col.key]}>{formData[col.key]}</option>
                                    )}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (col.type === 'status-select' || (isVehicleInfo && col.key === 'status')) ? (
                                <div>
                                  <select
                                    value={formData[col.key] || 'Active'}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: isInvalid ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                      borderRadius: '10px',
                                      fontSize: '13px',
                                      backgroundColor: '#f8fafc',
                                      color: '#0d233b',
                                      fontWeight: 500,
                                      outline: 'none',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {VEHICLE_STATUSES_LIST.map((s, idx) => (
                                      <option key={idx} value={s}>{s}</option>
                                    ))}
                                    {formData[col.key] && !VEHICLE_STATUSES_LIST.includes(formData[col.key]) && (
                                      <option value={formData[col.key]}>{formData[col.key]}</option>
                                    )}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : col.type === 'vehicle-select' || col.key === 'vehicleno' || col.key === 'regno' || col.key === 'vehicleregno' || col.key === 'busnumber' || col.key === 'busno' ? (
                                <div style={{ position: 'relative' }}>
                                  <input
                                    type="text"
                                    className={isInvalid ? 'is-invalid' : ''}
                                    placeholder={`Enter ${(col.label || col.key).toLowerCase()}...`}
                                    value={formData[col.key] ?? ''}
                                    onChange={e => {
                                      const val = e.target.value;
                                      if (isVehicleFirstTab) {
                                        handleOptingVehicleSelect(val, col.key);
                                      } else {
                                        handleFieldChange(val);
                                      }
                                    }}
                                    onFocus={() => {
                                      if (isVehicleFirstTab) {
                                        setShowOptingVehicleDropdown(true);
                                      }
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => setShowOptingVehicleDropdown(false), 200);
                                    }}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      backgroundColor: '#ffffff'
                                    }}
                                  />
                                  {isVehicleFirstTab && showOptingVehicleDropdown && filteredOptingVehicles.length > 0 && (
                                    <ul
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        right: 0,
                                        maxHeight: '180px',
                                        overflowY: 'auto',
                                        backgroundColor: '#ffffff',
                                        border: '1px solid #cbd5e1',
                                        borderRadius: '4px',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        zIndex: 1000,
                                        margin: '4px 0 0 0',
                                        padding: 0,
                                        listStyle: 'none'
                                      }}
                                    >
                                      {filteredOptingVehicles.map((vNo, idx) => (
                                        <li
                                          key={idx}
                                          style={{
                                            padding: '8px 12px',
                                            fontSize: '13px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid #f1f5f9'
                                          }}
                                          onMouseDown={() => {
                                            handleOptingVehicleSelect(vNo, col.key);
                                            setShowOptingVehicleDropdown(false);
                                          }}
                                        >
                                          {vNo}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : col.type === 'designation-select' || col.key === 'designation' ? (
                                <div>
                                  <select
                                    value={formData[col.key] ?? ''}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
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
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : col.type === 'date' || col.key === 'dateofjoin' || col.key === 'rdate' || col.key === 'valid' || col.key === 'purchasedate' || col.key === 'expiredate' ? (
                                <div>
                                  <input
                                    type="date"
                                    className={isInvalid ? 'is-invalid' : ''}
                                    value={formatDateForInput(formData[col.key])}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px'
                                    }}
                                  />
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : col.type === 'time' || col.key === 'time' ? (
                                <div>
                                  <input
                                    type="time"
                                    className={isInvalid ? 'is-invalid' : ''}
                                    value={formData[col.key] ?? ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px'
                                    }}
                                  />
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (col.type === 'fuel-type-select' || ((activeSub === 'busfill' || activeSub === 'otherfillings' || moduleKey === 'Fuels') && (col.key === 'type' || col.key === 'vehicletype'))) ? (
                                <div>
                                                                    <select
                                    value={formData[col.key] || (activeSub === 'otherfillings' ? 'Private' : 'Own Vehicle')}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      backgroundColor: '#ffffff'
                                    }}
                                  >
                                    {(activeSub === 'otherfillings'
                                      ? ['Private', 'Stores', 'Power House']
                                      : ['Own Vehicle', 'Hired', 'Private', 'Others', 'Power House', 'Stores']
                                    ).map((opt, idx) => (
                                      <option key={idx} value={opt}>{opt === 'Private' && activeSub === 'otherfillings' ? 'Private Vehicle' : opt}</option>
                                    ))}
                                    {formData[col.key] && !(activeSub === 'otherfillings'
                                      ? ['Private', 'Stores', 'Power House']
                                      : ['Own Vehicle', 'Hired', 'Private', 'Others', 'Power House', 'Stores']
                                    ).includes(formData[col.key]) && (
                                      <option value={formData[col.key]}>{formData[col.key]}</option>
                                    )}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (col.type === 'fuel-supplier-select' || ((activeSub === 'busfill' || moduleKey === 'Fuels') && col.key === 'fuelsupplier')) ? (
                                <div>
                                  <select
                                    value={formData[col.key] || 'Indian Oil Corporation Limited'}
                                    className={isInvalid ? 'is-invalid' : ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      backgroundColor: '#ffffff'
                                    }}
                                  >
                                    {['Indian Oil Corporation Limited', 'BHARAT PETROLEUM L.T.D', 'HPC Ltd.,', 'INDIAN OIL', 'OTHER'].map((opt, idx) => (
                                      <option key={idx} value={opt}>{opt}</option>
                                    ))}
                                    {formData[col.key] && !['Indian Oil Corporation Limited', 'BHARAT PETROLEUM L.T.D', 'HPC Ltd.,', 'INDIAN OIL', 'OTHER'].includes(formData[col.key]) && (
                                      <option value={formData[col.key]}>{formData[col.key]}</option>
                                    )}
                                  </select>
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                                                             ) : col.type === 'textarea' ? (
                                 <div>
                                   <textarea
                                     className={isInvalid ? 'is-invalid' : ''}
                                     placeholder={`Enter ${col.label.toLowerCase()}...`}
                                     value={formData[col.key] ?? ''}
                                     onChange={e => handleFieldChange(e.target.value)}
                                     rows={3}
                                     style={{
                                       width: '100%',
                                       padding: '8px 10px',
                                       border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                       borderRadius: '4px',
                                       fontSize: '13px',
                                       resize: 'vertical'
                                     }}
                                   />
                                   {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                 </div>
                               ) : (col.autoCalc || ['kms', 'totalkms', 'kmpl', 'avgkmpl'].includes(col.key)) ? (
                                <div>
                                  <input
                                    type="text"
                                    readOnly
                                    className={isInvalid ? 'is-invalid' : ''}
                                    placeholder="Auto-calculated"
                                    value={formData[col.key] ?? ''}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px',
                                      backgroundColor: '#f1f5f9',
                                      color: '#1e293b',
                                      cursor: 'default',
                                      fontWeight: 600
                                    }}
                                  />
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
                              ) : (
                                <div>
                                  <input
                                    type="text"
                                    className={isInvalid ? 'is-invalid' : ''}
                                    placeholder={`Enter ${col.label.toLowerCase()}...`}
                                    value={formData[col.key] ?? ''}
                                    onChange={e => handleFieldChange(e.target.value)}
                                    style={{
                                      width: '100%',
                                      padding: '8px 10px',
                                      border: isInvalid ? '1px solid #dc3545' : '1px solid #cbd5e1',
                                      borderRadius: '4px',
                                      fontSize: '13px'
                                    }}
                                  />
                                  {isInvalid && <div className="invalid-feedback">{formErrors[col.key]}</div>}
                                </div>
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
                        {isVehicleInfo ? 'Close' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="admin-modal-btn-submit"
                        disabled={submitting}
                      >
                        {submitting ? 'Saving...' : (isVehicleInfo ? 'Save' : (editingId ? 'Update Record' : 'Save Record'))}
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
