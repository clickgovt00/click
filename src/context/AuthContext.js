import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser && storedUser !== 'undefined' && token) {
      try { setUser(JSON.parse(storedUser)); }
      catch (e) { localStorage.removeItem('user'); localStorage.removeItem('token'); }
    }
    setLoading(false);
  }, [token]);

  const login = async (username, password) => {
    try {
      const result = await authAPI.login(username, password);
      if (!result.access_token || !result.user) throw new Error('Invalid response');

      setUser(result.user);
      setToken(result.access_token);
      localStorage.setItem('token', result.access_token);
      localStorage.setItem('user', JSON.stringify(result.user));

      return {
        success: true,
        role: result.user.role,
        must_change_password: result.must_change_password,
        ...result
      };
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Login failed';
      return { success: false, error: errorMessage };
    }
  };

  const register = async (data) => {
    try {
      await authAPI.register(data);
      return { success: true };
    } catch (err) {
      const detail = err.response?.data?.detail;
      let errorMessage = 'Registration failed';
      if (typeof detail === 'string') errorMessage = detail;
      else if (Array.isArray(detail)) errorMessage = detail.map(e => e.msg).join(', ');
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    setUser(null); setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  if (loading) return (
    <div className="loading-container">
      <div className="spinner"></div>
      <p style={{color: '#64748b'}}>Loading...</p>
    </div>
  );

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
