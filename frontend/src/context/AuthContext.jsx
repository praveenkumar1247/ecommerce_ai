import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('ecom_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ecom_token') || null);
  const [loading, setLoading] = useState(true);

  const { success, error: toastError } = useToast();

  const fetchCurrentUser = useCallback(async () => {
    const savedToken = localStorage.getItem('ecom_token');
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const res = await authApi.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('ecom_user', JSON.stringify(res.data));
      }
    } catch (err) {
      console.warn('Session expired or invalid:', err.message);
      setUser(null);
      setToken(null);
      localStorage.removeItem('ecom_token');
      localStorage.removeItem('ecom_user');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  const login = async (credentials) => {
    try {
      const res = await authApi.login(credentials);
      if (res.success) {
        const { user: userData, token: jwtToken } = res.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('ecom_token', jwtToken);
        localStorage.setItem('ecom_user', JSON.stringify(userData));
        success(`Welcome back, ${userData.fullName}!`);
        return { success: true, user: userData };
      }
    } catch (err) {
      toastError(err.message || 'Login failed.');
      return { success: false, error: err.message };
    }
  };

  const register = async (data) => {
    try {
      const res = await authApi.register(data);
      if (res.success) {
        const { user: userData, token: jwtToken } = res.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('ecom_token', jwtToken);
        localStorage.setItem('ecom_user', JSON.stringify(userData));
        success(`Account created successfully! Welcome, ${userData.fullName}.`);
        return { success: true, user: userData };
      }
    } catch (err) {
      toastError(err.message || 'Registration failed.');
      return { success: false, error: err.message };
    }
  };

  const adminLogin = async (credentials) => {
    try {
      const res = await authApi.adminLogin(credentials);
      if (res.success) {
        const { user: userData, token: jwtToken } = res.data;
        setUser(userData);
        setToken(jwtToken);
        localStorage.setItem('ecom_token', jwtToken);
        localStorage.setItem('ecom_user', JSON.stringify(userData));
        success(`Admin authentication confirmed. Welcome, ${userData.fullName}.`);
        return { success: true, user: userData };
      }
    } catch (err) {
      toastError(err.message || 'Admin authentication failed.');
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('ecom_token');
    localStorage.removeItem('ecom_user');
    setUser(null);
    setToken(null);
    success('Logged out successfully.');
  };

  const updateProfile = async (data) => {
    try {
      const res = await authApi.updateProfile(data);
      if (res.success) {
        setUser(res.data);
        localStorage.setItem('ecom_user', JSON.stringify(res.data));
        success('Profile updated successfully.');
        return { success: true, user: res.data };
      }
    } catch (err) {
      toastError(err.message || 'Failed to update profile.');
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(user && token),
    isAdmin: Boolean(user && user.role === 'ADMIN'),
    login,
    register,
    adminLogin,
    logout,
    updateProfile,
    refreshUser: fetchCurrentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
