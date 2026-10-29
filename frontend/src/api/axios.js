import axios from 'axios';
import { storage } from '../utils/helpers';

export const TOKEN_KEY = 'cems_token';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
});

// Attach the JWT to every request.
api.interceptors.request.use((config) => {
  const token = storage.get(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401 for an authenticated session (expired/invalid token), notify AuthContext to log out.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && storage.get(TOKEN_KEY)) {
      window.dispatchEvent(new Event('cems:unauthorized'));
    }
    return Promise.reject(error);
  }
);

/** Pulls a human-readable message out of an Axios error. */
export const errorMessage = (err) =>
  err.response?.data?.message || (err.request ? 'Cannot reach the server. Is the API running?' : err.message);

export default api;
