import { useState } from 'react';
import axios from 'axios';

export default function useAuth() {
  const [user, setUser] = useState(null);
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    setUser(res.data.user);
    return res.data;
  };
  const register = async (form) => {
    const res = await axios.post('/api/auth/register', form);
    setUser(res.data);
    return res.data;
  };
  return { user, login, register };
}
