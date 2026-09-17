import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDashboardOverview,
  getAdminData,
  createStage,
  deleteAdminItem,
  getStageFormOptions,
  getStaffData,
  getVehiclesData,
  getCertificatesData,
  getFuelsData,
  getAdBlueData,
  getServicesData,
  getRepairBillsData,
  getBusBreakdownData,
  getBatteriesData,
  getVehicleTyresData,
} from '../services/api';

const SIDEBAR_MODULE_CONFIG = {
  Staff: {
    title: 'Staff Directory',
    subTabs: [
      { id: 'bus', label: 'Bus Staff' },
      { id: 'office', label: 'Office Staff' },
      { id: 'cleaner', label: 'Bus Cleaners' },
      { id: 'designations', label: 'Designations' },
    ],
    apiFn: (subTab, branch) => getStaffData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'office') {
        return [
          { key: 'staffname', label: 'Staff Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'aadharno', label: 'Aadhar No' },
          { key: 'dateofjoin', label: 'Date of Join' },
        ];
      }
      if (subTab === 'designations') {
        return [
          { key: 'name', label: 'Designation Name' },
          { key: 'description', label: 'Description' },
        ];
      }
      return [
        { key: 'staffname', label: 'Staff Name' },
        { key: 'designation', label: 'Designation' },
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'mobile', label: 'Mobile' },
        { key: 'licienseno', label: 'License No' },
        { key: 'valid', label: 'License Validity' },
        { key: 'vehicleno', label: 'Vehicle No' },
        { key: 'salary', label: 'Salary' },
      ];
    }
  },
  Vehicles: {
    title: 'Vehicles Management',
    subTabs: [
      { id: 'branch', label: 'Branch Vehicles' },
      { id: 'info', label: 'Vehicle Info' },
      { id: 'accidents', label: 'Accidents' },
      { id: 'makes', label: 'Vehicle Makes' },
    ],
    apiFn: (subTab, branch) => getVehiclesData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'info') {
        return [
          { key: 'regno', label: 'Vehicle Reg.No' },
          { key: 'make', label: 'Make' },
          { key: 'model', label: 'Model' },
          { key: 'capacity', label: 'Seating Capacity' },
          { key: 'fuel', label: 'Fuel Type' },
          { key: 'fueltank', label: 'Fuel Tank (L)' },
          { key: 'ekmpl', label: 'Expected KMPL' },
          { key: 'servicemilaege', label: 'Service Mileage' },
        ];
      }
      if (subTab === 'accidents') {
        return [
          { key: 'vehicleregno', label: 'Vehicle Reg.No' },
          { key: 'branch', label: 'Branch' },
          { key: 'accidentdate', label: 'Date' },
          { key: 'drivername', label: 'Driver' },
          { key: 'place', label: 'Place' },
          { key: 'damage', label: 'Damage Details' },
          { key: 'claimamount', label: 'Claim Amount' },
        ];
      }
      if (subTab === 'makes') {
        return [
          { key: 'name', label: 'Make Name' },
          { key: 'models', label: 'Available Models' },
        ];
      }
      return [
        { key: 'vehicleregno', label: 'Vehicle Reg.No' },
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'model', label: 'Model' },
        { key: 'staffname', label: 'Driver / Staff' },
        { key: 'purchasedate', label: 'Purchase Date' },
        { key: 'servicedate', label: 'Service Date' },
      ];
    }
  },
  Certificates: {
    title: 'Certificates & Compliance',
    subTabs: [
      { id: 'pollution', label: 'Pollution' },
      { id: 'fitness', label: 'Fitness' },
      { id: 'insurance', label: 'Insurance' },
      { id: 'roadtax', label: 'Road Tax' },
      { id: 'roadpermit', label: 'Road Permit' },
      { id: 'rta', label: 'RTA' },
    ],
    apiFn: (subTab, branch) => getCertificatesData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'insurance') {
        return [
          { key: 'regno', label: 'Vehicle Reg.No' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'company', label: 'Insurance Company' },
          { key: 'policy', label: 'Policy No' },
          { key: 'sdate', label: 'Start Date' },
          { key: 'edate', label: 'Expiry Date' },
          { key: 'amount', label: 'Premium Amount' },
          { key: 'status', label: 'Status' },
        ];
      }
      return [
        { key: 'regno', label: 'Vehicle Reg.No' },
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'model', label: 'Model' },
        { key: 'certificate', label: 'Certificate No' },
        { key: 'issueddate', label: 'Issued Date' },
        { key: 'valid', label: 'Valid Till' },
        { key: 'status', label: 'Status' },
      ];
    }
  },
  Fuels: {
    title: 'Fuel Management',
    subTabs: [
      { id: 'busfill', label: 'Bus Fillings' },
      { id: 'fuelfill', label: 'Fuel Fillings' },
      { id: 'fuelbunk', label: 'Fuel Bunks' },
    ],
    apiFn: (subTab, branch) => getFuelsData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'fuelfill') {
        return [
          { key: 'bunkname', label: 'Bunk Name' },
          { key: 'bunksupplier', label: 'Supplier' },
          { key: 'billno', label: 'Bill No' },
          { key: 'filldate', label: 'Date' },
          { key: 'tankerno', label: 'Tanker No' },
          { key: 'quantity', label: 'Quantity (Ltrs)' },
          { key: 'rate', label: 'Rate (₹)' },
          { key: 'trate', label: 'Total (₹)' },
        ];
      }
      return [
        { key: 'regno', label: 'Vehicle Reg.No' },
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'drivername', label: 'Driver' },
        { key: 'fuelsupplier', label: 'Supplier' },
        { key: 'fquantity', label: 'Quantity (Ltrs)' },
        { key: 'frate', label: 'Rate (₹)' },
        { key: 'total', label: 'Total (₹)' },
        { key: 'kms', label: 'KMS' },
        { key: 'avgkmpl', label: 'Avg KMPL' },
        { key: 'grade', label: 'Grade' },
      ];
    }
  },
  'Ad-Blue': {
    title: 'Ad-Blue Management',
    subTabs: [
      { id: 'AdBlueBusfill', label: 'Bus Fillings' },
      { id: 'AdBlueBunk', label: 'Ad-Blue Bunks' },
      { id: 'AdBlue', label: 'Ad-Blue Brands' },
    ],
    apiFn: (subTab, branch) => getAdBlueData(subTab, branch),
    columns: () => [
      { key: 'regno', label: 'Vehicle Reg.No' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'model', label: 'Model' },
      { key: 'drivername', label: 'Driver' },
      { key: 'date', label: 'Date' },
      { key: 'filled_Qty', label: 'Filled Qty' },
      { key: 'token_no', label: 'Token No' },
    ]
  },
  Services: {
    title: 'Services & Maintenance',
    subTabs: [
      { id: 'service', label: 'Vehicle Services' },
      { id: 'repair', label: 'Repairs' },
    ],
    apiFn: (subTab, branch) => getServicesData(subTab, branch),
    columns: () => [
      { key: 'vehicleno', label: 'Vehicle No' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'model', label: 'Model' },
      { key: 'date', label: 'Service Date' },
      { key: 'serviceparts', label: 'Parts & Oils' },
      { key: 'duration', label: 'Duration' },
      { key: 'kms', label: 'KMS' },
      { key: 'remarks', label: 'Remarks' },
    ]
  },
  'Repair Bills': {
    title: 'Repair Bills',
    subTabs: [
      { id: 'repairbills', label: 'All Repair Bills' }
    ],
    apiFn: (subTab, branch) => getRepairBillsData(branch),
    columns: () => [
      { key: 'busnumber', label: 'Bus Number' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'repairtype', label: 'Repair Type' },
      { key: 'vendorname', label: 'Vendor / Workshop' },
      { key: 'amount', label: 'Amount (₹)' },
      { key: 'vouchernumber', label: 'Voucher No' },
      { key: 'repairdate', label: 'Repair Date' },
      { key: 'description', label: 'Description' },
    ]
  },
  'Bus Breakdown': {
    title: 'Bus Breakdown Logs',
    subTabs: [
      { id: 'breakdown', label: 'Breakdown Logs' }
    ],
    apiFn: (subTab, branch) => getBusBreakdownData(branch),
    columns: () => [
      { key: 'busno', label: 'Bus No' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'breakedownplace', label: 'Breakdown Place' },
      { key: 'complaint', label: 'Complaint / Fault' },
      { key: 'drivername', label: 'Driver' },
      { key: 'driverphoneno', label: 'Phone' },
      { key: 'totalamount', label: 'Amount (₹)' },
      { key: 'status', label: 'Status' },
    ]
  },
  Batteries: {
    title: 'Battery Management',
    subTabs: [
      { id: 'vehiclewise', label: 'Vehicle Batteries' },
      { id: 'reports', label: 'Change Reports' },
    ],
    apiFn: (subTab, branch) => getBatteriesData(subTab, branch),
    columns: () => [
      { key: 'vehicleregno', label: 'Vehicle Reg.No' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'battery_make', label: 'Battery Make' },
      { key: 'battery_capacity', label: 'Capacity' },
      { key: 'battery_number', label: 'Serial No' },
      { key: 'fitment_date', label: 'Fitment Date' },
      { key: 'warranty', label: 'Warranty' },
      { key: 'status', label: 'Status' },
    ]
  },
  'Vehicle Tyres': {
    title: 'Tyre Management',
    subTabs: [
      { id: 'tyres', label: 'Tyres Inventory' },
      { id: 'status', label: 'Tyre Status' },
    ],
    apiFn: (subTab, branch) => getVehicleTyresData(subTab, branch),
    columns: () => [
      { key: 'vehicleregno', label: 'Vehicle Reg.No' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'tyremake', label: 'Brand / Make' },
      { key: 'tyreno', label: 'Tyre Serial No' },
      { key: 'position', label: 'Wheel Position' },
      { key: 'sizeoftyre', label: 'Tyre Size' },
      { key: 'serviceno', label: 'Service No' },
    ]
  }
};

const Dashboard = () => {

  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [selectedBranch, setSelectedBranch] = useState('ALL');
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Table search and pagination (Dashboard overview)
  const [searchQuery, setSearchQuery] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Admin Page States
  const [adminSubTab, setAdminSubTab] = useState('Stages');
  const [adminData, setAdminData] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');
  const [adminEntriesPerPage, setAdminEntriesPerPage] = useState(10);
  const [adminCurrentPage, setAdminCurrentPage] = useState(1);
  const [adminCopiedNotification, setAdminCopiedNotification] = useState(false);
  const [showNewStageModal, setShowNewStageModal] = useState(false);
  const [stageFormData, setStageFormData] = useState({
    society: 'ADITYA ACADEMY',
    branch: '',
    regno: '',
    sequenceno: '',
    name: '',
    amount: '',
    students: ''
  });
  const [stageSubmitting, setStageSubmitting] = useState(false);
  const [stageSuccessToast, setStageSuccessToast] = useState('');
  const [societiesList, setSocietiesList] = useState([]);
  const [formBranchesList, setFormBranchesList] = useState([]);

  // In-memory data caches to prevent redundant server calls on tab switching
  const overviewCacheRef = useRef({});
  const adminCacheRef = useRef({});
  const moduleCacheRef = useRef({});
  const stageOptionsCacheRef = useRef(null);

  // Dynamic Sidebar Module States (Staff, Vehicles, Certificates, Fuels, etc.)
  const [moduleSubTab, setModuleSubTab] = useState('');
  const [moduleData, setModuleData] = useState([]);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');
  const [moduleEntriesPerPage, setModuleEntriesPerPage] = useState(10);
  const [moduleCurrentPage, setModuleCurrentPage] = useState(1);
  const [moduleCopiedNotification, setModuleCopiedNotification] = useState(false);

  // Mobile toggle
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);


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
          setStageFormData(prev => ({ ...prev, branch: parsed.branch }));
        }
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }

    if (window.location.hash.includes('admin') || window.location.pathname.includes('admin')) {
      setActiveTab('Admin');
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

  // Fetch admin data on tab change or branch change with in-memory caching
  const fetchAdminData = async (subTab, branch, forceRefresh = false) => {
    const cacheKey = `${subTab}_${branch || 'ALL'}`;
    if (!forceRefresh && adminCacheRef.current[cacheKey]) {
      setAdminData(adminCacheRef.current[cacheKey]);
      setAdminCurrentPage(1);
      setAdminLoading(false);
      return;
    }

    setAdminLoading(true);
    try {
      const typeKey = subTab === 'Stages' ? 'stages'
        : subTab === 'Routes' ? 'routes'
          : subTab === 'Route_Details' ? 'route_details'
            : 'transfers';
      const res = await getAdminData(typeKey, branch, user?.username);
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
    if (activeTab === 'Admin') {
      fetchAdminData(adminSubTab, selectedBranch);
    }
  }, [activeTab, adminSubTab, selectedBranch, user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const loadStageFormOptions = async (forceRefresh = false) => {
    if (!forceRefresh && stageOptionsCacheRef.current) {
      const cached = stageOptionsCacheRef.current;
      if (cached.societies) setSocietiesList(cached.societies);
      if (cached.branches) setFormBranchesList(cached.branches);
      return;
    }
    try {
      const data = await getStageFormOptions(user?.username);
      if (data) {
        stageOptionsCacheRef.current = data;
        if (data.societies && data.societies.length > 0) {
          setSocietiesList(data.societies);
        }
        if (data.branches && data.branches.length > 0) {
          setFormBranchesList(data.branches);
        }
      }
    } catch (err) {
      console.error('Error loading stage form options:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'Admin' || showNewStageModal) {
      loadStageFormOptions();
    }
  }, [activeTab, showNewStageModal, user]);

  const branchesList = formBranchesList.length > 0
    ? formBranchesList
    : (user?.branches && user.branches.length > 0
      ? user.branches
      : (user?.branch ? [user.branch] : []));

  // Content data from backend matching reference image
  const certAlerts = dashboardData?.certificateAlerts || { rta: 0, pollution: 2, fitness: 0, roadTax: 0, roadPermit: 0, insurance: 7 };
  const kmpl = dashboardData?.kmplPerformance || { aGrade: 0, bGrade: 0, cGrade: 0, dGrade: 0 };
  const exceededTrips = dashboardData?.exceededTrips || 30;
  const adminSummary = dashboardData?.adminSummary || { handOvers: '72/168', issues: '18/168', transfers: 188 };
  const staffSummary = dashboardData?.staffSummary || { officeStaff: 36, busStaff: 526 };
  const fuelsSummary = dashboardData?.fuelsSummary || { busFillings: 0 };
  const vehiclesSummary = dashboardData?.vehiclesSummary || { branchVehicleInfo: 686, vehicleAccidents: 78 };

  // Services table filtering and pagination (Dashboard Overview)
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
    const headers = ['Society', 'Branch', 'Model', 'Vehicle No.', 'Date', 'Servicing Parts & Oils', 'Periodical Duration', 'Last Servicing Reading', 'Present Servicing Reading', 'KMS', 'Remainder Reading', 'Remarks'];
    const rows = filteredServices.map(s => [
      s.society, s.branch, s.model, s.vehicleno, s.date, s.parts, s.duration, s.lastreading, s.presentreading, s.kms, s.remainder, s.remarks || ''
    ]);
    const tsv = [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n');
    navigator.clipboard.writeText(tsv);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleExportCSV = () => {
    const headers = ['Society', 'Branch', 'Model', 'Vehicle No.', 'Date', 'Servicing Parts & Oils', 'Periodical Duration', 'Last Servicing Reading', 'Present Servicing Reading', 'KMS', 'Remainder Reading', 'Remarks'];
    const rows = filteredServices.map(s => [
      `"${s.society || ''}"`, `"${s.branch || ''}"`, `"${s.model || ''}"`, `"${s.vehicleno || ''}"`, `"${s.date || ''}"`, `"${s.parts || ''}"`, `"${s.duration || ''}"`, `"${s.lastreading || ''}"`, `"${s.presentreading || ''}"`, `"${s.kms || ''}"`, `"${s.remainder || ''}"`, `"${s.remarks || ''}"`
    ]);
    const csvString = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvString));
    link.setAttribute('download', 'Vehicle_Services.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  // Admin Data Filtering & Pagination
  const filteredAdminData = useMemo(() => {
    if (!adminSearchQuery.trim()) return adminData;
    const q = adminSearchQuery.toLowerCase();
    return adminData.filter(item =>
      Object.entries(item).some(([k, val]) =>
        k !== 'id' && val && String(val).toLowerCase().includes(q)
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
    const keys = Object.keys(sample).filter(k => k !== 'id');
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
    const keys = Object.keys(sample).filter(k => k !== 'id');
    const headerRow = keys.join(',');
    const dataRows = filteredAdminData.map(row =>
      keys.map(k => `"${String(row[k] ?? '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headerRow, ...dataRows].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `${adminSubTab}_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintAdminTable = () => {
    window.print();
  };

  const handleCreateStage = async (e) => {
    e.preventDefault();
    if (!stageFormData.branch) {
      alert('Please select a Branch');
      return;
    }
    if (!stageFormData.name.trim()) {
      alert('Please enter a Stage Name');
      return;
    }
    setStageSubmitting(true);
    try {
      await createStage({
        society: stageFormData.society || 'ADITYA ACADEMY',
        branch: stageFormData.branch,
        regno: (stageFormData.regno || '').trim().toUpperCase(),
        sequenceno: (stageFormData.sequenceno || '').trim(),
        name: (stageFormData.name || '').trim(),
        amount: (stageFormData.amount || '0').trim(),
        students: (stageFormData.students || '0').trim()
      });
      setShowNewStageModal(false);
      setStageFormData({
        society: 'ADITYA ACADEMY',
        branch: selectedBranch !== 'ALL' && selectedBranch !== 'College' ? selectedBranch : (branchesList[0] || ''),
        regno: '',
        sequenceno: '',
        name: '',
        amount: '',
        students: ''
      });
      setStageSuccessToast('Stage saved successfully!');
      setTimeout(() => setStageSuccessToast(''), 3000);
      adminCacheRef.current = {};
      fetchAdminData(adminSubTab, selectedBranch, true);
    } catch (err) {
      console.error('Failed to create stage:', err);
      alert('Error creating stage: ' + (err.response?.data?.message || err.message));
    } finally {
      setStageSubmitting(false);
    }
  };

  const handleDeleteAdminRecord = async (id) => {
    if (!window.confirm('Are you sure you want to remove this record?')) return;
    try {
      const typeKey = adminSubTab === 'Stages' ? 'stages'
        : adminSubTab === 'Routes' ? 'routes'
          : adminSubTab === 'Route_Details' ? 'route_details'
            : 'transfers';
      await deleteAdminItem(typeKey, id);
      adminCacheRef.current = {};
      fetchAdminData(adminSubTab, selectedBranch, true);
    } catch (err) {
      console.error('Error deleting record:', err);
      alert('Error deleting record.');
    }
  };

  // Dynamic module fetching with in-memory caching
  const fetchModuleData = async (tabName, subTab, branch, forceRefresh = false) => {
    const config = SIDEBAR_MODULE_CONFIG[tabName];
    if (!config) return;
    const activeSub = subTab || config.subTabs[0].id;
    const cacheKey = `${tabName}_${activeSub}_${branch || 'ALL'}`;

    if (!forceRefresh && moduleCacheRef.current[cacheKey]) {
      setModuleData(moduleCacheRef.current[cacheKey]);
      setModuleCurrentPage(1);
      setModuleLoading(false);
      return;
    }

    setModuleLoading(true);
    try {
      const res = await config.apiFn(activeSub, branch);
      const data = res?.data || [];
      moduleCacheRef.current[cacheKey] = data;
      setModuleData(data);
      setModuleCurrentPage(1);
    } catch (err) {
      console.error(`Error fetching ${tabName} data:`, err);
      setModuleData([]);
    } finally {
      setModuleLoading(false);
    }
  };

  useEffect(() => {
    if (SIDEBAR_MODULE_CONFIG[activeTab]) {
      const config = SIDEBAR_MODULE_CONFIG[activeTab];
      const validSub = config.subTabs.some(s => s.id === moduleSubTab)
        ? moduleSubTab
        : config.subTabs[0].id;
      if (validSub !== moduleSubTab) {
        setModuleSubTab(validSub);
      }
      fetchModuleData(activeTab, validSub, selectedBranch);
    }
  }, [activeTab, moduleSubTab, selectedBranch]);

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
    link.setAttribute('download', `${activeTab}_${moduleSubTab}_Data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintModuleTable = () => {
    window.print();
  };

  // Menu items from reference image

  const referenceMenuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: 'speedometer' },
    { id: 'Admin', label: 'Admin', icon: 'user' },
    { id: 'Staff', label: 'Staff', icon: 'users' },
    { id: 'Vehicles', label: 'Vehicles', icon: 'bus' },
    { id: 'Certificates', label: 'Certificates', icon: 'file' },
    { id: 'Fuels', label: 'Fuels', icon: 'fuel' },
    { id: 'Ad-Blue', label: 'Ad-Blue', icon: 'droplet' },
    { id: 'Services', label: 'Services', icon: 'gear' },
    { id: 'Repair Bills', label: 'Repair Bills', icon: 'wrench' },
    { id: 'Bus Breakdown', label: 'Bus Breakdown', icon: 'alert' },
    { id: 'Batteries', label: 'Batteries', icon: 'battery' },
    { id: 'Vehicle Tyres', label: 'Vehicle Tyres', icon: 'disc' },
  ];


  const renderSidebarModuleView = () => {
    const currentConfig = SIDEBAR_MODULE_CONFIG[activeTab];
    if (!currentConfig) return null;
    const activeSub = moduleSubTab || currentConfig.subTabs[0].id;
    const activeCols = typeof currentConfig.columns === 'function'
      ? currentConfig.columns(activeSub)
      : currentConfig.columns;

    return (
      <div className="admin-page-container">
        {/* Subtabs Ribbon */}
        {currentConfig.subTabs.length > 1 && (
          <div className="admin-subtabs-ribbon">
            <button
              type="button"
              className="admin-ribbon-arrow"
              title="Previous Tab"
              onClick={() => {
                const tabs = currentConfig.subTabs;
                const idx = tabs.findIndex(s => s.id === activeSub);
                setModuleSubTab(tabs[(idx - 1 + tabs.length) % tabs.length].id);
              }}
            >
              ◀
            </button>
            <div className="admin-ribbon-tabs">
              {currentConfig.subTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`admin-ribbon-tab ${activeSub === tab.id ? 'active' : ''}`}
                  onClick={() => setModuleSubTab(tab.id)}
                >
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="admin-ribbon-arrow"
              title="Next Tab"
              onClick={() => {
                const tabs = currentConfig.subTabs;
                const idx = tabs.findIndex(s => s.id === activeSub);
                setModuleSubTab(tabs[(idx + 1) % tabs.length].id);
              }}
            >
              ▶
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="admin-actions-bar">
          <button
            type="button"
            className="admin-action-btn"
            disabled={moduleLoading}
            onClick={() => fetchModuleData(activeTab, activeSub, selectedBranch, true)}
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
          <span style={{ fontSize: '13px', color: '#94a3b8', marginLeft: '6px' }}>
            Showing {paginatedModuleData.length} of {filteredModuleData.length} records
          </span>
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
                </tr>
              </thead>
              <tbody>
                {moduleLoading ? (
                  <tr>
                    <td colSpan={activeCols.length + 1} className="empty-cell">
                      Loading {currentConfig.title} records...
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
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={activeCols.length + 1} className="empty-cell">
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
      </div>
    );
  };

  return (
    <div className="vms-dashboard-container">
      {/* Mobile Top Bar */}
      <div className="mobile-nav-bar">
        <button className="mobile-toggle-btn" onClick={() => setMobileLeftOpen(!mobileLeftOpen)}>
          <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="mobile-logo">
          <span className="brand-dot"></span>
          <strong>ADITYA VMS</strong>
        </div>
      </div>


      <div className="dashboard-grid-layout">
        {/* ================= LEFT SIDEBAR (LIGHT MODE & INTERACTIVE) ================= */}
        <aside className={`sidebar-left ${mobileLeftOpen ? 'open' : ''}`}>
          {/* Top Blue Profile Header (Yellow Bus Logo + Brand Name + System Subtitle) */}
          <div className="sidebar-brand">
            <div className="bus-logo-badge">
              <img
                src="/yellow_bus_logo.png"
                alt="Vehicle Bus Logo"
                className="bus-logo-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.parentNode) {
                    e.target.parentNode.innerHTML = `<svg width="26" height="26" fill="none" viewBox="0 0 24 24" stroke="#fef08a" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7h8m-8 4h8m-9 8h10M5 3h14a2 2 0 012 2v11a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z"/></svg>`;
                  }
                }}
              />
            </div>
            <div className="brand-text-wrapper">
              <span className="brand-title" title="ADITYA DEGREE COLLEGE">
                ADITYA DEGREE COLLEGE
              </span>
              <span className="system-subtitle-tag">Vehicle Management System</span>
            </div>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-heading">MAIN MENU</span>
            <nav className="nav-menu">
              {referenceMenuItems.map(item => (
                <button
                  key={item.id}
                  className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => { setActiveTab(item.id); setMobileLeftOpen(false); }}
                >
                  <span className="nav-icon-wrapper">
                    {item.icon === 'speedometer' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {item.icon === 'user' && (
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.icon === 'users' && (
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                    )}
                    {item.icon === 'bus' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                      </svg>
                    )}
                    {item.icon === 'file' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    {item.icon === 'fuel' && (
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 11h-1V5c0-1.1-.9-2-2-2H8C6.9 3 6 3.9 6 5v16h10v-6h1v4c0 1.1.9 2 2 2s2-.9 2-2v-6c0-1.1-.9-2-2-2zm-5 4H8V5h6v10z" />
                      </svg>
                    )}
                    {item.icon === 'droplet' && (
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 01.832.445l4.5 7A1 1 0 0114.5 11h-9a1 1 0 01-.832-1.555l4.5-7A1 1 0 0110 2z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.icon === 'gear' && (
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.icon === 'wrench' && (
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12-5.472a7.5 7.5 0 0010.63 0l.37.37a8.25 8.25 0 11-11.37 0l.37-.37z" clipRule="evenodd" />
                      </svg>
                    )}
                    {item.icon === 'alert' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {item.icon === 'battery' && (
                      <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17 5v16c0 .55-.45 1-1 1H8c-.55 0-1-.45-1-1V5c0-.55.45-1 1-1h2V2h4v2h2c.55 0 1 .45 1 1z" />
                      </svg>
                    )}
                    {item.icon === 'disc' && (
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <circle cx="12" cy="12" r="9" strokeWidth="2" />
                        <circle cx="12" cy="12" r="3" strokeWidth="2" />
                      </svg>
                    )}
                  </span>
                  <span>{item.label}</span>
                  {item.id === 'Staff' && <span className="nav-count">{staffSummary.busStaff}</span>}
                  {item.id === 'Vehicles' && <span className="nav-count">{vehiclesSummary.branchVehicleInfo}</span>}
                </button>
              ))}
            </nav>
          </div>

          <div className="sidebar-footer">
            <button className="sidebar-logout-btn" onClick={handleLogout} title="Sign Out">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          </div>
        </aside>

        {/* ================= MAIN DASHBOARD CENTER ================= */}
        <main className="dashboard-main-content">
          {activeTab === 'Admin' ? (
            /* ADMIN VIEW AS PER REFERENCE IMAGE */
            <div className="admin-page-container">
              {/* Subtabs Ribbon: [ ◀ ] [ Stages ] [ Routes ] [ Route_Details ] [ Transfers ] [ ▶ ] */}
              <div className="admin-subtabs-ribbon">
                <button
                  type="button"
                  className="admin-ribbon-arrow"
                  title="Previous Tab"
                  onClick={() => {
                    const tabs = ['Stages', 'Routes', 'Route_Details', 'Transfers'];
                    const idx = tabs.indexOf(adminSubTab);
                    setAdminSubTab(tabs[(idx - 1 + tabs.length) % tabs.length]);
                  }}
                >
                  ◀
                </button>
                <div className="admin-ribbon-tabs">
                  {[
                    { id: 'Stages', label: 'Stages' },
                    { id: 'Routes', label: 'Routes' },
                    { id: 'Route_Details', label: 'Route Details' },
                    { id: 'Transfers', label: 'Transfers' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={`admin-ribbon-tab ${adminSubTab === tab.id ? 'active' : ''}`}
                      onClick={() => setAdminSubTab(tab.id)}
                    >
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  className="admin-ribbon-arrow"
                  title="Next Tab"
                  onClick={() => {
                    const tabs = ['Stages', 'Routes', 'Route_Details', 'Transfers'];
                    const idx = tabs.indexOf(adminSubTab);
                    setAdminSubTab(tabs[(idx + 1) % tabs.length]);
                  }}
                >
                  ▶
                </button>
              </div>

              {/* Action Buttons: [ View Data ] [ New Stage ] */}
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
                    loadStageFormOptions();
                    setStageFormData(prev => ({
                      ...prev,
                      society: prev.society || (societiesList[0] || 'ADITYA ACADEMY'),
                      branch: prev.branch || (selectedBranch !== 'ALL' && selectedBranch !== 'College' ? selectedBranch : (branchesList[0] || ''))
                    }));
                    setShowNewStageModal(true);
                  }}
                >
                  New {adminSubTab === 'Stages' ? 'Stage' : adminSubTab === 'Routes' ? 'Route' : adminSubTab === 'Transfers' ? 'Transfer' : 'Detail'}
                </button>
                {stageSuccessToast && (
                  <span style={{ color: '#10b981', fontSize: '13px', fontWeight: '600', marginLeft: '10px' }}>
                    ✓ {stageSuccessToast}
                  </span>
                )}
                {branchesList.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Branch:</span>
                    <select
                      value={selectedBranch}
                      onChange={(e) => {
                        const newBranch = e.target.value;
                        setSelectedBranch(newBranch);
                        fetchAdminData(adminSubTab, newBranch);
                      }}
                      style={{
                        background: '#141721',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f8fafc',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Authorized Branches ({branchesList.length})</option>
                      {branchesList.map((b, i) => (
                        <option key={i} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Data Table Card matching reference image */}
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
                      {adminSubTab === 'Stages' && (
                        <tr>
                          <th className="sortable">▴ S.No</th>
                          <th>Society</th>
                          <th>Branch</th>
                          <th>Vehicle Reg.No</th>
                          <th>Stage Name</th>
                          <th>Stages Sequence NO</th>
                          <th>Amount</th>
                          <th>No'of Students</th>
                          <th>Edit</th>
                          <th>Remove</th>
                        </tr>
                      )}
                      {adminSubTab === 'Routes' && (
                        <tr>
                          <th className="sortable">▴ S.No</th>
                          <th>Society</th>
                          <th>Branch</th>
                          <th>Route Name</th>
                          <th>Distance</th>
                          <th>Vehicle Reg.No</th>
                          <th>Edit</th>
                          <th>Remove</th>
                        </tr>
                      )}
                      {adminSubTab === 'Route_Details' && (
                        <tr>
                          <th className="sortable">▴ S.No</th>
                          <th>Society</th>
                          <th>Branch</th>
                          <th>Route Name</th>
                          <th>Start Point</th>
                          <th>Distance</th>
                          <th>Vehicle Reg.No</th>
                          <th>Start Time</th>
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
                            <td>{row.society || '-'}</td>
                            <td>{row.branch || '-'}</td>
                            {adminSubTab === 'Stages' && (
                              <>
                                <td><strong>{row.regno || '-'}</strong></td>
                                <td>{row.name || '-'}</td>
                                <td>{row.sequenceno || '-'}</td>
                                <td>{row.amount || '0'}</td>
                                <td>{row.students || '0'}</td>
                              </>
                            )}
                            {adminSubTab === 'Routes' && (
                              <>
                                <td><strong>{row.routename || '-'}</strong></td>
                                <td>{row.distance || '0'}</td>
                                <td>{row.routeregno || '-'}</td>
                              </>
                            )}
                            {adminSubTab === 'Route_Details' && (
                              <>
                                <td><strong>{row.routename || '-'}</strong></td>
                                <td>{row.startpoint || '-'}</td>
                                <td>{row.distance || '0'}</td>
                                <td>{row.regno || '-'}</td>
                                <td>{row.starttime || '-'}</td>
                              </>
                            )}
                            {adminSubTab === 'Transfers' && (
                              <>
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
                                  if (adminSubTab === 'Stages') {
                                    setStageFormData({
                                      society: row.society || 'ADITYA ACADEMY',
                                      branch: row.branch || '',
                                      regno: row.regno || '',
                                      name: row.name || '',
                                      sequenceno: row.sequenceno || '1',
                                      amount: row.amount || '6000',
                                      students: row.students || '1'
                                    });
                                    setShowNewStageModal(true);
                                  }
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
                          <td colSpan="10" className="empty-cell">
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

              {/* Stage's Data Modal Popup matching reference */}
              {showNewStageModal && (
                <div className="admin-modal-backdrop" onClick={() => setShowNewStageModal(false)}>
                  <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
                    <div className="admin-modal-header">
                      <h3>Add New Stage</h3>
                      <button type="button" className="admin-modal-close-btn" onClick={() => setShowNewStageModal(false)}>×</button>
                    </div>
                    <form onSubmit={handleCreateStage}>
                      <div className="stage-modal-body">
                        <div className="stage-form-stack">
                          <div className="stage-form-group">
                            <label>Society</label>
                            <select
                              required
                              value={stageFormData.society}
                              onChange={(e) => setStageFormData({ ...stageFormData, society: e.target.value })}
                            >
                              {societiesList.length > 0 ? (
                                societiesList.map((s, i) => (
                                  <option key={i} value={s}>{s}</option>
                                ))
                              ) : (
                                <>
                                  <option value="ADITYA ACADEMY">ADITYA ACADEMY</option>
                                  <option value="SAROJINI EDUCATIONAL SOCIETY">SAROJINI EDUCATIONAL SOCIETY</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="stage-form-group">
                            <label>Branch :</label>
                            <select
                              required
                              value={stageFormData.branch}
                              onChange={(e) => setStageFormData({ ...stageFormData, branch: e.target.value })}
                            >
                              <option value="">Select Branch</option>
                              {branchesList.map((b, i) => (
                                <option key={i} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>

                          <div className="stage-form-group">
                            <label>Registration No :</label>
                            <input
                              type="text"
                              value={stageFormData.regno}
                              onChange={(e) => setStageFormData({ ...stageFormData, regno: e.target.value.toUpperCase() })}
                            />
                          </div>

                          <div className="stage-form-group">
                            <label>Stages Sequence NO :</label>
                            <input
                              type="text"
                              value={stageFormData.sequenceno}
                              onChange={(e) => setStageFormData({ ...stageFormData, sequenceno: e.target.value })}
                            />
                          </div>

                          <div className="stage-form-group">
                            <label>Stage Name :</label>
                            <input
                              type="text"
                              required
                              value={stageFormData.name}
                              onChange={(e) => setStageFormData({ ...stageFormData, name: e.target.value })}
                            />
                          </div>

                          <div className="stage-form-group">
                            <label>Amount :</label>
                            <input
                              type="text"
                              value={stageFormData.amount}
                              onChange={(e) => setStageFormData({ ...stageFormData, amount: e.target.value })}
                            />
                          </div>

                          <div className="stage-form-group">
                            <label>No'of Students :</label>
                            <input
                              type="text"
                              value={stageFormData.students}
                              onChange={(e) => setStageFormData({ ...stageFormData, students: e.target.value })}
                            />
                          </div>

                          <div className="stage-modal-actions">
                            <button
                              type="submit"
                              className="stage-modal-btn-save"
                              disabled={stageSubmitting}
                            >
                              {stageSubmitting ? 'saving...' : 'save'}
                            </button>
                            <button
                              type="button"
                              className="stage-modal-btn-close"
                              onClick={() => setShowNewStageModal(false)}
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          ) : SIDEBAR_MODULE_CONFIG[activeTab] ? (
            renderSidebarModuleView()
          ) : (
            /* DASHBOARD OVERVIEW CONTENT */
            <>
              <header className="dashboard-topbar">

                <div className="topbar-search-box">
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search services, vehicle no, branch..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                {branchesList.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Branch:</span>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      style={{
                        background: '#141721',
                        border: '1px solid rgba(255,255,255,0.1)',
                        color: '#f8fafc',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '0.82rem',
                        outline: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="ALL">All Authorized Branches ({branchesList.length})</option>
                      {branchesList.map((b, i) => (
                        <option key={i} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                )}
              </header>


              {/* Welcome Banner Card */}
              <section className="welcome-banner-card">
                <div className="welcome-left">
                  <h1>Welcome, {user?.name || user?.username || 'Fleet Administrator'}</h1>
                  <p>
                    Active Branch: <strong className="highlight-tag">{selectedBranch === 'ALL' ? 'All Aditya Branches' : selectedBranch}</strong>
                    {' '}• Vehicle Management System Matrix
                  </p>
                </div>
                <div className="welcome-right">
                  <div className="quick-meta-pill">
                    <span>Role:</span>
                    <span className="badge-purple">{user?.role || 'BRANCH_ADMIN'}</span>
                  </div>
                </div>
              </section>

              {/* CONTENT PART 1: Certificate(Alerts) - 6 Metrics Grid */}
              <section className="content-card-panel full-width">
                <div className="panel-header">
                  <div>
                    <h3>Certificate(Alerts)</h3>
                    <p className="panel-sub">RTA inspections and vehicle compliance alerts</p>
                  </div>
                </div>
                <div className="metrics-grid-6">
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.rta}</div>
                    <div className="metric-stat-label">RTA</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.pollution}</div>
                    <div className="metric-stat-label">Pollution</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.fitness}</div>
                    <div className="metric-stat-label">Fitness</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.roadTax}</div>
                    <div className="metric-stat-label">Road Tax</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.roadPermit}</div>
                    <div className="metric-stat-label">Road Permit</div>
                  </div>
                  <div className="metric-stat-item">
                    <div className="metric-stat-number">{certAlerts.insurance}</div>
                    <div className="metric-stat-label">Insurance</div>
                  </div>
                </div>
              </section>

              {/* CONTENT PART 2: KMPL PERFORMANCE & EXCEEDED TRIPS (2 Columns Split) */}
              <section className="dashboard-content-split">
                {/* KMPL PERFORMANCE- Grade Wise */}
                <div className="content-card-panel flex-2">
                  <div className="panel-header">
                    <div>
                      <h3>KMPL PERFORMANCE- Grade Wise</h3>
                      <p className="panel-sub">Fuel economy grade distribution</p>
                    </div>
                  </div>
                  <div className="metrics-grid-4">
                    <div className="metric-stat-item">
                      <div className="metric-stat-number">{kmpl.aGrade}</div>
                      <div className="metric-stat-label">A Grade</div>
                    </div>
                    <div className="metric-stat-item">
                      <div className="metric-stat-number">{kmpl.bGrade}</div>
                      <div className="metric-stat-label">B Grade</div>
                    </div>
                    <div className="metric-stat-item">
                      <div className="metric-stat-number">{kmpl.cGrade}</div>
                      <div className="metric-stat-label">C Grade</div>
                    </div>
                    <div className="metric-stat-item">
                      <div className="metric-stat-number">{kmpl.dGrade}</div>
                      <div className="metric-stat-label">D Grade</div>
                    </div>
                  </div>
                </div>

                {/* Exceeded Vehicle Trips */}
                <div className="content-card-panel flex-1">
                  <div className="panel-header">
                    <div>
                      <h3>Exceeded Vehicle Trips</h3>
                      <p className="panel-sub">Route threshold exceedance</p>
                    </div>
                  </div>
                  <div className="metric-single-center">
                    <div className="metric-stat-number" style={{ fontSize: '2.4rem' }}>{exceededTrips}</div>
                    <div className="metric-stat-label">Exceeded Trips</div>
                  </div>
                </div>
              </section>

              {/* CONTENT PART 3: Category Summary Badges from Left Side of Reference Image */}
              <section className="kpi-cards-grid">
                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-label">ADMIN SUMMARY</span>
                    <span className="badge-purple">Transfers: {adminSummary.transfers}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Hand Overs:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{adminSummary.handOvers}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Issues:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{adminSummary.issues}</strong>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-label">STAFF SUMMARY</span>
                    <span className="badge-purple">Total: {staffSummary.officeStaff + staffSummary.busStaff}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Office Staff:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{staffSummary.officeStaff}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Bus Staff:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{staffSummary.busStaff}</strong>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-label">VEHICLES SUMMARY</span>
                    <span className="badge-purple">Active Fleet</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Branch Vehicle Info:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{vehiclesSummary.branchVehicleInfo}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Vehicle Accidents:</span>
                      <strong style={{ color: '#f87171' }}>{vehiclesSummary.vehicleAccidents}</strong>
                    </div>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-top">
                    <span className="kpi-label">FUELS & LICENSE</span>
                    <span className="badge-purple">Operational</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Bus Fillings:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{fuelsSummary.busFillings}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>License Expired:</span>
                      <strong style={{ color: 'var(--text-primary)' }}>0</strong>
                    </div>
                  </div>
                </div>
              </section>

              {/* CONTENT PART 4: Vehicle Services Data Table (From Reference Image 2) */}
              <section className="content-card-panel full-width">
                <div className="panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3>Vehicle Services</h3>
                    <p className="panel-sub">Complete vehicle maintenance, servicing parts, and meter readings</p>
                  </div>

                  {/* Table Toolbar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '4px', position: 'relative' }}>
                      <button className="export-btn" onClick={handleCopyTable}>Copy</button>
                      <button className="export-btn" onClick={handlePrint}>Print</button>
                      <button className="export-btn" onClick={handleExportCSV}>csv</button>
                      <button className="export-btn" onClick={handleExportCSV}>pdf</button>
                      <button className="export-btn" onClick={handleExportCSV}>Excel</button>
                      {copiedNotification && <span className="copy-toast">Copied!</span>}
                    </div>

                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Show</span>
                      <select
                        style={{ background: '#0b0d13', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '4px 8px', borderRadius: '4px', outline: 'none' }}
                        value={entriesPerPage}
                        onChange={(e) => { setEntriesPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                      </select>
                      <span>entries</span>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="table-responsive">
                  <table className="vms-table">
                    <thead>
                      <tr>
                        <th>▴ Society</th>
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
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="12" className="table-loading">Loading vehicle services...</td>
                        </tr>
                      ) : paginatedServices.length > 0 ? (
                        paginatedServices.map((row, idx) => (
                          <tr key={row.id || idx}>
                            <td>{row.society}</td>
                            <td>{row.branch}</td>
                            <td>{row.model}</td>
                            <td><span className="reg-badge sm">{row.vehicleno}</span></td>
                            <td>{row.date}</td>
                            <td><strong>{row.parts}</strong></td>
                            <td>{row.duration}</td>
                            <td>{row.lastreading}</td>
                            <td>{row.presentreading}</td>
                            <td>{row.kms}</td>
                            <td>{row.remainder}</td>
                            <td>{row.remarks || '-'}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="12" className="table-empty">No matching records found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap', gap: '10px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>
                    Showing {filteredServices.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to {Math.min(currentPage * entriesPerPage, filteredServices.length)} of {filteredServices.length} entries
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      className="paginate-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        className={`paginate-btn ${currentPage === num ? 'active' : ''}`}
                        onClick={() => setCurrentPage(num)}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      className="paginate-btn"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

