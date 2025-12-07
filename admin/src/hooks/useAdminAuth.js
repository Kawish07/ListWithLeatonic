import { useState } from 'react';
import axios from 'axios';

export default function useAdminAuth() {
  const [admin, setAdmin] = useState(null);
  const login = async (email, password) => {
    const res = await axios.post('/api/auth/login', { email, password });
    setAdmin(res.data.user);
    return res.data;
  };
  return { admin, login };
}
