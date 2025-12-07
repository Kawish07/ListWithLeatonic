// client/src/utils/api.js - UPDATED WITH BETTER DEBUGGING
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For file uploads
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    console.log(`🔵 API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (config.data && !(config.data instanceof FormData)) {
      console.log('Request Data:', config.data);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response [${response.status}]: ${response.config.url}`);
    console.log('Response Data:', response.data);
    
    // Return the full response so components can access status, headers, etc.
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data
    });
    
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized, clearing auth data');
      
      // Clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userType');
      delete api.defaults.headers.common['Authorization'];
      
      // Redirect to login
      if (!window.location.pathname.includes('/signin') && 
          !window.location.pathname.includes('/login') &&
          !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;