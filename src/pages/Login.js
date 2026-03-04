import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import '../styles/main.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const Login = () => {
  const [mode, setMode] = useState('login'); // login, register, changePassword
  const [step, setStep] = useState(1);
  const [districts, setDistricts] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '', email: '', password: '', confirm_password: '',
    full_name: '', phone: '', district_id: '',
    aadhaar_number: '', pan_number: '',
    state: 'Rajasthan', block: '', gram_panchayat: '',
    current_password: '', new_password: '', confirm_new_password: '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => { loadDistricts(); }, []);

  const loadDistricts = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/v1/auth/districts`);
      setDistricts(res.data);
    } catch (e) { console.log('Districts not loaded'); }
  };

  const validateAadhaar = (v) => /^\d{12}$/.test(v);
  const validatePAN = (v) => /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v.toUpperCase());
  const validatePhone = (v) => /^[6-9]\d{9}$/.test(v);
  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'pan_number') value = value.toUpperCase();
    if (name === 'aadhaar_number' || name === 'phone') value = value.replace(/\D/g, '');
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
    setError('');
  };

  const validateStep1 = () => {
    const e = {};
    if (!formData.full_name.trim()) e.full_name = 'Name required';
    if (!validatePhone(formData.phone)) e.phone = 'Valid 10-digit phone (starts 6-9)';
    if (!validateEmail(formData.email)) e.email = 'Valid email required';
    if (!formData.district_id) e.district_id = 'Select district';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!validateAadhaar(formData.aadhaar_number)) e.aadhaar_number = 'Valid 12-digit Aadhaar';
    if (!validatePAN(formData.pan_number)) e.pan_number = 'Format: ABCDE1234F';
    if (formData.password.length < 8) e.password = 'Min 8 characters';
    if (formData.password !== formData.confirm_password) e.confirm_password = 'Passwords not matching';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const identifier = formData.user_id.trim();
      if (!identifier) { setError('Enter User ID or Email'); setLoading(false); return; }
      const result = await login(identifier, formData.password);
      if (result.success) {
        if (result.must_change_password) { setMode('changePassword'); setLoading(false); return; }
        const routes = { operator: '/operator/dashboard', admin: '/admin/dashboard', owner: '/owner/dashboard', supervisor: '/supervisor/dashboard', hq_supervisor: '/hq-supervisor/dashboard', central_supervisor: '/central-dashboard', accountant: '/accountant/dashboard' };
        navigate(routes[result.role] || '/');
      } else { setError(result.error || 'Invalid credentials'); }
    } catch (err) { setError(err?.response?.data?.detail || 'Login failed'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (formData.new_password.length < 8) { setError('New password min 8 characters'); return; }
    if (formData.new_password !== formData.confirm_new_password) { setError('Passwords not matching'); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const fd = new URLSearchParams();
      fd.append('current_password', formData.current_password);
      fd.append('new_password', formData.new_password);
      await axios.post(`${API_URL}/api/v1/auth/change-password`, fd, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Bearer ${token}` }
      });
      setSuccess('Password changed! Please login with new password.');
      localStorage.removeItem('token'); localStorage.removeItem('user');
      setTimeout(() => { setMode('login'); setSuccess(''); }, 2000);
    } catch (err) { setError(err?.response?.data?.detail || 'Failed to change password'); }
    finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); if (!validateStep2()) return;
    setError(''); setLoading(true);
    try {
      await axios.post(`${API_URL}/api/v1/auth/register`, new URLSearchParams({
        email: formData.email, password: formData.password, full_name: formData.full_name,
        phone: formData.phone, district_id: formData.district_id,
        aadhaar_number: formData.aadhaar_number, pan_number: formData.pan_number,
        state: formData.state, block: formData.block, gram_panchayat: formData.gram_panchayat,
      }), { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
      setSuccess('Registration successful! Login with your email and password to continue registration.');
      setStep(1);
    } catch (err) { setError(err?.response?.data?.detail || 'Registration failed'); }
    finally { setLoading(false); }
  };

  const inp = (f) => ({ width: '100%', padding: '12px 16px', border: `2px solid ${errors[f] ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', background: '#f8fafc', fontFamily: 'inherit' });
  const lbl = { display: 'block', marginBottom: '5px', fontSize: '13px', fontWeight: '600', color: '#374151' };
  const btnStyle = { width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', color: 'white', border: 'none', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)', padding: '20px' }}>
      <div style={{ background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '22px', color: 'white', fontWeight: 'bold' }}>CE</div>
          <h1 style={{ fontSize: '22px', color: '#1e293b', margin: '0 0 4px' }}>
            {mode === 'login' ? 'Welcome Back' : mode === 'register' ? 'Register as Operator' : 'Change Password'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
            {mode === 'login' ? 'Login with your User ID' : mode === 'register' && !success ? `Step ${step} of 2` : mode === 'changePassword' ? 'Set your new password' : ''}
          </p>
        </div>

        {success && (
          <div style={{ background: '#f0fdf4', border: '2px solid #22c55e', borderRadius: '12px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>✅</div>
            <h3 style={{ color: '#166534', margin: '0 0 6px', fontSize: '16px' }}>{mode === 'register' ? 'Application Submitted!' : 'Success!'}</h3>
            <p style={{ color: '#15803d', fontSize: '13px', margin: 0 }}>{success}</p>
            {mode === 'register' && <button onClick={() => { setSuccess(''); setMode('login'); }} style={{ marginTop: '12px', padding: '8px 24px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>Go to Login</button>}
          </div>
        )}

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', color: '#dc2626', fontSize: '13px' }}>⚠️ {error}</div>}

        {/* ====== LOGIN ====== */}
        {mode === 'login' && !success && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>User ID or Email *</label>
              <input type="text" name="user_id" value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} required placeholder="DGOP1234 or email@example.com" style={inp('user_id')} />
              <p style={{ color: '#94a3b8', fontSize: '11px', margin: '4px 0 0' }}>Enter your email or Operator User ID</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={lbl}>Password *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="Enter password" style={inp('password')} />
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? '⏳ Logging in...' : 'Login'}</button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '13px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('changePassword'); setError(''); }} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>🔒 Change Password</a>
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); setError(''); setStep(1); }} style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>📝 Register</a>
            </div>
          </form>
        )}

        {/* ====== CHANGE PASSWORD ====== */}
        {mode === 'changePassword' && !success && (
          <form onSubmit={handleChangePassword}>
            <div style={{ background: '#eff6ff', border: '1px solid #93c5fd', borderRadius: '10px', padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#1e40af' }}>
              💡 Login first, then change your password here. If you have a temporary password, change it for security.
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>User ID or Email *</label>
              <input type="text" value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} placeholder="DGOP1234 or email" style={inp('user_id')} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Current Password *</label>
              <input type="password" name="current_password" value={formData.current_password} onChange={handleChange} required placeholder="Enter current password" style={inp('current_password')} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>New Password * (min 8 chars)</label>
              <input type="password" name="new_password" value={formData.new_password} onChange={handleChange} required placeholder="Enter new password" style={inp('new_password')} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={lbl}>Confirm New Password *</label>
              <input type="password" name="confirm_new_password" value={formData.confirm_new_password} onChange={handleChange} required placeholder="Confirm new password" style={inp('confirm_new_password')} />
            </div>
            <button type="submit" disabled={loading} style={btnStyle}>{loading ? '⏳ Changing...' : 'Change Password'}</button>
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError(''); }} style={{ color: '#2563eb', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>← Back to Login</a>
            </div>
          </form>
        )}

        {/* ====== REGISTER STEP 1 ====== */}
        {mode === 'register' && !success && step === 1 && (
          <form onSubmit={(e) => { e.preventDefault(); if (validateStep1()) setStep(2); }}>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Full Name *</label>
              <input type="text" name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Enter full name" style={inp('full_name')} />
              {errors.full_name && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.full_name}</span>}
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Phone (10 digits) *</label>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} maxLength={10} placeholder="9876543210" style={inp('phone')} />
              {errors.phone && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.phone}</span>}
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Email *</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="email@example.com" style={inp('email')} />
              {errors.email && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.email}</span>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div><label style={lbl}>State</label><input name="state" value={formData.state} onChange={handleChange} style={inp('state')} /></div>
              <div><label style={lbl}>District *</label>
                <select name="district_id" value={formData.district_id} onChange={handleChange} style={inp('district_id')}>
                  <option value="">Select</option>{districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>{errors.district_id && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.district_id}</span>}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '18px' }}>
              <div><label style={lbl}>Block</label><input name="block" value={formData.block} onChange={handleChange} placeholder="Block" style={inp('block')} /></div>
              <div><label style={lbl}>Gram Panchayat</label><input name="gram_panchayat" value={formData.gram_panchayat} onChange={handleChange} placeholder="Optional" style={inp('gram_panchayat')} /></div>
            </div>
            <button type="submit" style={btnStyle}>Next → Documents & Password</button>
            <div style={{ textAlign: 'center', marginTop: '14px' }}><a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setError(''); setErrors({}); }} style={{ color: '#2563eb', fontSize: '13px', textDecoration: 'none', fontWeight: '500' }}>← Back to Login</a></div>
          </form>
        )}

        {/* ====== REGISTER STEP 2 ====== */}
        {mode === 'register' && !success && step === 2 && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Aadhaar Number (12 digits) *</label>
              <input name="aadhaar_number" value={formData.aadhaar_number} onChange={handleChange} maxLength={12} placeholder="123456789012" style={inp('aadhaar_number')} />
              {errors.aadhaar_number && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.aadhaar_number}</span>}
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>PAN Number *</label>
              <input name="pan_number" value={formData.pan_number} onChange={handleChange} maxLength={10} placeholder="ABCDE1234F" style={inp('pan_number')} />
              {errors.pan_number && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.pan_number}</span>}
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={lbl}>Password (min 8 chars) *</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" style={inp('password')} />
              {errors.password && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.password}</span>}
            </div>
            <div style={{ marginBottom: '18px' }}>
              <label style={lbl}>Confirm Password *</label>
              <input type="password" name="confirm_password" value={formData.confirm_password} onChange={handleChange} placeholder="Confirm" style={inp('confirm_password')} />
              {errors.confirm_password && <span style={{ color: '#ef4444', fontSize: '12px' }}>{errors.confirm_password}</span>}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={() => setStep(1)} style={{ flex: 1, padding: '14px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '12px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>← Back</button>
              <button type="submit" disabled={loading} style={{ ...btnStyle, flex: 2 }}>{loading ? '⏳ Submitting...' : 'Submit Application'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;