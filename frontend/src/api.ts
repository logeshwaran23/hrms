import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:4000/api',
});

export const setAuthToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const login = (payload: { email: string; password: string }) => api.post('/auth/login', payload);
export const fetchDashboard = () => api.get('/dashboard');
export const checkIn = () => api.post('/attendance/check-in');
export const checkOut = () => api.post('/attendance/check-out');
export const fetchReports = () => api.get('/dashboard'); // Adjusted since reports is mostly dashboard data
export const fetchLeaves = () => api.get('/leave');
export const fetchEODReports = () => api.get('/eod');
export const submitLeave = (payload: { type: string; from: string; to: string; reason: string }) => api.post('/leave', payload);
export const submitEOD = (payload: { summary: string; completedTasks: string }) => api.post('/eod', payload);
