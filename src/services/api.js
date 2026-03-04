// API Service - All backend endpoints
import axios from 'axios';

// const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const API_URL = process.env.REACT_APP_API_URL || 'https://clicke-backend.onrender.com';
// Create axios instance
const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
}, (error) => Promise.reject(error));

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only auto-logout on 401 (token expired/invalid)
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

// Global axios interceptor for ALL axios calls (including raw axios in dashboards)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (username, password) => {
    const formData = new URLSearchParams();
    formData.append('username', username);
    formData.append('password', password);
    const response = await axios.post(`${API_URL}/api/v1/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  register: async (data) => {
    const formData = new FormData();
    Object.keys(data).forEach(key => {
      if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    const response = await axios.post(`${API_URL}/api/v1/auth/register`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getDistricts: async () => {
    const response = await axios.get(`${API_URL}/api/v1/auth/districts`);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const formData = new URLSearchParams();
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
    return api.post('/auth/change-password', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  },
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getDistricts: () => api.get('/admin/districts'),
  getOperators: (params) => api.get('/admin/operators', { params }),
  approveDocuments: (operatorId) => api.post(`/admin/approve-documents/${operatorId}`),
  rejectDocuments: (operatorId, reason) => api.post(`/admin/reject-documents/${operatorId}`, { reason }),
  verifyPayment: (operatorId) => api.post(`/admin/verify-payment/${operatorId}`),
  rejectPayment: (operatorId, reason) => api.post(`/admin/reject-payment/${operatorId}`, { reason }),
};

// Operator API
export const operatorAPI = {
  getDashboard: () => api.get('/operator/dashboard'),
  getOperator: (id) => api.get(`/operator/${id}`),
  submitDailyReport: (data) => api.post('/daily-reports/submit', data),
  getReports: (params) => api.get('/daily-reports/my-reports', { params }),
};

// Daily Reports API
export const dailyReportAPI = {
  submit: (data) => api.post('/daily-reports/submit', data),
  getMyReports: (params) => api.get('/daily-reports/my-reports', { params }),
  getReport: (id) => api.get(`/daily-reports/${id}`),
};

// Notifications API
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};
export const notificationAPI = notificationsAPI;

// Supervisor API
export const supervisorAPI = {
  getDashboard: () => api.get('/supervisor/dashboard'),
  getPendingOperators: () => api.get('/supervisor/pending-operators'),
  approveDocuments: (operatorId) => api.post(`/supervisor/approve-documents/${operatorId}`),
  rejectDocuments: (operatorId, reason) => api.post(`/supervisor/reject-documents/${operatorId}`, { reason }),
};

// Accountant API
export const accountantAPI = {
  getDashboard: () => api.get('/accountant/dashboard'),
  getPayments: (status) => api.get('/accountant/payments', { params: { status } }),
  verifyPayment: (operatorId) => api.post(`/accountant/verify-payment/${operatorId}`),
  rejectPayment: (operatorId, reason) => api.post(`/accountant/reject-payment/${operatorId}`, { reason }),
};

// Owner API
export const ownerAPI = {
  getDashboard: () => api.get('/owner/dashboard'),
  getDistricts: () => api.get('/owner/districts'),
  createAdmin: (data) => api.post('/owner/create-admin', null, { params: data }),
};

// HQ Supervisor API
export const hqSupervisorAPI = {
  getDashboard: () => api.get('/hq-supervisor/dashboard'),
};

// Central Supervisor API
export const centralSupervisorAPI = {
  getDashboard: () => api.get('/central-supervisor/dashboard'),
};

export default api;
