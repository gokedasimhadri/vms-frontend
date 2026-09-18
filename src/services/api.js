import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1002';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.username) config.headers['x-user-username'] = user.username;
      if (user.branch) config.headers['x-user-branch'] = user.branch;
    } catch (e) {}
  }
  return config;
});

// ================= AUTH =================
export const loginUser = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

// ================= DASHBOARD =================
export const getDashboardOverview = async (branch) => {
  const params = branch && branch !== 'ALL' ? { branch } : {};
  const response = await api.get('/dashboard/overview', { params });
  return response.data;
};

// ================= ADMIN =================
export const getAdminData = async (type = 'stages', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/admin/data', { params });
  return response.data;
};

export const createAdminItem = async (type, data) => {
  const response = await api.post(`/admin/${type}`, data);
  return response.data;
};

export const updateAdminItem = async (type, id, data) => {
  const response = await api.put(`/admin/${type}/${id}`, data);
  return response.data;
};

export const deleteAdminItem = async (type, id) => {
  const response = await api.delete(`/admin/${type}/${id}`);
  return response.data;
};

export const createStage = async (stageData) => {
  const response = await api.post('/admin/stages', stageData);
  return response.data;
};

export const getStageFormOptions = async () => {
  const response = await api.get('/admin/stage-form-options');
  return response.data;
};

// ================= STAFF =================
export const getStaffData = async (type = 'Designations', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/staff', { params });
  return response.data;
};

export const createStaffItem = async (type, data) => {
  const response = await api.post(`/staff/${type}`, data);
  return response.data;
};

export const updateStaffItem = async (type, id, data) => {
  const response = await api.put(`/staff/${type}/${id}`, data);
  return response.data;
};

export const deleteStaffItem = async (type, id) => {
  const response = await api.delete(`/staff/${type}/${id}`);
  return response.data;
};

// ================= VEHICLES =================
export const getVehiclesData = async (type = 'branch', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/vehicles', { params });
  return response.data;
};

export const createVehicleItem = async (type, data) => {
  const response = await api.post(`/vehicles/${type}`, data);
  return response.data;
};

export const updateVehicleItem = async (type, id, data) => {
  const response = await api.put(`/vehicles/${type}/${id}`, data);
  return response.data;
};

export const deleteVehicleItem = async (type, id) => {
  const response = await api.delete(`/vehicles/${type}/${id}`);
  return response.data;
};

// ================= CERTIFICATES =================
export const getCertificatesData = async (type = 'pollution', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/certificates', { params });
  return response.data;
};

export const createCertificateItem = async (type, data) => {
  const response = await api.post(`/certificates/${type}`, data);
  return response.data;
};

export const updateCertificateItem = async (type, id, data) => {
  const response = await api.put(`/certificates/${type}/${id}`, data);
  return response.data;
};

export const deleteCertificateItem = async (type, id) => {
  const response = await api.delete(`/certificates/${type}/${id}`);
  return response.data;
};

// ================= FUELS =================
export const getFuelsData = async (type = 'busfill', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/fuels', { params });
  return response.data;
};

export const createFuelItem = async (type, data) => {
  const response = await api.post(`/fuels/${type}`, data);
  return response.data;
};

export const updateFuelItem = async (type, id, data) => {
  const response = await api.put(`/fuels/${type}/${id}`, data);
  return response.data;
};

export const deleteFuelItem = async (type, id) => {
  const response = await api.delete(`/fuels/${type}/${id}`);
  return response.data;
};

// ================= AD-BLUE =================
export const getAdBlueData = async (type = 'adbluebusfill', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/adblue', { params });
  return response.data;
};

export const createAdBlueItem = async (type, data) => {
  const response = await api.post(`/adblue/${type}`, data);
  return response.data;
};

export const updateAdBlueItem = async (type, id, data) => {
  const response = await api.put(`/adblue/${type}/${id}`, data);
  return response.data;
};

export const deleteAdBlueItem = async (type, id) => {
  const response = await api.delete(`/adblue/${type}/${id}`);
  return response.data;
};

// ================= SERVICES =================
export const getServicesData = async (type = 'service', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/services', { params });
  return response.data;
};

export const createServiceItem = async (type, data) => {
  const response = await api.post(`/services/${type}`, data);
  return response.data;
};

export const updateServiceItem = async (type, id, data) => {
  const response = await api.put(`/services/${type}/${id}`, data);
  return response.data;
};

export const deleteServiceItem = async (type, id) => {
  const response = await api.delete(`/services/${type}/${id}`);
  return response.data;
};

// ================= REPAIR BILLS =================
export const getRepairBillsData = async (branch, search = '') => {
  const params = {};
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/repair-bills', { params });
  return response.data;
};

export const generateVoucherNumber = async (branch = 'DEFAULT') => {
  const response = await api.get('/repair-bills/voucher-number', { params: { branch } });
  return response.data;
};

export const createRepairBill = async (data) => {
  const response = await api.post('/repair-bills', data);
  return response.data;
};

export const updateRepairBill = async (id, data) => {
  const response = await api.put(`/repair-bills/${id}`, data);
  return response.data;
};

export const deleteRepairBill = async (id) => {
  const response = await api.delete(`/repair-bills/${id}`);
  return response.data;
};

// ================= BUS BREAKDOWN =================
export const getBusBreakdownData = async (branch, search = '') => {
  const params = {};
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/bus-breakdown', { params });
  return response.data;
};

export const createBusBreakdownItem = async (data) => {
  const response = await api.post('/bus-breakdown', data);
  return response.data;
};

export const updateBusBreakdownItem = async (id, data) => {
  const response = await api.put(`/bus-breakdown/${id}`, data);
  return response.data;
};

export const deleteBusBreakdownItem = async (id) => {
  const response = await api.delete(`/bus-breakdown/${id}`);
  return response.data;
};

// ================= BATTERIES =================
export const getBatteriesData = async (type = 'vehiclewise', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/batteries', { params });
  return response.data;
};

export const createBatteryItem = async (type, data) => {
  const response = await api.post(`/batteries/${type}`, data);
  return response.data;
};

export const updateBatteryItem = async (type, id, data) => {
  const response = await api.put(`/batteries/${type}/${id}`, data);
  return response.data;
};

export const deleteBatteryItem = async (type, id) => {
  const response = await api.delete(`/batteries/${type}/${id}`);
  return response.data;
};

// ================= VEHICLE TYRES =================
export const getVehicleTyresData = async (type = 'tyres', branch, search = '') => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  if (search) params.search = search;
  const response = await api.get('/vehicle-tyres', { params });
  return response.data;
};

export const createVehicleTyreItem = async (type, data) => {
  const response = await api.post(`/vehicle-tyres/${type}`, data);
  return response.data;
};

export const updateVehicleTyreItem = async (type, id, data) => {
  const response = await api.put(`/vehicle-tyres/${type}/${id}`, data);
  return response.data;
};

export const deleteVehicleTyreItem = async (type, id) => {
  const response = await api.delete(`/vehicle-tyres/${type}/${id}`);
  return response.data;
};

export default api;
