// client/src/store/authStore.js - FIXED VERSION
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from '../utils/api';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      userType: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,

      // Initialize from localStorage on mount
      initialize: () => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const userType = localStorage.getItem('userType');
        
        if (token && user) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({
            user,
            token,
            userType,
            isAuthenticated: true
          });
          return true;
        }
        return false;
      },

      // Login for both users and clients - FIXED VERSION
      login: async (email, password, userType = 'user') => {
        set({ isLoading: true, error: null });
        
        try {
          console.log(`Attempting ${userType} login for:`, email);
          
          const endpoint = userType === 'client' ? '/client-auth/login' : '/auth/login';
          const response = await axios.post(endpoint, {
            email,
            password
          });
          
          console.log(`${userType} login response:`, response.data);
          
          if (response.data.success && response.data.token) {
            const { token, user, userType: responseUserType } = response.data;
            
            // ⚠️ CRITICAL FIX: Save to localStorage FIRST
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('userType', responseUserType || userType);
            
            // Then set axios headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            // Then update Zustand state
            set({
              user,
              token,
              userType: responseUserType || userType,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return { success: true, userType: responseUserType || userType };
          } else {
            throw new Error(response.data.message || 'Login failed');
          }
        } catch (error) {
          console.error('Login error:', error.response?.data || error.message);
          
          const errorMessage = error.response?.data?.message || 
                              error.message || 
                              'Login failed. Please check your credentials.';
          
          // Clear any existing data on error
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          delete axios.defaults.headers.common['Authorization'];
          
          set({
            isLoading: false,
            error: errorMessage,
            user: null,
            token: null,
            userType: null,
            isAuthenticated: false
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Register for both users and clients - FIXED VERSION
      register: async (userData, userType = 'user') => {
        set({ isLoading: true, error: null });
        
        try {
          const endpoint = userType === 'client' ? '/client-auth/register' : '/auth/register';
          const response = await axios.post(endpoint, userData);
          
          if (response.data.success) {
            const { token, user, userType: responseUserType } = response.data;
            
            // Save to localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('userType', responseUserType || userType);
            
            // Set axios headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            
            set({
              user,
              token,
              userType: responseUserType || userType,
              isAuthenticated: true,
              isLoading: false,
              error: null
            });
            
            return { success: true, userType: responseUserType || userType };
          } else {
            throw new Error(response.data.message || 'Registration failed');
          }
        } catch (error) {
          const errorMessage = error.response?.data?.message || 
                              error.message || 
                              'Registration failed.';
          
          set({
            isLoading: false,
            error: errorMessage
          });
          
          return { success: false, error: errorMessage };
        }
      },

      // Check authentication for both types
      checkAuth: async () => {
        const token = localStorage.getItem('token');
        const userType = localStorage.getItem('userType');
        
        if (!token || !userType) {
          set({ isAuthenticated: false, user: null, userType: null });
          return false;
        }
        
        set({ isLoading: true });
        
        try {
          const endpoint = userType === 'client' ? '/client-auth/verify' : '/auth/verify';
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            const userData = response.data.user;
            
            // Update localStorage with fresh user data
            localStorage.setItem('user', JSON.stringify(userData));
            
            set({
              user: userData,
              userType: userType,
              token: token,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          } else {
            throw new Error('Token verification failed');
          }
        } catch (error) {
          console.error('Auth check error:', error);
          
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('userType');
          delete axios.defaults.headers.common['Authorization'];
          
          set({
            user: null,
            token: null,
            userType: null,
            isAuthenticated: false,
            isLoading: false
          });
          
          return false;
        }
      },

      logout: () => {
        // Clear localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('userType');
        
        // Clear axios headers
        delete axios.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          userType: null,
          isAuthenticated: false,
          error: null
        });
        
        // Redirect to home page
        window.location.href = '/';
      },

      clearError: () => set({ error: null }),

      updateUser: (userData) => {
        const currentUser = get().user;
        const updatedUser = { ...currentUser, ...userData };
        
        // Also update localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        set({ 
          user: updatedUser,
          token: userData.token || get().token
        });
        
        return updatedUser;
      },

      refreshUser: async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) return null;
          
          const userType = get().userType;
          const endpoint = userType === 'client' ? '/client-auth/verify' : '/auth/verify';
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          if (response.data.success) {
            const userData = response.data.user;
            
            // Update localStorage
            localStorage.setItem('user', JSON.stringify(userData));
            
            set({ user: userData });
            return userData;
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
        }
        return null;
      },

      // Get user type
      getUserType: () => get().userType,
      
      // Check if user is client
      isClient: () => get().userType === 'client',
      
      // Check if user is regular user
      isRegularUser: () => get().userType === 'user',
      
      // Check if user is admin (regular user with admin role)
      isAdmin: () => {
        const { userType, user } = get();
        return userType === 'user' && user?.role === 'admin';
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        userType: state.userType,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);

export default useAuthStore;