import {
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

export const SIDEBAR_MODULE_CONFIG = {
  Staff: {
    title: 'Staff Directory',
    subTabs: [
      { id: 'Designations', label: 'Designations' },
      { id: 'Office_Staff', label: 'Office_Staff' },
      { id: 'BusStaff_Information', label: 'BusStaff_Information' },
      { id: 'BusCleaner_Information', label: 'BusCleaner_Information' },
      { id: 'Opting_Staff_Information', label: 'Opting_Staff_Information' },
      { id: 'Staff_Meeting_Register', label: 'Staff_Meeting_Register' },
      { id: 'Staff_Remarks', label: 'Staff_Remarks' },
    ],
    apiFn: (subTab, branch) => getStaffData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'Designations') {
        return [
          { key: 'name', label: 'Designation Name' },
        ];
      }
      if (subTab === 'Office_Staff') {
        return [
          { key: 'profilepic', label: 'Profile Pic', type: 'image' },
          { key: 'staffname', label: 'Staff Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'dateofjoin', label: 'Date of Join' },
        ];
      }
      if (subTab === 'BusStaff_Information') {
        return [
          { key: 'society', label: 'Society', type: 'society-select' },
          { key: 'branch', label: 'Branch', type: 'branch-select' },
          { key: 'designation', label: 'Designation', type: 'designation-select' },
          { key: 'staffname', label: 'Staff Name', type: 'text' },
          { key: 'mobile', label: 'Mobile Number', type: 'text' },
          { key: 'dateofjoin', label: 'Date of Joining', type: 'date' },
          { key: 'licienseno', label: 'Liciense No.', type: 'text' },
          { key: 'rdate', label: 'Liciense remainder Date', type: 'date' },
          { key: 'valid', label: 'Valid Upto', type: 'date' },
        ];
      }
      if (subTab === 'BusCleaner_Information') {
        return [
          { key: 'profilepic', label: 'Profile Pic', type: 'image' },
          { key: 'cleanername', label: 'Cleaner Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'dateofjoin', label: 'Date of Join' },
        ];
      }
      if (subTab === 'Opting_Staff_Information') {
        return [
          { key: 'profilepic', label: 'Profile Pic', type: 'image' },
          { key: 'staffname', label: 'Staff Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'vehicleno', label: 'Vehicle No', type: 'vehicle-select' },
        ];
      }
      if (subTab === 'Staff_Meeting_Register') {
        return [
          { key: 'society', label: 'Society', type: 'society-select' },
          { key: 'branch', label: 'Branch', type: 'branch-select' },
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'points', label: 'Points Discussed', type: 'textarea' },
          { key: 'file', label: 'Upload(with Principal Sign)', type: 'file' },
        ];
      }
      if (subTab === 'Staff_Remarks') {
        return [
          { key: 'staffname', label: 'Staff Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'date', label: 'Date' },
          { key: 'remarks', label: 'Remarks' },
          { key: 'description', label: 'Description' },
        ];
      }
      return [
        { key: 'name', label: 'Name' },
      ];
    }
  },
  Vehicles: {
    title: 'Vehicles Management',
    subTabs: [
      { id: 'makes', label: 'Vehicles Makes' },
      {
        id: 'info',
        label: 'Vehicle Information',
        childSubTabs: [
          { id: 'lightmotor', label: 'Light Motor' },
          { id: 'heavymotor', label: 'Heavy Motor' },
        ]
      },
      { id: 'branch', label: 'Branch Vehicle Info' },
      {
        id: 'trips',
        label: 'Vehicle Trips',
        childSubTabs: [
          { id: 'entrydata', label: 'Entry Data' },
          { id: 'generatereport', label: 'Generate Report' },
        ]
      },
      { id: 'accidents', label: 'Vehicle Accidents' },
      { id: 'vcr', label: 'Vehicle Change Register' },
    ],
    apiFn: (subTab, branch, search, extra) => getVehiclesData(subTab, branch, search, extra),
    columns: (subTab) => {
      if (subTab === 'makes') {
        return [
          { key: 'make', label: 'Vehicle Make' },
          { key: 'type', label: 'Vehicle Type' },
          { key: 'model', label: 'Vehicle Model' },
        ];
      }
      if (subTab === 'info' || subTab === 'lightmotor' || subTab === 'heavymotor') {
        return [
          { key: 'make', label: 'Vehicle Make', type: 'make-select' },
          { key: 'type', label: 'Vehicle Type', type: 'vehicle-type-select' },
          { key: 'fuel', label: 'Fuel', type: 'fuel-select' },
          { key: 'vehicleregno', label: 'Vehicle Reg.No' },
          { key: 'model', label: 'Vehicle Model', type: 'model-select' },
          { key: 'fueltank', label: 'Fuel tank Capacity' },
          { key: 'capacity', label: 'Sitting Capacity' },
          { key: 'ekmpl', label: 'E.KMPL' },
          { key: 'serviceperiod', label: 'Service Period' },
          { key: 'servicemilaege', label: 'Service Milaege' },
          { key: 'tyres', label: 'Tyres' },
          { key: 'status', label: 'Status', modalLabel: 'Vehicle Status :', type: 'status-select' },
        ];
      }
      if (subTab === 'branch') {
        return [
          { key: 'society', label: 'Society', type: 'society-select' },
          { key: 'branch', label: 'Branch', type: 'branch-select' },
          { key: 'staffname', label: 'Staff Name', type: 'staff-select' },
          { key: 'vehicleregno', label: 'Vehicle Registration No.' },
          { key: 'model', label: 'Model Name', type: 'model-select' },
          { key: 'purchasedate', label: 'Purchase Date', type: 'date' },
          { key: 'servicedate', label: 'Service Date', type: 'date' },
        ];
      }
      if (subTab === 'trips' || subTab === 'entrydata' || subTab === 'generatereport') {
        return [
          { key: 'society', label: 'Society', type: 'society-select' },
          { key: 'branch', label: 'Branch', type: 'branch-select' },
          { key: 'regno', label: 'Reg.No' },
          { key: 'route', label: 'Route' },
          { key: 'date', label: 'Date', type: 'date' },
          { key: 'capacity', label: 'Capacity' },
          { key: 'studentsstrength', label: 'Students Strength' },
          { key: 'fixedstrength', label: 'Fixed Strength' },
          { key: 'omr', label: 'OMR' },
          { key: 'cmr', label: 'CMR' },
          { key: 'kms', label: 'KMS' },
          { key: 'distance', label: 'Distance(in kms)' },
          { key: 'result', label: 'Result' },
          { key: 'remarks', label: 'remarks' },
        ];
      }
      if (subTab === 'accidents') {
        return [
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
        ];
      }
      if (subTab === 'vcr') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'vehicleregno', label: 'Vehicle Registration No.' },
          { key: 'staffname', label: 'Staff Name' },
          { key: 'vehiclecondition', label: 'Vehicle Condition' },
          { key: 'handoverto', label: 'Handover To' },
          { key: 'presentroute', label: 'Present Route' },
          { key: 'handoverroute', label: 'Handover Route' },
          { key: 'changetype', label: 'Change Type' },
          { key: 'cmr', label: 'CMR' },
          { key: 'date', label: 'Date' },
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      return [
        { key: 'vehicleregno', label: 'Vehicle Registration No.' },
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
      ];
    }
  },
  Certificates: {
    title: 'Certificates & Compliance',
    subTabs: [
      { id: 'rta', label: 'RTA Details' },
      { id: 'pollution', label: 'Pollution Certificate' },
      { id: 'fitness', label: 'Fitness Certificate' },
      { id: 'roadtax', label: 'Road Tax' },
      { id: 'roadpermit', label: 'Road Permit' },
      { id: 'insurance', label: 'Vehicle Insurance' },
      { id: 'challan', label: 'Vehicle Challan Register' },
      { id: 'insuranceclaim', label: 'Vehicle Insurance Claim' },
    ],
    apiFn: (subTab, branch) => getCertificatesData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'rta') {
        return [
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
          { key: 'upload', label: 'Upload' },
        ];
      }
      if (subTab === 'pollution') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'upload', label: 'Upload' },
        ];
      }
      if (subTab === 'fitness') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'certificateno', label: 'Certificate No.' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'upload', label: 'Upload' },
        ];
      }
      if (subTab === 'roadtax') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'chalanno', label: 'Chalan No.' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'upload', label: 'Upload' },
        ];
      }
      if (subTab === 'roadpermit') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'certificateno', label: 'Certificate No.' },
          { key: 'validupto', label: 'Valid Upto' },
          { key: 'upload', label: 'Upload' },
        ];
      }
      if (subTab === 'insurance') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleregno', label: 'Vehicle No.' },
          { key: 'policy', label: 'Policy No.' },
          { key: 'company', label: 'Company Name' },
          { key: 'sdate', label: 'Policy Date' },
          { key: 'edate', label: 'End Date' },
          { key: 'upload', label: 'Upload' },
        ];
      }
      if (subTab === 'challan') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'staffname', label: 'Staff Name' },
          { key: 'vehicleregno', label: 'Register No.' },
          { key: 'date', label: 'Date' },
          { key: 'reason', label: 'Reason' },
          { key: 'challanno', label: 'Challan No' },
          { key: 'amount', label: 'Challan Amount' },
          { key: 'remarks', label: 'Remarks' },
          { key: 'file', label: 'File' },
        ];
      }
      if (subTab === 'insuranceclaim') {
        return [
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
          { key: 'file', label: 'File' },
        ];
      }
      return [
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'vehicleregno', label: 'Vehicle No.' },
      ];
    }
  },
  Fuels: {
    title: 'Fuel Management',
    subTabs: [
      { id: 'suppliers', label: 'Fuel Suppliers' },
      { id: 'bunk', label: 'Fuel Bunk' },
      { id: 'servicing', label: 'Bunk Servicing' },
      { id: 'fuelfill', label: 'Bunk Fillings' },
      {
        id: 'busfill',
        label: 'Bus Fillings',
        nestedTabs: [
          { id: 'entry_data', label: 'Entry Data' },
          { id: 'generate_report', label: 'Generate Report' },
          { id: 'search_bus_report', label: 'Search Bus Report' },
        ]
      },
    ],
    apiFn: (subTab, branch) => getFuelsData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'suppliers' || subTab === 'fuelsuppliers') {
        return [
          { key: 'companyname', label: 'Company Name' },
        ];
      }
      if (subTab === 'bunk' || subTab === 'fuelbunk') {
        return [
          { key: 'branchname', label: 'Branch Name' },
          { key: 'bunkcapacity', label: 'Bunk Capacity' },
        ];
      }
      if (subTab === 'servicing' || subTab === 'bunkservicing') {
        return [
          { key: 'branch', label: 'Branch' },
          { key: 'companyname', label: 'Company Name' },
          { key: 'reason', label: 'Reason' },
          { key: 'date', label: 'Date' },
          { key: 'description', label: 'Description' },
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      if (subTab === 'fuelfill' || subTab === 'bunkfillings') {
        return [
          { key: 'bunk', label: 'Bunk' },
          { key: 'fuelsupplier', label: 'Fuel Supplier' },
          { key: 'billno', label: 'Bill No.' },
          { key: 'billdate', label: 'Bill Date' },
          { key: 'filldate', label: 'Filling Date' },
          { key: 'tankerno', label: 'Tanker Register No' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'rate', label: 'Rate Per Liter' },
          { key: 'totalrate', label: 'Total Rate' },
        ];
      }
      if (subTab === 'busfill') {
        return [
          { key: 'regno', label: 'Register No.' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'drivername', label: 'Driver Name' },
          { key: 'fuelsupplier', label: 'Fuel Supplier' },
          { key: 'capacity', label: 'Tank capacity' },
          { key: 'date', label: 'Date' },
          { key: 'token_no', label: 'Token No.' },
          { key: 'token_issued_by', label: 'Token Issued By' },
          { key: 'omr', label: 'OMR' },
          { key: 'cmr', label: 'CMR' },
          { key: 'kms', label: 'KMS' },
          { key: 'filled_Qty', label: 'Filled Qty' },
        ];
      }
      return [
        { key: 'type', label: 'Type' },
        { key: 'model', label: 'Model' },
        { key: 'vehicleregno', label: 'Register No.' },
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'drivername', label: 'Driver Name' },
        { key: 'fuelsupplier', label: 'Fuel Supplier' },
        { key: 'date', label: 'Date' },
        { key: 'rate', label: 'Rate Per Liter' },
        { key: 'quantity', label: 'Quantity' },
        { key: 'total', label: 'Total Rate' },
        { key: 'tokenno', label: 'Token No.' },
        { key: 'tokenissuedby', label: 'Token Issued By' },
        { key: 'omr', label: 'OMR' },
        { key: 'cmr', label: 'CMR' },
        { key: 'kms', label: 'KMS' },
        { key: 'avgkmpl', label: 'Avg.KMPL' },
        { key: 'grade', label: 'Grade' },
        { key: 'description', label: 'Description' },
      ];
    }
  },
  'Ad-Blue': {
    title: 'Ad-Blue Management',
    subTabs: [
      { id: 'adblue', label: 'Ad_Suppliers' },
      { id: 'adbluebunk', label: 'Ad_Bunk' },
      { id: 'adbluefuelfill', label: 'Ad_Bunk_Fillings' },
      {
        id: 'adbluebusfill',
        label: 'Ad_Bus_Fillings',
        nestedTabs: [
          { id: 'entry_data', label: 'Entry Data' },
          { id: 'generate_report', label: 'Generate Report' },
          { id: 'search_bus_report', label: 'Search Bus Report' },
        ]
      },
    ],
    apiFn: (subTab, branch) => getAdBlueData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'Ad_Suppliers' || subTab === 'adblue') {
        return [
          { key: 'name', label: 'Company Name' },
        ];
      }
      if (subTab === 'Ad_Bunk' || subTab === 'adbluebunk') {
        return [
          { key: 'branch', label: 'Branch Name' },
          { key: 'capacity', label: 'Bunk Capacity' },
        ];
      }
      if (subTab === 'Ad_Bunk_Fillings' || subTab === 'adbluefuelfill') {
        return [
          { key: 'bunkname', label: 'Bunk' },
          { key: 'bunksupplier', label: 'Fuel Supplier' },
          { key: 'billno', label: 'Bill No.' },
          { key: 'billdate', label: 'Bill Date' },
          { key: 'filldate', label: 'Filling Date' },
          { key: 'tankerno', label: 'Tanker Register No' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'rate', label: 'Rate Per Liter' },
          { key: 'trate', label: 'Total Rate' },
        ];
      }
      if (subTab === 'Ad_Bus_Fillings' || subTab === 'adbluebusfill') {
        return [
          { key: 'regno', label: 'Register No.' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'drivername', label: 'Driver Name' },
          { key: 'fuelsupplier', label: 'Ad-Blue Supplier' },
          { key: 'capacity', label: 'Tank capacity' },
          { key: 'date', label: 'Date' },
          { key: 'token_no', label: 'Token No.' },
          { key: 'token_issued_by', label: 'Token Issued By' },
          { key: 'omr', label: 'OMR' },
          { key: 'cmr', label: 'CMR' },
          { key: 'kms', label: 'KMS' },
          { key: 'filled_Qty', label: 'Filled Qty' },
        ];
      }
      return [
        { key: 'name', label: 'Name' },
      ];
    }
  },
  Services: {
    title: 'Services & Maintenance',
    subTabs: [
      { id: 'dailymaintenance', label: 'Daily Vehicle Maintenance' },
      { id: 'service', label: 'Vehicle Services' },
      { id: 'repair', label: 'Vehicle Repairs' },
    ],
    apiFn: (subTab, branch) => getServicesData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'dailymaintenance' || subTab === 'daily') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'vehicleno', label: 'Vehicle No.' },
          { key: 'waterservicing', label: 'Water Servicing' },
          { key: 'engineoil', label: 'Engine Oil' },
          { key: 'chasis', label: 'Chasis' },
          { key: 'springs', label: 'Springs' },
          { key: 'centerjoints', label: 'Center Joints' },
          { key: 'allubolts', label: 'All U Bolts' },
          { key: 'airfilling', label: 'Air Filling' },
          { key: 'greesing', label: 'Greesing' },
          { key: 'batterymaintenance', label: 'Battery Maintenance' },
          { key: 'lights', label: 'Lights' },
          { key: 'glasses', label: 'Glasses' },
          { key: 'bodypaint', label: 'Body paint' },
          { key: 'seats', label: 'Seats' },
          { key: 'gearoil', label: 'Gear Oil' },
          { key: 'difoil', label: 'DIF Oil' },
          { key: 'brakeoil', label: 'Brake Oil' },
          { key: 'atfoil', label: 'ATF Oil' },
          { key: 'radiatorwater', label: 'Radiator Water' },
          { key: 'meterreading', label: 'Meter Reading' },
          { key: 'dateofmaintenance', label: 'Date of Maintainence' },
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      if (subTab === 'repair' || subTab === 'vehiclerepairs') {
        return [
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
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      return [
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
        { key: 'remarks', label: 'Remarks' },
      ];
    }
  },
  'Repair Bills': {
    title: 'Repair Bills',
    subTabs: [
      { id: 'repairbills', label: 'All Repair Bills' },
      { id: 'generatereport', label: 'Generate Report' },
    ],
    apiFn: (subTab, branch) => getRepairBillsData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'generatereport') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'model', label: 'Model' },
          { key: 'busnumber', label: 'Bus Number' },
          { key: 'repairdate', label: 'Date', type: 'date' },
          { key: 'repairtype', label: 'Type Of Repair' },
          { key: 'description', label: 'Repair Description' },
          { key: 'vendorname', label: 'Vendor Name' },
          { key: 'materialinfo', label: 'Material information' },
          { key: 'amount', label: 'Amount' },
          { key: 'vouchernumber', label: 'Voucher Number' },
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      return [
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'model', label: 'Model' },
        { key: 'busnumber', label: 'Bus Number' },
        { key: 'repairdate', label: 'Date', type: 'date' },
        { key: 'repairtype', label: 'Type Of Repair' },
        { key: 'description', label: 'Repair Description' },
        { key: 'vendorname', label: 'Vendor Name' },
        { key: 'materialinfo', label: 'Material information' },
        { key: 'amount', label: 'Amount' },
        { key: 'vouchernumber', label: 'Voucher Number' },
        { key: 'remarks', label: 'Remarks' },
      ];
    }
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
      { id: 'vehiclewise', label: 'Vehicle Wise Battery' },
      { id: 'reports', label: 'Battery Change Report' },
      { id: 'trackbattery', label: 'Track Battery' },
    ],
    apiFn: (subTab, branch) => getBatteriesData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'trackbattery') {
        return [
          { key: 'battery_number', label: 'Battery Number' },
          { key: 'battery_make', label: 'Battery Make' },
          { key: 'battery_capacity', label: 'Battery Capacity' },
          { key: 'frombusno', label: 'From Bus No.' },
          { key: 'tobusno', label: 'To Bus No.' },
          { key: 'shift_count', label: 'Total Shifts' },
          { key: 'initialfitmentdate', label: 'Initial Fitment Date' },
          { key: 'presentfitmentdate', label: 'Present Fitment Date' },
          { key: 'remarks', label: 'Remarks' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
        ];
      }
      if (subTab === 'reports') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'battery_make', label: 'Battery Make' },
          { key: 'battery_capacity', label: 'Battery Capacity' },
          { key: 'battery_number', label: 'Battery Number' },
          { key: 'frombusno', label: 'From Bus No.' },
          { key: 'tobusno', label: 'To Bus No.' },
          { key: 'initialfitmentdate', label: 'Initial Fitment Date' },
          { key: 'presentfitmentdate', label: 'Present Fitment Date' },
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      return [
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
        { key: 'remarks', label: 'Remarks' },
      ];
    }
  },
  'Vehicle Tyres': {
    title: 'Tyre Management',
    subTabs: [
      { id: 'tyres', label: 'New Tyres' },
      { id: 'rebutton', label: 'Rebutton Tyres' },
      { id: 'status', label: 'Tyre Status' },
      { id: 'tracktyre', label: 'Track Tyre' },
    ],
    apiFn: (subTab, branch) => getVehicleTyresData(subTab, branch),
    columns: (subTab) => {
      if (subTab === 'tracktyre') {
        return [
          { key: 'tyreno', label: 'Tyre Number' },
          { key: 'tyremake', label: 'Tyre Make' },
          { key: 'sizeoftyre', label: 'Tyre Size' },
          { key: 'frombusno', label: 'From Bus No.' },
          { key: 'tobusno', label: 'To Bus No.' },
          { key: 'shift_count', label: 'Total Shifts' },
          { key: 'position', label: 'Position' },
          { key: 'dateofreplacement', label: 'Replacement/Fitment Date' },
          { key: 'totalkms', label: 'Total Kms' },
          { key: 'status', label: 'Status' },
          { key: 'remarks', label: 'Remarks' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
        ];
      }
      if (subTab === 'rebutton') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'vehicleregno', label: 'Vehicle Registration No.' },
          { key: 'serviceno', label: 'Service No.' },
          { key: 'position', label: 'Position' },
          { key: 'tyreno', label: 'tyre No.' },
          { key: 'sizeoftyre', label: 'Size of tyre' },
          { key: 'omr', label: 'OMR' },
          { key: 'cmr', label: 'CMR' },
          { key: 'totalkms', label: 'Total Kms' },
          { key: 'status', label: 'Status' },
          { key: 'dateofreplacement', label: 'Date of Replacement' },
          { key: 'reason', label: 'Reason' },
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      if (subTab === 'status') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'vehicleregno', label: 'Vehicle Registration No.' },
          { key: 'position', label: 'Position' },
          { key: 'tyreno', label: 'tyre No.' },
          { key: 'sizeoftyre', label: 'Size of tyre' },
          { key: 'warrantydistance', label: 'Warranty Distance' },
          { key: 'status', label: 'Status' },
          { key: 'condemndistance', label: 'Condemn Distance' },
          { key: 'remarks', label: 'Remarks' },
        ];
      }
      return [
        { key: 'society', label: 'Society' },
        { key: 'branch', label: 'Branch' },
        { key: 'vehicleregno', label: 'Vehicle Registration No.' },
        { key: 'serviceno', label: 'Service No.' },
        { key: 'tyremake', label: 'Make' },
        { key: 'position', label: 'Position' },
        { key: 'tyreno', label: 'tyre No.' },
        { key: 'sizeoftyre', label: 'Size of tyre' },
        { key: 'dateoffitting', label: 'Date Of Fitting' },
        { key: 'omr', label: 'OMR' },
        { key: 'cmr', label: 'CMR' },
        { key: 'totalkms', label: 'Total Kms' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
      ];
    }
  }
};
