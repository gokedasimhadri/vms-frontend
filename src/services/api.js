import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:1002';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const loginUser = async (credentials) => {
  const response = await api.post('/login', credentials);
  return response.data;
};

export const registerUser = async (userData) => {
  const response = await api.post('/register', userData);
  return response.data;
};

export const getDashboardOverview = async (branch) => {
  const params = branch && branch !== 'ALL' ? { branch } : {};
  const response = await api.get('/dashboard/overview', { params });
  return response.data;
};

export const getAdminData = async (type = 'stages', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') {
    params.branch = branch;
  }
  const response = await api.get('/dashboard/admin-data', { params });
  return response.data;
};

export const createStage = async (stageData) => {
  const response = await api.post('/dashboard/admin/stages', stageData);
  return response.data;
};

export const deleteAdminItem = async (type, id) => {
  const response = await api.delete(`/admin/${type}/${id}`);
  return response.data;
};

// Staff API
export const getStaffData = async (type = 'bus', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/staff', { params });
  return response.data;
};

// Vehicles API
export const getVehiclesData = async (type = 'branch', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/vehicles', { params });
  return response.data;
};

// Certificates API
export const getCertificatesData = async (type = 'pollution', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/certificates', { params });
  return response.data;
};

// Fuels API
export const getFuelsData = async (type = 'fuel', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/fuels', { params });
  return response.data;
};

// Ad-Blue API
export const getAdBlueData = async (type = 'AdBlue', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/adblue', { params });
  return response.data;
};

// Services API
export const getServicesData = async (type = 'service', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/services', { params });
  return response.data;
};

// Repair Bills API
export const getRepairBillsData = async (branch) => {
  const params = branch && branch !== 'ALL' ? { branch } : {};
  const response = await api.get('/repair-bills', { params });
  return response.data;
};

// Bus Breakdown API
export const getBusBreakdownData = async (branch) => {
  const params = branch && branch !== 'ALL' ? { branch } : {};
  const response = await api.get('/bus-breakdown', { params });
  return response.data;
};

// Batteries API
export const getBatteriesData = async (type = 'vehiclewise', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/batteries', { params });
  return response.data;
};

// Vehicle Tyres API
export const getVehicleTyresData = async (type = 'tyres', branch) => {
  const params = { type };
  if (branch && branch !== 'ALL') params.branch = branch;
  const response = await api.get('/vehicle-tyres', { params });
  return response.data;
};



