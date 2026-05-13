import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Create an axios instance with base configuration
export const api = axios.create({
  baseURL: 'http://localhost:4000',
  withCredentials: true, // Crucial for sending/receiving cookies (sessions)
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is logged in on mount
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const res = await api.get('/api/me');
      setUser(res.data);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/local/login', { email, password });
    setUser(res.data.user);
    return res.data;
  };

  const signup = async (name, email, password) => {
    const res = await api.post('/auth/local/signup', { name, email, password });
    setUser(res.data.user);
    return res.data;
  };

  const logout = async () => {
    try {
      await api.get('/auth/logout');
    } catch (err) {
      console.error("Logout request failed", err);
    } finally {
      setUser(null);
      window.location.href = '/auth';
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
