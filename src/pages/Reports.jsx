import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bus, Building2, Users, GitBranch, ArrowLeftRight, Calendar,
  AlertTriangle, FileText, Fuel, Wrench, Settings, Battery, Disc,
  ChevronRight, ChevronDown, Search, Copy, Printer, FileSpreadsheet,
  CheckCircle2, RefreshCw, Download
} from 'lucide-react';
import MainLayout from '../components/MainLayout';
import VehicleAutocomplete from '../components/VehicleAutocomplete';
import ExportButtons from '../components/ExportButtons';
import { TableLoader } from '../components/Loader';
import { exportToCSV, exportToExcel, exportToPDF } from '../utils/exportUtils';
import {
  getVehiclesData, getStaffData, getCertificatesData, getFuelsData,
  getAdBlueData, getServicesData, getRepairBillsData, getBusBreakdownData,
  getBatteriesData, getVehicleTyresData, getAdminData
} from '../services/api';

const REPORT_SECTIONS = [
  {
    id: 'info',
    title: 'Vehicle Information',
    description: 'View basic details and specifications of the vehicle.',
    icon: Bus,
    apiFn: () => getVehiclesData('info', 'ALL'),
    columns: [
      { key: 'make', label: 'Vehicle Make' },
      { key: 'type', label: 'Vehicle Type' },
      { key: 'fuel', label: 'Fuel' },
      { key: 'vehicleregno', label: 'Vehicle Reg.No' },
      { key: 'model', label: 'Vehicle Model' },
      { key: 'fueltank', label: 'Fuel tank Capacity' },
      { key: 'capacity', label: 'Sitting Capacity' },
      { key: 'ekmpl', label: 'E.KMPL' },
      { key: 'serviceperiod', label: 'Service Period' },
      { key: 'servicemilaege', label: 'Service Milaege' },
      { key: 'tyres', label: 'Tyres' },
      { key: 'status', label: 'Status' }
    ]
  },
  {
    id: 'branch',
    title: 'Branch Vehicle Information',
    description: 'View branch-wise vehicle allocation and details.',
    icon: Building2,
    apiFn: () => getVehiclesData('branch', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'staffname', label: 'Staff Name' },
      { key: 'vehicleregno', label: 'Vehicle Registration No.' },
      { key: 'model', label: 'Model Name' },
      { key: 'purchasedate', label: 'Purchase Date' },
      { key: 'servicedate', label: 'Service Date' }
    ]
  },
  {
    id: 'busstaff',
    title: 'Bus Staff Information',
    description: 'View staff details assigned to the bus.',
    icon: Users,
    apiFn: () => getStaffData('BusStaff_Information', 'ALL'),
    columns: [
      { key: 'profilepic', label: 'Profile Pic' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'staffname', label: 'Name' },
      { key: 'designation', label: 'Designation' },
      { key: 'mobile', label: 'Mobile Number' },
      { key: 'dateofjoin', label: 'Date of Joining' },
      { key: 'vehicleno', label: 'Vehicle No.' },
      { key: 'badgeno', label: 'Badge No.' },
      { key: 'licenseno', label: 'License No.' },
      { key: 'valid', label: 'Valid Upto' },
      { key: 'rdate', label: 'Remainder Date' },
      { key: 'aadharpic', label: 'Aadhar Pic' },
      { key: 'aadharno', label: 'Aadhar No' },
      { key: 'licensefile', label: 'License' }
    ]
  },
  {
    id: 'routes',
    title: 'Routes',
    description: 'View all routes assigned to the vehicle.',
    icon: GitBranch,
    apiFn: () => getAdminData('route_details', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'regno', label: 'Registration No' },
      { key: 'routename', label: 'Route Name' },
      { key: 'distance', label: 'Distance(in kms)' }
    ]
  },
  {
    id: 'routedetails',
    title: 'Route Details',
    description: 'View detailed route information including timings and stops.',
    icon: GitBranch,
    apiFn: () => getVehiclesData('trips', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'regno', label: 'Registration No' },
      { key: 'routename', label: 'Route Name' },
      { key: 'startpoint', label: 'Start Point' },
      { key: 'starttime', label: 'Start Time' },
      { key: 'distance', label: 'Distance(in kms)' }
    ]
  },
  {
    id: 'stages',
    title: 'Stages',
    description: 'View stage-wise details of the route.',
    icon: GitBranch,
    apiFn: () => getAdminData('stages', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'vehicleregno', label: 'Vehicle Reg.No' },
      { key: 'stagename', label: 'Stage Name' },
      { key: 'sequence', label: 'Stages Sequence NO' },
      { key: 'amount', label: 'Amount' },
      { key: 'students', label: "No'of Students" }
    ]
  },
  {
    id: 'transfers',
    title: 'Transfers',
    description: 'View transfer history and details of the vehicle.',
    icon: ArrowLeftRight,
    apiFn: () => getAdminData('transfers', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'regno', label: 'Registration No.' },
      { key: 'serviceno', label: 'Service No.' },
      { key: 'branch', label: 'Present Branch' },
      { key: 'transferbranch', label: 'Transfered To' },
      { key: 'cmr', label: 'CMR' },
      { key: 'transferdate', label: 'Date of Transfer' }
    ]
  },
  {
    id: 'trips',
    title: 'Vehicle Trips',
    description: 'View trip history and schedule details.',
    icon: Calendar,
    apiFn: () => getVehiclesData('trips', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'regno', label: 'Reg.No' },
      { key: 'route', label: 'Route' },
      { key: 'date', label: 'Date' },
      { key: 'capacity', label: 'Capacity' },
      { key: 'studentsstrength', label: 'Students Strength' },
      { key: 'fixedstrength', label: 'Fixed Strength' },
      { key: 'omr', label: 'OMR' },
      { key: 'cmr', label: 'CMR' },
      { key: 'kms', label: 'KMS' },
      { key: 'distanceinkms', label: 'Distance(in kms)' },
      { key: 'result', label: 'Result' },
      { key: 'remarks', label: 'remarks' }
    ]
  },
  {
    id: 'accidents',
    title: 'Vehicle Accidents',
    description: 'View accident records and incident details.',
    icon: AlertTriangle,
    apiFn: () => getVehiclesData('accidents', 'ALL'),
    columns: [
      { key: 'image', label: 'Image' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'staffname', label: 'Staff Name' },
      { key: 'vehicleregno', label: 'Vehicle Registration No.' },
      { key: 'type', label: 'Type' },
      { key: 'settlementmode', label: 'Settlement Mode' },
      { key: 'date', label: 'Date' },
      { key: 'accidentplace', label: 'Accident Place' },
      { key: 'actiontaken', label: 'Action Taken' },
      { key: 'claimamount', label: 'Claim Amount' },
      { key: 'claimedfrom', label: 'Claimed From' },
      { key: 'accidentdescription', label: 'Accident Description' },
      { key: 'driverremarks', label: 'Driver Remarks' },
      { key: 'pdf', label: 'PDF' }
    ]
  },
  {
    id: 'certificates',
    title: 'Certificates Tab All',
    description: 'View all certificates related to the vehicle.',
    icon: FileText,
    subTabs: [
      {
        id: 'rta',
        label: 'RTA',
        apiFn: () => getCertificatesData('rta', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'serviceno', label: 'Service No.' },
          { key: 'dateofregistration', label: 'Date of Registration' },
          { key: 'expireddate', label: 'Expired Date' },
          { key: 'chasisno', label: 'Chasis No.' },
          { key: 'engineno', label: 'Engine No.' },
          { key: 'fuel', label: 'Fuel' },
          { key: 'horsepower', label: 'Horse Power' },
          { key: 'cubiccapacity', label: 'Cubic Capacity' },
          { key: 'wheelbase', label: 'Wheel base' },
          { key: 'sittingcapacity', label: 'Sitting Capacity' },
          { key: 'upload', label: 'Upload' }
        ]
      },
      {
        id: 'pollution',
        label: 'Pollution',
        apiFn: () => getCertificatesData('pollution', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'dateofchecking', label: 'Date of Checking' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'remainderdate', label: 'Remainder Date' },
          { key: 'upload', label: 'Upload' }
        ]
      },
      {
        id: 'fitness',
        label: 'Fitness',
        apiFn: () => getCertificatesData('fitness', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'certificateno', label: 'Certificate No.' },
          { key: 'dateofchecking', label: 'Date of Checking' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'remainderdate', label: 'Remainder Date' },
          { key: 'upload', label: 'Upload' }
        ]
      },
      {
        id: 'roadtax',
        label: 'Road Tax',
        apiFn: () => getCertificatesData('roadtax', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'chalanno', label: 'Chalan No.' },
          { key: 'dateofchalan', label: 'Date of Chalan' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'duedate', label: 'Due Date' },
          { key: 'graceperiod', label: 'Grace Period' },
          { key: 'upload', label: 'Upload' }
        ]
      },
      {
        id: 'roadpermit',
        label: 'Road Permit',
        apiFn: () => getCertificatesData('roadpermit', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'certificateno', label: 'Certificate No.' },
          { key: 'dateofissue', label: 'Date of Issue' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'duedate', label: 'Due Date' },
          { key: 'graceperiod', label: 'Grace Period' },
          { key: 'upload', label: 'Upload' }
        ]
      },
      {
        id: 'insurance',
        label: 'Insurance',
        apiFn: () => getCertificatesData('insurance', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'policy', label: 'Policy No.' },
          { key: 'company', label: 'Company Name' },
          { key: 'policydate', label: 'Policy Date' },
          { key: 'sdate', label: 'Start Date' },
          { key: 'edate', label: 'End Date' },
          { key: 'remainderdate', label: 'Remainder Date' },
          { key: 'noticeperiod', label: 'Notice Period' },
          { key: 'premiumamount', label: 'Premium Amount' },
          { key: 'premiumterm', label: 'Premium Term' },
          { key: 'upload', label: 'Upload' }
        ]
      },
      {
        id: 'insuranceclaim',
        label: 'Insurance Claim',
        apiFn: () => getCertificatesData('insuranceclaim', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'staffname', label: 'Staffname' },
          { key: 'vehicleregno', label: 'Reg.No' },
          { key: 'accidentdate', label: 'Accident Date' },
          { key: 'dateofclaimintimation', label: 'Date of Claim Intimation' },
          { key: 'company', label: 'Insurance Company' },
          { key: 'claimedno', label: 'Claimed No' },
          { key: 'damagedescription', label: 'Damage Description' },
          { key: 'amountrequested', label: 'Amount Requested' },
          { key: 'amountreleased', label: 'Amount Released' },
          { key: 'upload', label: 'File' }
        ]
      }
    ]
  },
  {
    id: 'busfill',
    title: 'Bus Filling',
    description: 'View fuel filling records and consumption details.',
    icon: Fuel,
    apiFn: () => getFuelsData('busfill', 'ALL'),
    columns: [
      { key: 'type', label: 'Type' },
      { key: 'model', label: 'Model' },
      { key: 'regno', label: 'Register No.' },
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'drivername', label: 'Driver Name' },
      { key: 'fuelsupplier', label: 'Fuel Supplier' },
      { key: 'date', label: 'Date' },
      { key: 'rateperliter', label: 'Rate Per Liter' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'totalrate', label: 'Total Rate' },
      { key: 'token_no', label: 'Token No.' },
      { key: 'token_issued_by', label: 'Token Issued By' },
      { key: 'omr', label: 'OMR' },
      { key: 'cmr', label: 'CMR' },
      { key: 'kms', label: 'KMS' },
      { key: 'avgkmpl', label: 'Avg.KMPL' },
      { key: 'grade', label: 'Grade' },
      { key: 'description', label: 'Description' }
    ]
  },
  {
    id: 'repairs',
    title: 'Vehicle Repairs',
    description: 'View repair and maintenance history of the vehicle.',
    icon: Wrench,
    apiFn: () => getRepairBillsData('repairbills', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'model', label: 'Model' },
      { key: 'vehicleno', label: 'Vehicle No.' },
      { key: 'attendantname', label: 'Name of the Attendant' },
      { key: 'date', label: 'Date' },
      { key: 'description', label: 'Repair Description' },
      { key: 'intime', label: 'In Time' },
      { key: 'outtime', label: 'Out Time' },
      { key: 'meterreading', label: 'Meter Reading' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'maintenance',
    title: 'Vehicle Maintenance',
    description: 'View daily maintenance records.',
    icon: Settings,
    apiFn: () => getServicesData('dailymaintenance', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'model', label: 'Model' },
      { key: 'vehicleno', label: 'Vehicle No.' },
      { key: 'waterservicing', label: 'Water Servicing' },
      { key: 'engineoil', label: 'Engine Oil' },
      { key: 'chasis', label: 'Chasis' },
      { key: 'springs', label: 'Springs' },
      { key: 'centerjoints', label: 'Center Joints' },
      { key: 'ubolts', label: 'All U Bolts' },
      { key: 'airfilling', label: 'Air Filling' },
      { key: 'greesing', label: 'Greesing' },
      { key: 'batterymaintenance', label: 'Battery Maintenance' },
      { key: 'lights', label: 'Lights' },
      { key: 'glasses', label: 'Glasses' },
      { key: 'bodypaint', label: 'Body paint' },
      { key: 'seats', label: 'Seats' },
      { key: 'gearoil', label: 'Gear Oil' },
      { key: 'difoil', label: 'DIF Oil' },
      { key: 'breakoil', label: 'Break Oil' },
      { key: 'atfoil', label: 'ATF Oil' },
      { key: 'radiatorwater', label: 'Radiator Water' },
      { key: 'meterreading', label: 'Meter Reading' },
      { key: 'dateofmaintenance', label: 'Date of Maintainence' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'service',
    title: 'Vehicle Service',
    description: 'View periodical service records.',
    icon: Wrench,
    apiFn: () => getServicesData('service', 'ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'model', label: 'Model' },
      { key: 'vehicleno', label: 'Vehicle No.' },
      { key: 'date', label: 'Date' },
      { key: 'serviceparts', label: 'Servicing Parts & Oils' },
      { key: 'duration', label: 'Periodical Duration' },
      { key: 'lastservicingreading', label: 'Last Servicing Reading' },
      { key: 'presentservicingreading', label: 'Present Servicing Reading' },
      { key: 'kms', label: 'KMS' },
      { key: 'remainderreading', label: 'Remainder Reading' },
      { key: 'remarks', label: 'Remarks' }
    ]
  },
  {
    id: 'busbreakdown',
    title: 'Bus Breake Down',
    description: 'View breakdown history.',
    icon: AlertTriangle,
    apiFn: () => getBusBreakdownData('ALL'),
    columns: [
      { key: 'society', label: 'Society' },
      { key: 'branch', label: 'Branch' },
      { key: 'vehicleno', label: 'Vehicle No.' },
      { key: 'drivername', label: 'Name of the Driver' },
      { key: 'driverphoneno', label: 'Driver Phone NO' },
      { key: 'breakedownplace', label: 'Break Down Place' },
      { key: 'complaint', label: 'Complaint' },
      { key: 'messagetime', label: 'Message Received Time' },
      { key: 'assignedtime', label: 'Work assigned Time' },
      { key: 'completedtime', label: 'Work Completed Time' },
      { key: 'status', label: 'Status' },
      { key: 'spareparts', label: 'Spare Parts' },
      { key: 'sparepartamount', label: 'Spare Part Amount' },
      { key: 'travellingallowance', label: 'Travelling Allowance' },
      { key: 'foodallowance', label: 'Food Allowance' },
      { key: 'totalamount', label: 'Total Amount' },
      { key: 'noofworkers', label: "No'of Workers" }
    ]
  },
  {
    id: 'battery',
    title: 'Battery',
    description: 'View battery history for the vehicle.',
    icon: Battery,
    subTabs: [
      {
        id: 'vehiclewise',
        label: 'Vehicle_Wise_Battery',
        apiFn: () => getBatteriesData('vehiclewise', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'battery_make', label: 'Battery Make' },
          { key: 'battery_capacity', label: 'Battery Capacity' },
          { key: 'battery_number', label: 'Battery Number' },
          { key: 'fitment_date', label: 'Date of Fitment' },
          { key: 'warranty', label: 'Warranty Period' },
          { key: 'expireddate', label: 'Expired Date' },
          { key: 'status', label: 'Status' },
          { key: 'remarks', label: 'Remarks' }
        ]
      },
      {
        id: 'reports',
        label: 'Battery_Change_Report',
        apiFn: () => getBatteriesData('reports', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'battery_make', label: 'Battery Make' },
          { key: 'battery_capacity', label: 'Battery Capacity' },
          { key: 'battery_number', label: 'Battery Number' },
          { key: 'frombusno', label: 'From Bus No.' },
          { key: 'tobusno', label: 'To Bus No.' },
          { key: 'initialfitmentdate', label: 'Initial Fitment Date' },
          { key: 'presentfitmentdate', label: 'Present Fitment Date' },
          { key: 'remarks', label: 'Remarks' }
        ]
      }
    ]
  },
  {
    id: 'tyres',
    title: 'Vehicle Tyres',
    description: 'View tyre fitment and replacement history.',
    icon: Disc,
    subTabs: [
      {
        id: 'tyres',
        label: 'New_Vehicle_Tyres',
        apiFn: () => getVehicleTyresData('tyres', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'vehicleregno', label: 'Vehicle Registration No.' },
          { key: 'serviceno', label: 'Service No.' },
          { key: 'tyremake', label: 'Tyre Make' },
          { key: 'position', label: 'Position' },
          { key: 'tyreno', label: 'tyre No.' },
          { key: 'sizeoftyre', label: 'Size of tyre' },
          { key: 'date', label: 'Date' }
        ]
      },
      {
        id: 'rebutton',
        label: 'Replaced_Vehicle_Tyres',
        apiFn: () => getVehicleTyresData('rebutton', 'ALL'),
        columns: [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'vehicleregno', label: 'Vehicle Registration No.' },
          { key: 'serviceno', label: 'Service No.' },
          { key: 'position', label: 'Position' },
          { key: 'tyreno', label: 'tyre No.' },
          { key: 'sizeoftyre', label: 'Size of tyre' },
          { key: 'omr', label: 'OMR' },
          { key: 'cmr', label: 'CMR' },
          { key: 'dateofremoving', label: 'Date of Removing' },
          { key: 'dateofreplacement', label: 'Date of Replacement' },
          { key: 'reason', label: 'Reason' },
          { key: 'remarks', label: 'Remarks' }
        ]
      }
    ]
  }
];

const Reports = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [mobileLeftOpen, setMobileLeftOpen] = useState(false);

  // Search & Filter state
  const [regNoInput, setRegNoInput] = useState('');
  const [appliedRegNo, setAppliedRegNo] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Section data & state
  const [sectionData, setSectionData] = useState({});
  const [sectionLoading, setSectionLoading] = useState({});
  const [activeSectionId, setActiveSectionId] = useState('info');
  const [activeSubTabs, setActiveSubTabs] = useState({ battery: 'vehiclewise', tyres: 'tyres', certificates: 'rta' });
  const [tableSearchQuery, setTableSearchQuery] = useState({});
  const [entriesPerPage, setEntriesPerPage] = useState({});
  const [currentPage, setCurrentPage] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { navigate('/'); return; }
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try { setUser(JSON.parse(userStr)); } catch (e) { }
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Fetch data for a single section (supporting subTabs if present)
  const fetchSectionData = async (section, queryReg, overrideSubTabId) => {
    const secId = section.id;
    setSectionLoading(prev => ({ ...prev, [secId]: true }));
    try {
      let apiCall = section.apiFn;
      if (section.subTabs && section.subTabs.length > 0) {
        const targetSubId = overrideSubTabId || activeSubTabs[secId] || section.subTabs[0].id;
        const subTabObj = section.subTabs.find(st => st.id === targetSubId);
        if (subTabObj) apiCall = subTabObj.apiFn;
      }
      const res = await apiCall();

      let rawList = [];
      if (Array.isArray(res)) {
        rawList = res;
      } else if (Array.isArray(res?.data)) {
        rawList = res.data;
      } else if (Array.isArray(res?.data?.data)) {
        rawList = res.data.data;
      } else if (Array.isArray(res?.records)) {
        rawList = res.records;
      } else if (Array.isArray(res?.items)) {
        rawList = res.items;
      }

      let filtered = rawList;
      if (queryReg && queryReg.trim()) {
        const q = queryReg.trim().toLowerCase().replace(/\s+/g, '');
        filtered = rawList.filter(item => {
          if (!item || typeof item !== 'object') return false;
          const reg = (
            item.vehicleregno ||
            item.regno ||
            item.vehicleno ||
            item.busnumber ||
            item.busno ||
            item.vehicle_no ||
            item.vehicleRegNo ||
            item.frombusno ||
            item.tobusno ||
            ''
          ).toString().toLowerCase().replace(/\s+/g, '');
          return reg.includes(q);
        });
      }
      setSectionData(prev => ({ ...prev, [secId]: Array.isArray(filtered) ? filtered : [] }));
    } catch (err) {
      console.error(`Error fetching section ${secId}:`, err);
      setSectionData(prev => ({ ...prev, [secId]: [] }));
    } finally {
      setSectionLoading(prev => ({ ...prev, [secId]: false }));
    }
  };

  const handleSubTabChange = (secId, subTabId) => {
    setActiveSubTabs(prev => ({ ...prev, [secId]: subTabId }));
    const sectionObj = REPORT_SECTIONS.find(s => s.id === secId);
    if (sectionObj) {
      fetchSectionData(sectionObj, appliedRegNo, subTabId);
    }
  };

  // Trigger search across all sections
  const handleGetData = async (targetReg) => {
    const q = (targetReg !== undefined ? targetReg : regNoInput).trim();
    setAppliedRegNo(q);
    setIsSearching(true);

    // Keep active section or default to 'info'
    if (!activeSectionId) {
      setActiveSectionId('info');
    }

    // Fetch data for all sections
    REPORT_SECTIONS.forEach(section => {
      fetchSectionData(section, q);
    });
  };

  const toggleSection = (secId) => {
    // If clicking the currently open tab, toggle or keep it; if clicking another, switch to it (closing previous)
    const newSecId = activeSectionId === secId ? null : secId;
    setActiveSectionId(newSecId);

    // Fetch if opening for first time or data empty
    if (newSecId && sectionData[newSecId] === undefined) {
      const secObj = REPORT_SECTIONS.find(s => s.id === newSecId);
      if (secObj) fetchSectionData(secObj, appliedRegNo);
    }
  };

  // Export handlers
  const handleExportCSV = (secObj, data) => {
    const cols = secObj?.columns || [];
    if (!data || !data.length) { alert('No data available to export'); return; }
    const headers = cols.map(c => c.label);
    const rows = data.map(row => cols.map(c => row[c.key] ?? ''));
    exportToCSV(headers, rows, `Vehicle_History_${secObj.title}`);
  };

  const handleExportPDF = (secObj, data) => {
    const cols = secObj?.columns || [];
    if (!data || !data.length) { alert('No data available to export'); return; }
    const headers = cols.map(c => c.label);
    const rows = data.map(row => cols.map(c => row[c.key] ?? ''));
    exportToPDF(headers, rows, `Vehicle_History_${secObj.title}`, `Vehicle History - ${secObj.title}`);
  };

  const handleExportExcel = (secObj, data) => {
    const cols = secObj?.columns || [];
    if (!data || !data.length) { alert('No data available to export'); return; }
    const headers = cols.map(c => c.label);
    const rows = data.map(row => cols.map(c => row[c.key] ?? ''));
    exportToExcel(headers, rows, `Vehicle_History_${secObj.title}`);
  };

  const handlePrintTable = (secObj, data) => {
    const cols = secObj?.columns || [];
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${secObj.title} Report</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 24px; color: #1e293b; }
        h2 { text-align: center; color: #0b5299; border-bottom: 2px solid #0b5299; padding-bottom: 8px; }
        table { border-collapse: collapse; width: 100%; margin-top: 16px; }
        th, td { border: 1px solid #cbd5e1; padding: 8px 10px; font-size: 12px; text-align: left; }
        th { background-color: #f1f5f9; font-weight: 600; }
      </style>
      </head><body>
      <h2>Vehicle History - ${secObj.title} (${appliedRegNo || 'All Vehicles'})</h2>
      <table>
        <thead>
          <tr><th>S.No</th>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map((row, idx) => `<tr><td>${idx + 1}</td>${cols.map(c => `<td>${row[c.key] ?? '-'}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  return (
    <MainLayout
      mobileLeftOpen={mobileLeftOpen}
      setMobileLeftOpen={setMobileLeftOpen}
      activeTab="Reports"
      user={user}
      handleLogout={handleLogout}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%', paddingBottom: '30px' }}>
        
        {/* ── Top Header Banner (Matching Screenshot 1) ── */}
        <div style={{
          position: 'relative',
          background: 'linear-gradient(135deg, #f0f7ff 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(11, 82, 153, 0.05)',
          overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', zIndex: 1 }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#0b5299',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(11, 82, 153, 0.2)'
            }}>
              <Bus size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.01em' }}>
                Vehicle History
              </h1>
              <p style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#475569', fontWeight: '500' }}>
                View detailed information and history of a vehicle across different modules.
              </p>
            </div>
          </div>
          
          {/* Subtle Graphic Silhouette */}
          <div style={{
            position: 'absolute',
            right: '-10px',
            bottom: '-15px',
            opacity: 0.12,
            pointerEvents: 'none'
          }}>
            <Bus size={140} color="#0b5299" />
          </div>
        </div>

        {/* ── Search Bar Section (Matching Screenshot 1 & 2) ── */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '10px',
          padding: '12px 18px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <label style={{ fontWeight: '700', fontSize: '13px', color: '#1e293b' }}>
            Register No:
          </label>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ width: '300px', maxWidth: '100%' }}>
              <VehicleAutocomplete
                value={regNoInput}
                onChange={(val) => setRegNoInput(val)}
                onSelectVehicle={(veh) => {
                  const selectedReg = veh.regno || veh;
                  setRegNoInput(selectedReg);
                  handleGetData(selectedReg);
                }}
                placeholder="Enter vehicle registration number"
              />
            </div>

            <button
              type="button"
              onClick={() => handleGetData()}
              style={{
                backgroundColor: '#0b5299',
                color: '#ffffff',
                border: 'none',
                padding: '7px 18px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 3px 8px rgba(11, 82, 153, 0.18)',
                transition: 'all 0.2s ease'
              }}
            >
              <Search size={15} />
              <span>Get Data</span>
            </button>

            {appliedRegNo && (
              <button
                type="button"
                onClick={() => {
                  setRegNoInput('');
                  setAppliedRegNo('');
                  setIsSearching(false);
                  setSectionData({});
                  setActiveSectionId(null);
                }}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '7px 14px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <RefreshCw size={13} />
                <span>Reset Search</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Vehicle Info Summary Badge (Screenshot 1) ── */}
        {appliedRegNo && (
          <div style={{
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '10px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bus size={18} />
              </div>
              <div>
                <div style={{ fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#64748b', fontWeight: 600 }}>
                  Registration No.
                </div>
                <div style={{ fontSize: '16px', fontWeight: '800', color: '#0f172a' }}>
                  {appliedRegNo.toUpperCase()}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Status:</div>
              <span style={{
                backgroundColor: '#ecfdf5',
                color: '#059669',
                border: '1px solid #a7f3d0',
                padding: '3px 10px',
                borderRadius: '16px',
                fontSize: '11.5px',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                Active
              </span>
            </div>
          </div>
        )}

        {/* ── Interactive 3-Column Cards Grid (Matching Screenshot 1) ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '10px'
        }}>
          {REPORT_SECTIONS.map((section) => {
            const IconComp = section.icon;
            const isOpen = activeSectionId === section.id;
            const dataCount = sectionData[section.id]?.length || 0;

            return (
              <div
                key={section.id}
                onClick={() => toggleSection(section.id)}
                style={{
                  backgroundColor: isOpen ? '#f0f7ff' : '#ffffff',
                  border: isOpen ? '1.5px solid #0b5299' : '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  transition: 'all 0.15s ease',
                  boxShadow: isOpen ? '0 3px 10px rgba(11, 82, 153, 0.1)' : '0 1px 2px rgba(0,0,0,0.02)'
                }}
                onMouseEnter={(e) => {
                  if (!isOpen) {
                    e.currentTarget.style.borderColor = '#94a3b8';
                    e.currentTarget.style.backgroundColor = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isOpen) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.backgroundColor = '#ffffff';
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: isOpen ? '#dbeafe' : '#f1f5f9',
                    color: isOpen ? '#0b5299' : '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <IconComp size={16} />
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <h3 style={{ margin: 0, fontSize: '13.5px', fontWeight: '700', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {section.title}
                    </h3>
                    <p style={{ margin: '1px 0 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {section.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {appliedRegNo && (
                    <span style={{
                      fontSize: '10.5px',
                      fontWeight: '700',
                      padding: '2px 7px',
                      borderRadius: '10px',
                      backgroundColor: dataCount > 0 ? '#dcfce7' : '#f1f5f9',
                      color: dataCount > 0 ? '#15803d' : '#64748b'
                    }}>
                      {dataCount}
                    </span>
                  )}
                  <ChevronRight
                    size={16}
                    style={{
                      color: isOpen ? '#0b5299' : '#94a3b8',
                      transform: isOpen ? 'rotate(90deg)' : 'none',
                      transition: 'transform 0.2s ease'
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Single Open Section Details Table at Bottom (Matching Screenshot 2) ── */}
        {activeSectionId && (() => {
          const section = REPORT_SECTIONS.find(s => s.id === activeSectionId);
          if (!section) return null;

          const secId = section.id;
          const isLoading = !!sectionLoading[secId];
          const rawData = sectionData[secId];
          const data = Array.isArray(rawData) ? rawData : [];
          const query = (tableSearchQuery[secId] || '').toLowerCase();
          const entries = entriesPerPage[secId] || 10;
          const page = currentPage[secId] || 1;

          let activeColumns = section.columns || [];
          if (section.subTabs && section.subTabs.length > 0) {
            const activeSubId = activeSubTabs[secId] || section.subTabs[0].id;
            const subTabObj = section.subTabs.find(st => st.id === activeSubId) || section.subTabs[0];
            activeColumns = subTabObj ? subTabObj.columns : (section.columns || []);
          }
          const exportSection = { ...section, columns: activeColumns };

          const filtered = data.filter(row => {
            if (!row || typeof row !== 'object') return false;
            if (!query) return true;
            return Object.values(row).some(v => v !== null && v !== undefined && typeof v !== 'object' && String(v).toLowerCase().includes(query));
          });

          const totalPages = Math.ceil(filtered.length / entries) || 1;
          const paginated = filtered.slice((page - 1) * entries, page * entries);

          return (
            <div
              key={secId}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginTop: '10px'
              }}
            >
              {/* Grey Section Title Bar (Screenshot style) */}
              <div
                style={{
                  backgroundColor: '#f1f5f9',
                  borderBottom: '1px solid #cbd5e1',
                  padding: '10px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: '800', color: '#1e293b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {section.title}
                </span>
                <div style={{ position: 'absolute', right: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                    {filtered.length} Records
                  </span>
                </div>
              </div>

              {/* Subtabs Bar (Matching Screenshots 1, 2, 3, 4 style: Active = Black text in tab, Inactive = Blue text) */}
              {section.subTabs && section.subTabs.length > 0 && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #cbd5e1',
                  padding: '10px 16px 0 16px'
                }}>
                  {section.subTabs.map(st => {
                    const isSubActive = (activeSubTabs[secId] || section.subTabs[0].id) === st.id;
                    return (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleSubTabChange(secId, st.id)}
                        style={{
                          padding: '8px 20px',
                          fontSize: '13.5px',
                          fontWeight: isSubActive ? '700' : '600',
                          color: isSubActive ? '#1e293b' : '#0284c7', // Black text for active/selected, Blue text for inactive
                          backgroundColor: isSubActive ? '#ffffff' : 'transparent',
                          border: isSubActive ? '1px solid #cbd5e1' : '1px solid transparent',
                          borderBottom: isSubActive ? '2px solid #ffffff' : '1px solid transparent',
                          borderRadius: '6px 6px 0 0',
                          marginBottom: isSubActive ? '-1px' : '0',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {st.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Table Content Card */}
              <div style={{ padding: '10px 14px' }}>
                {/* Toolbar with Export Buttons + Entries + Search */}
                <div className="admin-table-toolbar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      type="button"
                      className="export-btn csv-btn"
                      onClick={() => handleExportCSV(exportSection, filtered)}
                      title="Export CSV"
                    >
                      <FileText size={14} />
                      <span>CSV</span>
                    </button>
                    <button
                      type="button"
                      className="export-btn pdf-btn"
                      onClick={() => handleExportPDF(exportSection, filtered)}
                      title="Export PDF"
                    >
                      <FileText size={14} />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      className="export-btn excel-btn"
                      onClick={() => handleExportExcel(exportSection, filtered)}
                      title="Export Excel"
                    >
                      <FileSpreadsheet size={14} />
                      <span>Excel</span>
                    </button>
                    <button
                      type="button"
                      className="export-btn print-btn"
                      onClick={() => handlePrintTable(exportSection, filtered)}
                      title="Print Table"
                      style={{ backgroundColor: '#475569', color: '#fff' }}
                    >
                      <Printer size={14} />
                      <span>Print</span>
                    </button>
                  </div>

                  <div className="admin-entries-control">
                    <span>Show</span>
                    <select
                      value={entries}
                      onChange={(e) => {
                        setEntriesPerPage(prev => ({ ...prev, [secId]: Number(e.target.value) }));
                        setCurrentPage(prev => ({ ...prev, [secId]: 1 }));
                      }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                    <span>entries</span>
                  </div>

                  <div className="admin-search-control">
                    <label>Search:</label>
                    <input
                      type="text"
                      value={tableSearchQuery[secId] || ''}
                      onChange={(e) => {
                        setTableSearchQuery(prev => ({ ...prev, [secId]: e.target.value }));
                        setCurrentPage(prev => ({ ...prev, [secId]: 1 }));
                      }}
                      placeholder="Filter list..."
                    />
                  </div>
                </div>

                {/* Data Table */}
                <div className="admin-table-responsive">
                  <table className="admin-data-table">
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>▴ S.No</th>
                        {activeColumns.map(col => (
                          <th key={col.key}>{col.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <TableLoader
                          colSpan={activeColumns.length + 1}
                          message={`Loading ${section.title} records, please wait...`}
                        />
                      ) : paginated.length > 0 ? (
                        paginated.map((row, idx) => (
                          <tr key={row._id || row.id || idx}>
                            <td><strong>{(page - 1) * entries + idx + 1}</strong></td>
                            {activeColumns.map(col => (
                              <td key={col.key}>
                                {(() => {
                                  if (col.key === 'pdf') {
                                    return (
                                      <button
                                        type="button"
                                        onClick={() => handleExportPDF(exportSection, [row])}
                                        style={{
                                          backgroundColor: '#0284c7',
                                          color: '#ffffff',
                                          border: 'none',
                                          padding: '4px 8px',
                                          borderRadius: '4px',
                                          cursor: 'pointer',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                        title="Download PDF"
                                      >
                                        <Download size={14} />
                                      </button>
                                    );
                                  }

                                  let val = row[col.key];

                                  if (val === undefined || val === null || val === '') {
                                    if (col.key === 'staffname') val = row.name || row.staffName;
                                    else if (col.key === 'name') val = row.staffname || row.name;
                                    else if (col.key === 'vehicleregno') val = row.regno || row.vehicleno || row.busnumber || row.busno;
                                    else if (col.key === 'regno') val = row.vehicleregno || row.vehicleno || row.busnumber || row.busno;
                                    else if (col.key === 'vehicleno') val = row.vehicleregno || row.regno || row.busnumber || row.busno;
                                    else if (col.key === 'licenseno') val = row.licienseno || row.licenseNo;
                                    else if (col.key === 'stagename') val = row.stage || row.stageName || row.routename;
                                    else if (col.key === 'sequence') val = row.stagesequenceno || row.stage_no || row.sequence;
                                    else if (col.key === 'students') val = row.noofstudents || row.studentsstrength || row.students;
                                    else if (col.key === 'mobile') val = row.cellno || row.phoneno;
                                    else if (col.key === 'rateperliter') val = row.rate_per_liter || row.fuelrate || row.rate;
                                    else if (col.key === 'quantity') val = row.filled_Qty || row.qty || row.liter;
                                    else if (col.key === 'totalrate') val = row.total_rate || row.totalamount || row.amount;
                                    else if (col.key === 'avgkmpl') val = row.avg_kmpl || row.ekmpl || row.kmpl;
                                    else if (col.key === 'type') val = row.type || row.bus_type || row.fueltype || 'Own';
                                    else if (col.key === 'image') val = row.photo || row.accidentpic || row.file || row.image;
                                    else if (col.key === 'attendantname') val = row.attendantname || row.attendant_name || row.name_of_the_attendant || row.staffname || row.staffName;
                                    else if (col.key === 'intime') val = row.intime || row.in_time || row.inTime;
                                    else if (col.key === 'outtime') val = row.outtime || row.out_time || row.outTime;
                                    else if (col.key === 'meterreading') val = row.meterreading || row.meter_reading || row.meterReading || row.omr;
                                    else if (col.key === 'waterservicing') val = row.waterservicing || row.water_servicing || row.waterServicing || row.water;
                                    else if (col.key === 'engineoil') val = row.engineoil || row.engine_oil || row.engineOil;
                                    else if (col.key === 'chasis') val = row.chasis || row.chasis_servicing || row.chassis;
                                    else if (col.key === 'springs') val = row.springs || row.springs_servicing;
                                    else if (col.key === 'centerjoints') val = row.centerjoints || row.center_joints || row.centerJoints;
                                    else if (col.key === 'ubolts') val = row.ubolts || row.all_u_bolts || row.u_bolts || row.allUbolts;
                                    else if (col.key === 'airfilling') val = row.airfilling || row.air_filling || row.airFilling;
                                    else if (col.key === 'greesing') val = row.greesing || row.greasing;
                                    else if (col.key === 'batterymaintenance') val = row.batterymaintenance || row.battery_maintenance || row.batteryMaintenance;
                                    else if (col.key === 'bodypaint') val = row.bodypaint || row.body_paint || row.bodyPaint;
                                    else if (col.key === 'gearoil') val = row.gearoil || row.gear_oil || row.gearOil;
                                    else if (col.key === 'difoil') val = row.difoil || row.dif_oil || row.difOil;
                                    else if (col.key === 'breakoil') val = row.breakoil || row.break_oil || row.brake_oil || row.breakOil;
                                    else if (col.key === 'atfoil') val = row.atfoil || row.atf_oil || row.atfOil;
                                    else if (col.key === 'radiatorwater') val = row.radiatorwater || row.radiator_water || row.radiatorWater;
                                    else if (col.key === 'dateofmaintenance') val = row.dateofmaintenance || row.date_of_maintenance || row.date;
                                    else if (col.key === 'serviceparts') val = row.serviceparts || row.servicingparts || row.servicing_parts || row.parts;
                                    else if (col.key === 'duration') val = row.duration || row.periodical_duration || row.periodicalDuration;
                                    else if (col.key === 'lastservicingreading') val = row.lastservicingreading || row.last_servicing_reading || row.lastServicingReading;
                                    else if (col.key === 'presentservicingreading') val = row.presentservicingreading || row.present_servicing_reading || row.presentServicingReading;
                                    else if (col.key === 'remainderreading') val = row.remainderreading || row.remainder_reading || row.remainderReading;
                                    else if (col.key === 'drivername') val = row.drivername || row.driver_name || row.driverName || row.name_of_the_driver || row.staffname;
                                    else if (col.key === 'driverphoneno') val = row.driverphoneno || row.driver_phone_no || row.driverPhoneNo || row.phone_no || row.mobile;
                                    else if (col.key === 'breakedownplace') val = row.breakedownplace || row.break_down_place || row.place;
                                    else if (col.key === 'complaint') val = row.complaint || row.natureofcomplaint || row.nature_of_complaint;
                                    else if (col.key === 'messagetime') val = row.messagetime || row.message_received_time || row.messageReceivedTime;
                                    else if (col.key === 'assignedtime') val = row.assignedtime || row.work_assigned_time || row.workAssignedTime;
                                    else if (col.key === 'completedtime') val = row.completedtime || row.work_completed_time || row.workCompletedTime;
                                    else if (col.key === 'status') val = row.status || row.workstatus || row.work_status;
                                    else if (col.key === 'spareparts') val = row.spareparts || row.spare_parts || row.spareParts;
                                    else if (col.key === 'sparepartamount') val = row.sparepartamount || row.spare_part_amount || row.sparePartAmount;
                                    else if (col.key === 'travellingallowance') val = row.travellingallowance || row.travelling_allowance || row.travellingAllowance;
                                    else if (col.key === 'foodallowance') val = row.foodallowance || row.food_allowance || row.foodAllowance;
                                    else if (col.key === 'totalamount') val = row.totalamount || row.total_amount || row.totalAmount || row.amount;
                                    else if (col.key === 'noofworkers') val = row.noofworkers || row.no_of_workers || row.noOfWorkers || row.workers;
                                    else if (col.key === 'battery_make') val = row.battery_make || row.batterymake || row.make;
                                    else if (col.key === 'battery_capacity') val = row.battery_capacity || row.batterycapacity || row.capacity;
                                    else if (col.key === 'battery_number') val = row.battery_number || row.batterynumber || row.batteryno;
                                    else if (col.key === 'fitment_date') val = row.fitment_date || row.fitmentdate || row.dateoffitment || row.date;
                                    else if (col.key === 'warranty') val = row.warranty || row.warrantyperiod || row.warranty_period;
                                    else if (col.key === 'expireddate') val = row.expireddate || row.expired_date || row.expirydate;
                                    else if (col.key === 'frombusno') val = row.frombusno || row.from_bus_no || row.fromBusNo || row.vehicleno || row.vehicleregno;
                                    else if (col.key === 'tobusno') val = row.tobusno || row.to_bus_no || row.toBusNo;
                                    else if (col.key === 'initialfitmentdate') val = row.initialfitmentdate || row.initial_fitment_date || row.initialFitmentDate || row.fitment_date;
                                    else if (col.key === 'presentfitmentdate') val = row.presentfitmentdate || row.present_fitment_date || row.presentFitmentDate || row.date;
                                    else if (col.key === 'tyremake') val = row.tyremake || row.tyre_make || row.make;
                                    else if (col.key === 'serviceno') val = row.serviceno || row.service_no || row.serviceNo;
                                    else if (col.key === 'position') val = row.position || row.tyre_position;
                                    else if (col.key === 'tyreno') val = row.tyreno || row.tyre_no || row.tyreNo;
                                    else if (col.key === 'sizeoftyre') val = row.sizeoftyre || row.size_of_tyre || row.size;
                                    else if (col.key === 'omr') val = row.omr || row.old_meter_reading;
                                    else if (col.key === 'cmr') val = row.cmr || row.current_meter_reading;
                                    else if (col.key === 'dateofremoving') val = row.dateofremoving || row.date_of_removing || row.dateOfRemoving || row.removedate;
                                    else if (col.key === 'dateofreplacement') val = row.dateofreplacement || row.date_of_replacement || row.dateOfReplacement || row.replacementdate;
                                    else if (col.key === 'reason') val = row.reason || row.replacement_reason;
                                    else if (col.key === 'horsepower') val = row.horsepower || row.horse_power || row.horsePower || row.hp;
                                    else if (col.key === 'cubiccapacity') val = row.cubiccapacity || row.cubic_capacity || row.cubicCapacity || row.cc;
                                    else if (col.key === 'wheelbase') val = row.wheelbase || row.wheel_base || row.wheelBase;
                                    else if (col.key === 'sittingcapacity') val = row.sittingcapacity || row.sitting_capacity || row.sittingCapacity || row.capacity;
                                    else if (col.key === 'upload') val = row.upload || row.file || row.pdf || row.document || row.filename;
                                    else if (col.key === 'dateofchecking') val = row.dateofchecking || row.date_of_checking || row.dateOfChecking || row.date;
                                    else if (col.key === 'validupto') val = row.validupto || row.valid_upto || row.validUpto || row.valid;
                                    else if (col.key === 'remainderdate') val = row.remainderdate || row.remainder_date || row.remainderDate || row.rdate;
                                    else if (col.key === 'certificateno') val = row.certificateno || row.certificate_no || row.certificateNo;
                                    else if (col.key === 'chalanno') val = row.chalanno || row.chalan_no || row.chalanNo || row.challanno;
                                    else if (col.key === 'dateofchalan') val = row.dateofchalan || row.date_of_chalan || row.dateOfChalan || row.date;
                                    else if (col.key === 'duedate') val = row.duedate || row.due_date || row.dueDate;
                                    else if (col.key === 'graceperiod') val = row.graceperiod || row.grace_period || row.gracePeriod;
                                    else if (col.key === 'dateofissue') val = row.dateofissue || row.date_of_issue || row.dateOfIssue || row.date;
                                    else if (col.key === 'policy') val = row.policy || row.policyno || row.policy_no;
                                    else if (col.key === 'company') val = row.company || row.companyname || row.company_name;
                                    else if (col.key === 'sdate') val = row.sdate || row.policydate || row.policy_date || row.startdate;
                                    else if (col.key === 'edate') val = row.edate || row.enddate || row.end_date || row.expireddate;
                                    else if (col.key === 'accidentdate') val = row.accidentdate || row.accident_date || row.accidentDate;
                                    else if (col.key === 'dateofclaimintimation') val = row.dateofclaimintimation || row.date_of_claim_intimation || row.dateOfClaimIntimation;
                                    else if (col.key === 'claimedno') val = row.claimedno || row.claimed_no || row.claimNo;
                                    else if (col.key === 'damagedescription') val = row.damagedescription || row.damage_description || row.description;
                                    else if (col.key === 'amountrequested') val = row.amountrequested || row.amount_requested || row.requestedAmount;
                                    else if (col.key === 'amountreleased') val = row.amountreleased || row.amount_released || row.releasedAmount;
                                    else if (col.key === 'policydate') val = row.policydate || row.policy_date || row.sdate;
                                    else if (col.key === 'noticeperiod') val = row.noticeperiod || row.notice_period || row.noticePeriod;
                                    else if (col.key === 'premiumamount') val = row.premiumamount || row.premium_amount || row.premiumAmount || row.amount;
                                    else if (col.key === 'premiumterm') val = row.premiumterm || row.premium_term || row.premiumTerm;
                                  }

                                  if (val === undefined || val === null || val === '') return '-';

                                  const valStr = String(val);

                                  if (
                                    col.key === 'image' || col.key.includes('pic') || col.key.includes('photo') || col.key.includes('licensefile') ||
                                    valStr.startsWith('data:image') || valStr.startsWith('http://') || valStr.startsWith('https://')
                                  ) {
                                    if (valStr.startsWith('data:image') || valStr.startsWith('http://') || valStr.startsWith('https://')) {
                                      return (
                                        <img
                                          src={valStr}
                                          alt={col.key}
                                          style={{ width: '30px', height: '30px', borderRadius: '4px', objectFit: 'cover', border: '1px solid #cbd5e1' }}
                                        />
                                      );
                                    }
                                    if (valStr.includes('.')) {
                                      return (
                                        <span style={{ fontSize: '11px', color: '#0284c7', textDecoration: 'underline' }}>
                                          {valStr}
                                        </span>
                                      );
                                    }
                                  }

                                  return valStr;
                                })()}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={activeColumns.length + 1} className="empty-cell">
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
                    Showing {filtered.length === 0 ? 0 : (page - 1) * entries + 1} to {Math.min(page * entries, filtered.length)} of {filtered.length} entries
                  </div>
                  <div className="admin-pagination-group">
                    <button
                      type="button"
                      className="admin-pbtn"
                      disabled={page === 1}
                      onClick={() => setCurrentPage(prev => ({ ...prev, [secId]: Math.max(1, page - 1) }))}
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        type="button"
                        className={`admin-pbtn ${page === num ? 'active' : ''}`}
                        onClick={() => setCurrentPage(prev => ({ ...prev, [secId]: num }))}
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="admin-pbtn"
                      disabled={page >= totalPages}
                      onClick={() => setCurrentPage(prev => ({ ...prev, [secId]: Math.min(totalPages, page + 1) }))}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </MainLayout>
  );
};

export default Reports;
