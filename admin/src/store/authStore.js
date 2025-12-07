import { create } from 'zustand';
import axiosLib from 'axios';

const API_URL = 'http://localhost:5000/api';

const axios = axiosLib.create({ baseURL: API_URL });

const useAuthStore = create((set, get) => ({
	user: null,
	token: null,
	isLoading: false,
	error: null,
	isAuthenticated: false,

	initialize: () => {
		const token = localStorage.getItem('admin_token');
		const user = JSON.parse(localStorage.getItem('admin_user') || 'null');
		if (token && user) {
			axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
			set({ user, token, isAuthenticated: true });
			return true;
		}
		return false;
	},

	login: async (email, password) => {
		set({ isLoading: true, error: null });
		try {
			const res = await axios.post('/auth/login', { email, password });
			if (res.data?.success && res.data.token && res.data.user) {
				const { token, user } = res.data;
				if (user.role !== 'admin') {
					set({ isLoading: false, error: 'Not an admin account' });
					return { success: false, message: 'Not an admin account' };
				}

				localStorage.setItem('admin_token', token);
				localStorage.setItem('admin_user', JSON.stringify(user));
				axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

				set({ user, token, isAuthenticated: true, isLoading: false, error: null });
				return { success: true };
			}
			throw new Error(res.data?.message || 'Login failed');
		} catch (err) {
			console.error('Admin login error:', err.response?.data || err.message);
			localStorage.removeItem('admin_token');
			localStorage.removeItem('admin_user');
			delete axios.defaults.headers.common['Authorization'];
			set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: err.response?.data?.message || err.message });
			return { success: false, error: err.response?.data?.message || err.message };
		}
	},

	checkAuth: async () => {
		const token = localStorage.getItem('admin_token');
		if (!token) {
			set({ isAuthenticated: false, user: null });
			return false;
		}
		set({ isLoading: true });
		try {
			const res = await axios.get('/auth/verify', { headers: { Authorization: `Bearer ${token}` } });
			if (res.data?.success && res.data.user && res.data.user.role === 'admin') {
				const user = res.data.user;
				localStorage.setItem('admin_user', JSON.stringify(user));
				set({ user, isAuthenticated: true, isLoading: false });
				return true;
			}
		} catch (err) {
			console.error('Admin checkAuth failed:', err.response?.data || err.message);
		}
		localStorage.removeItem('admin_token');
		localStorage.removeItem('admin_user');
		delete axios.defaults.headers.common['Authorization'];
		set({ user: null, token: null, isAuthenticated: false, isLoading: false });
		return false;
	},

	logout: () => {
		localStorage.removeItem('admin_token');
		localStorage.removeItem('admin_user');
		delete axios.defaults.headers.common['Authorization'];
		set({ user: null, token: null, isAuthenticated: false, error: null });
		window.location.href = '/signin';
	}
}));

export default useAuthStore;
