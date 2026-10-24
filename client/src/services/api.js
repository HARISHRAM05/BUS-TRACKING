// Axios instance + one small function per API endpoint
import axios from 'axios';

export const TOKEN_KEY = 'kbtp_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach the JWT to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is expired/invalid, tell the AuthContext to log out
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isAuthCall = err.config?.url?.startsWith('/auth/login') || err.config?.url?.startsWith('/auth/signup');
    if (err.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event('kbtp:unauthorized'));
    }
    return Promise.reject(err);
  }
);

// Unwrap { success, message, data } -> data
const data = (p) => p.then((res) => res.data.data);
// For writes we also want the server's message for the toast
const withMessage = (p) => p.then((res) => ({ data: res.data.data, message: res.data.message }));

// ---------- Auth ----------
export const authApi = {
  login: (body) => data(api.post('/auth/login', body)),
  signup: (body) => data(api.post('/auth/signup', body)),
  me: () => data(api.get('/auth/me')),
  changePassword: (body) => withMessage(api.put('/auth/change-password', body)),
};

// Builds simple CRUD helpers for a resource like "/buses"
const crud = (path) => ({
  list: (params) => data(api.get(path, { params })),
  get: (id) => data(api.get(`${path}/${id}`)),
  create: (body) => withMessage(api.post(path, body)),
  update: (id, body) => withMessage(api.put(`${path}/${id}`, body)),
  remove: (id) => withMessage(api.delete(`${path}/${id}`)),
});

export const busApi = crud('/buses');
export const routeApi = crud('/routes');
export const scheduleApi = crud('/schedules');
export const userApi = crud('/users');

// Routes + stop coordinates + assigned bus (with last known location) for the map
export const trackingApi = {
  list: () => data(api.get('/tracking')),
};

export const dashboardApi = {
  stats: () => data(api.get('/stats')),
  activity: (limit = 10) => data(api.get('/activity', { params: { limit } })),
};

// ---------- Error helpers ----------
export const getErrorMessage = (err) =>
  err.response?.data?.message || (err.request ? 'Cannot reach the server. Is the backend running?' : err.message);

export const getFieldErrors = (err) => err.response?.data?.errors || {};

export default api;
