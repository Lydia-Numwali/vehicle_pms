import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = (email, password) =>
  api.post('/auth/login', { email, password });
export const getSlotRequests = (page, limit, search) =>
  api.get('/slot-requests', { params: { page, limit, search } });
export const approveRequest = (id) =>
  api.put(`/slot-requests/${id}/approve`);
export const rejectRequest = (id, reason) =>
  api.put(`/slot-requests/${id}/reject`, { reason });
export const getLogs = (page, limit, search) =>
  api.get('/logs', { params: { page, limit, search } }); 