import React, { createContext, useState, useEffect, useContext, useCallback, useRef } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const retryCountRef = useRef(0);

  const checkAuth = useCallback(async () => {
    if (window.location.hash?.includes('session_id=')) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API}/auth/me`, {
        withCredentials: true,
        timeout: 10000
      });
      const userData = response.data;
      // Ensure is_owner is always set
      if (userData.is_owner === undefined) {
        userData.is_owner = (userData.email || '').toLowerCase() === 'aaronbugge@gmail.com';
      }
      setUser(userData);
      retryCountRef.current = 0;
    } catch (error) {
      if (error.code === 'ECONNABORTED' || error.message === 'Network Error' || !error.response) {
        if (retryCountRef.current < 3) {
          retryCountRef.current++;
          setTimeout(() => checkAuth(), 2000);
          return;
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await axios.post(`${API}/auth/login`, { email, password }, {
      withCredentials: true
    });
    const userData = response.data;
    if (userData.is_owner === undefined) {
      userData.is_owner = (userData.email || '').toLowerCase() === 'aaronbugge@gmail.com';
    }
    setUser(userData);
    return userData;
  };

  const register = async (email, password, name) => {
    const response = await axios.post(`${API}/auth/register`, { email, password, name }, {
      withCredentials: true
    });
    localStorage.setItem('simplifii_new_user', 'true');
    setUser(response.data);
    return response.data;
  };

  const logout = async () => {
    await axios.post(`${API}/auth/logout`, {}, { withCredentials: true });
    setUser(null);
  };

  const updateCredits = (newCredits) => {
    if (user) {
      setUser({ ...user, credits: newCredits });
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, checkAuth, updateCredits }}>
      {children}
    </AuthContext.Provider>
  );
};
