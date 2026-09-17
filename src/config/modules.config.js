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
          { key: 'staffname', label: 'Staff Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'aadharno', label: 'Aadhar No' },
          { key: 'dateofjoin', label: 'Date of Join' },
        ];
      }
      if (subTab === 'BusStaff_Information') {
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
      if (subTab === 'BusCleaner_Information') {
        return [
          { key: 'cleanername', label: 'Cleaner Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'aadharno', label: 'Aadhar No' },
          { key: 'dateofjoin', label: 'Date of Join' },
        ];
      }
      if (subTab === 'Opting_Staff_Information') {
        return [
          { key: 'staffname', label: 'Staff Name' },
          { key: 'designation', label: 'Designation' },
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'mobile', label: 'Mobile' },
          { key: 'vehicleno', label: 'Vehicle No' },
        ];
      }
      if (subTab === 'Staff_Meeting_Register') {
        return [
          { key: 'society', label: 'Society' },
          { key: 'branch', label: 'Branch' },
          { key: 'date', label: 'Date' },
          { key: 'points', label: 'Meeting Points' },
          { key: 'file', label: 'Attachment' },
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
