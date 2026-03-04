// Admin Dashboard - Full CRM (Demo Style + All Features)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const D = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type='success') => { setToast({show:true, msg, type}); setTimeout(() => setToast({show:false, msg:'', type:'success'}), 3000); };
  const [dashData, setDashData] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [mainTab, setMainTab] = useState('dashboard');
  const [opFilter, setOpFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [selectedOp, setSelectedOp] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({ role: 'supervisor', email: '', password: '', full_name: '', phone: '', district_id: '' });

  // District detail view
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtOps, setDistrictOps] = useState([]);
  const [districtReports, setDistrictReports] = useState([]);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [dashRes, distRes, opRes] = await Promise.all([
        axios.get(`${API}/admin/dashboard`, getAuth()).catch(() => ({ data: null })),
        axios.get(`${API}/admin/districts`, getAuth()).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/operators`, getAuth()).catch(() => ({ data: [] })),
      ]);
      setDashData(dashRes.data);
      setDistricts(distRes.data || []);
      setOperators(opRes.data?.operators || opRes.data || []);
    } catch (e) {} finally { setLoading(false); }
  };

  const loadOperators = async (districtId) => {
    try {
      const params = districtId ? { district_id: districtId } : {};
      const res = await axios.get(`${API}/admin/operators`, { params, ...getAuth() });
      setOperators(res.data?.operators || res.data || []);
    } catch (e) {}
  };

  const loadUsers = async () => {
    try { const res = await axios.get(`${API}/admin/users`, getAuth()); setUsers(res.data || []); } catch (e) {}
  };

  const loadReports = async () => {
    try {
      let url = `${API}/admin/reports?`;
      if (districtFilter !== 'all') url += `district_id=${districtFilter}&`;
      if (dateFrom) url += `start_date=${dateFrom}&`;
      if (dateTo) url += `end_date=${dateTo}&`;
      const res = await axios.get(url, getAuth());
      setReports(res.data?.reports || []);
    } catch (e) { setReports([]); }
  };

  // ============ DISTRICT DETAIL ============
  const openDistrictDetail = async (dist) => {
    setSelectedDistrict(dist);
    setMainTab('district-detail');
    try {
      const params = { district_id: dist.district_id };
      const res = await axios.get(`${API}/admin/operators`, { params, ...getAuth() });
      setDistrictOps(res.data?.operators || res.data || []);
    } catch (e) { setDistrictOps([]); }
    try {
      let url = `${API}/hq-supervisor/district/${dist.district_id}/reports`;
      if (dateFrom || dateTo) {
        const params = [];
        if (dateFrom) params.push(`start_date=${dateFrom}`);
        if (dateTo) params.push(`end_date=${dateTo}`);
        url += '?' + params.join('&');
      }
      const res = await axios.get(url, getAuth());
      setDistrictReports(res.data?.reports || []);
    } catch (e) { setDistrictReports([]); }
  };

  // ============ OPERATOR DETAIL ============
  const openOperatorDetail = async (opId) => {
    setDetailLoading(true); setShowDetailModal(true);
    try { const res = await axios.get(`${API}/admin/operator/${opId}`, getAuth()); setSelectedOp(res.data); }
    catch (e) { showToast(' ' + (e.response?.data?.detail || 'Error')); setShowDetailModal(false); }
    finally { setDetailLoading(false); }
  };

  const handleApproveDocs = async (opId) => {
    if (!window.confirm('✅ Approve all documents?')) return;
    try { await axios.post(`${API}/admin/operator/${opId}/approve-documents`, {}, getAuth()); showToast(' Documents approved!'); setShowDetailModal(false); loadAll(); } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleRejectDocs = async (opId) => {
    const reason = prompt('❌ Enter rejection reason:'); if (!reason) return;
    try { await axios.post(`${API}/admin/operator/${opId}/reject-documents`, { action: 'reject', rejection_reason: reason }, getAuth()); showToast('Documents rejected.'); setShowDetailModal(false); loadAll(); }
    catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleVerifyPayment = async (opId) => {
    if (!window.confirm('✅ Verify payment? FINAL APPROVAL!')) return;
    try { await axios.post(`${API}/admin/operator/${opId}/verify-payment`, {}, getAuth()); showToast(' Payment verified! Operator approved!'); setShowDetailModal(false); loadAll(); } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleRejectPayment = async (opId) => {
    const reason = prompt('❌ Payment rejection reason:'); if (!reason) return;
    try { await axios.post(`${API}/admin/operator/${opId}/reject-payment`, { action: 'reject', rejection_reason: reason }, getAuth()); showToast('Payment rejected.'); setShowDetailModal(false); loadAll(); }
    catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.password || !newUser.full_name) { showToast('Fill all required fields'); return; }
    if (newUser.role === 'supervisor' && !newUser.district_id) { showToast('Select district for supervisor'); return; }
    try {
      await axios.post(`${API}/admin/create-user`, null, {
        params: { role: newUser.role, email: newUser.email, password: newUser.password, full_name: newUser.full_name, phone: newUser.phone || null, district_id: newUser.role === 'supervisor' ? parseInt(newUser.district_id) : null },
        ...getAuth()
      });
      showToast(' User created!'); setShowCreateModal(false);
      setNewUser({ role: 'supervisor', email: '', password: '', full_name: '', phone: '', district_id: '' });
      loadAll(); loadUsers();
    } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
  };

  // ============ HELPERS ============
  const getStatusBadge = (op) => {
    if (op.final_approved) return { t: '✅ Approved', bg: '#d4edda', c: '#155724' };
    const map = { 'documents_pending': { t: '📄 Docs Pending', bg: '#fff3cd', c: '#856404' }, 'payment_verification': { t: '🔍 Pay Verify', bg: '#e8daef', c: '#6c3483' }, 'payment_pending': { t: '💰 Pay Pending', bg: '#d1ecf1', c: '#0c5460' }, 'documents_upload': { t: '📤 Uploading', bg: '#fce4ec', c: '#c62828' }, 'documents_rejected': { t: '❌ Docs Rejected', bg: '#f8d7da', c: '#721c24' }, 'payment_rejected': { t: '❌ Pay Rejected', bg: '#f8d7da', c: '#721c24' } };
    return map[op.registration_status] || { t: op.registration_status || 'Pending', bg: '#f0f0f0', c: '#666' };
  };

  const getRoleBadge = (role) => ({ 'supervisor': { t: '🏛️ Supervisor', bg: '#e8eaf6', c: '#3f51b5' }, 'central_supervisor': { t: '🏢 Central', bg: '#e0f7fa', c: '#00838f' }, 'hq_supervisor': { t: '🏗️ HQ', bg: '#fce4ec', c: '#c62828' }, 'accountant': { t: '💰 Accountant', bg: '#fff3e0', c: '#e65100' }, 'operator': { t: '👤 Operator', bg: '#e8f5e9', c: '#2e7d32' }, 'admin': { t: '👨‍💼 Admin', bg: '#f3e5f5', c: '#7b1fa2' }, 'owner': { t: '👑 Owner', bg: '#fff8e1', c: '#f57f17' } }[role] || { t: role, bg: '#f0f0f0', c: '#666' });

  const getDocLabel = (type) => ({ 'nsc_certificate': '📜 NSC Certificate', 'pan_card': '💳 PAN Card', 'aadhaar_card': '🆔 Aadhaar Card', 'police_verification': '👮 Police Verification' }[type] || type);

  const pendingDocs = operators.filter(o => o.registration_status === 'documents_pending');
  const pendingPayment = operators.filter(o => o.registration_status === 'payment_verification');
  const approved = operators.filter(o => o.final_approved);
  const districtColors = ['#667eea', '#e74c3c', '#28a745', '#f39c12', '#9b59b6', '#00bcd4', '#e91e63', '#795548', '#2196f3', '#ff5722'];
  const gc = i => districtColors[i % districtColors.length];

  const getFilteredOps = () => {
    let list = operators;
    if (opFilter === 'docs_pending') list = pendingDocs;
    else if (opFilter === 'payment_pending') list = pendingPayment;
    else if (opFilter === 'approved') list = approved;
    if (districtFilter !== 'all') list = list.filter(o => String(o.district_id) === districtFilter || o.district_name === districts.find(d => String(d.district_id) === districtFilter)?.district_name);
    if (searchQuery.trim()) { const q = searchQuery.toLowerCase(); list = list.filter(o => o.full_name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q) || o.district_name?.toLowerCase().includes(q) || o.phone?.includes(q) || o.operator_user_id?.toLowerCase().includes(q)); }
    return list;
  };

  const maxEnroll = Math.max(...districts.map(d => d.total_enrollments_this_month || d.approved_operators || 1), 1);

  if (loading) return <div><Navbar />
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
      {/* Toast Notification */}
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, animation: 'slideIn 0.3s ease', background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}<div style={{ textAlign: 'center', padding: '60px', fontSize: '18px' }}>⏳ Loading Admin Dashboard...</div></div>;

  // Styles
  const thS = { padding: '14px 16px', fontWeight: '600', color: 'white', fontSize: '12px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px', background: '#667eea' };
  const tdS = { padding: '14px 16px', fontSize: '13px', borderBottom: '1px solid #f0f0f0' };
  const inputS = { padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '13px', width: '100%' };
  const card = { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', marginBottom: '25px' };

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '25px 40px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* ====== HEADER ====== */}
        <div style={{ background: 'white', padding: '28px 35px', borderRadius: '15px', marginBottom: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ color: '#333', fontSize: '28px', margin: '0 0 8px', fontWeight: '700' }}>⚙️ Admin Dashboard</h1>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>👤 {user?.full_name} • Complete system overview and management</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={loadAll} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>🔄 Refresh</button>
              <button onClick={() => setShowCreateModal(true)} style={{ padding: '10px 24px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>➕ Create User</button>
            </div>
          </div>
        </div>

        {/* ====== STAT CARDS ====== */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '18px', marginBottom: '25px' }}>
          {[
            { l: 'Active Districts', v: districts.length, c: '#667eea', i: '🏛️', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
            { l: 'Total Operators', v: operators.length, c: '#17a2b8', i: '👥', bg: 'linear-gradient(135deg, #17a2b8, #20c997)' },
            { l: 'Docs Pending', v: pendingDocs.length, c: '#ffc107', i: '📄', bg: 'linear-gradient(135deg, #fd7e14, #ffc107)', click: () => { setMainTab('operators'); setOpFilter('docs_pending'); } },
            { l: 'Payment Verify', v: pendingPayment.length, c: '#6c3483', i: '🔍', bg: 'linear-gradient(135deg, #6c3483, #a569bd)', click: () => { setMainTab('operators'); setOpFilter('payment_pending'); } },
            { l: 'Approved', v: approved.length, c: '#28a745', i: '✅', bg: 'linear-gradient(135deg, #28a745, #20c997)' },
          ].map((s, i) => (
            <div key={i} onClick={s.click} style={{ background: 'white', padding: '22px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '16px', cursor: s.click ? 'pointer' : 'default', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ width: '55px', height: '55px', borderRadius: '14px', background: s.bg, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>{s.i}</div>
              <div><p style={{ color: '#999', fontSize: '13px', margin: '0 0 3px', fontWeight: '500' }}>{s.l}</p><p style={{ color: '#333', fontSize: '28px', fontWeight: '700', margin: 0 }}>{s.v}</p></div>
            </div>
          ))}
        </div>

        {/* ====== TABS ====== */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '25px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {[
            { k: 'dashboard', l: '📊 Dashboard' },
            { k: 'pending', l: `⏳ Pending (${pendingDocs.length + pendingPayment.length})` },
            { k: 'operators', l: '👥 All Operators' },
            { k: 'districts', l: '🏛️ Districts' },
            { k: 'reports', l: '📋 Reports' },
            { k: 'users', l: '🔑 Users' },
          ].map(t => (
            <button key={t.k} onClick={() => { setMainTab(t.k); if (t.k === 'users') loadUsers(); if (t.k === 'reports') loadReports(); if (t.k === 'operators') { setOpFilter('all'); loadOperators(); } setSelectedDistrict(null); }}
              style={{ flex: 1, padding: '15px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', background: (mainTab === t.k || (t.k === 'districts' && mainTab === 'district-detail')) ? '#667eea' : 'transparent', color: (mainTab === t.k || (t.k === 'districts' && mainTab === 'district-detail')) ? 'white' : '#666', borderBottom: mainTab === t.k ? '3px solid #764ba2' : '3px solid transparent' }}>{t.l}</button>
          ))}
        </div>

        {/* ====== FILTER BAR (for operators, reports) ====== */}
        {['operators', 'reports', 'pending'].includes(mainTab) && (
          <div style={{ background: 'white', padding: '18px 25px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', gap: '14px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>🔍 Search</label>
              <input type="text" placeholder="Name, email, phone, operator ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={inputS} />
            </div>
            <div style={{ minWidth: '180px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>🏛️ District</label>
              <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} style={inputS}>
                <option value="all">All Districts</option>
                {districts.map(d => <option key={d.district_id} value={d.district_id}>{d.district_name}</option>)}
              </select>
            </div>
            {mainTab === 'reports' && <>
              <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>📅 From</label><input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputS} /></div>
              <div><label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333', fontSize: '13px' }}>📅 To</label><input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputS} /></div>
              <button onClick={loadReports} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', height: '42px' }}>🔍 Apply</button>
            </>}
            {(districtFilter !== 'all' || searchQuery || dateFrom || dateTo) && <button onClick={() => { setDistrictFilter('all'); setSearchQuery(''); setDateFrom(''); setDateTo(''); }} style={{ padding: '10px 16px', background: '#ffebee', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#c62828', height: '42px' }}>✕ Clear</button>}
          </div>
        )}

        {/* ====== DASHBOARD TAB - Chart + District Cards ====== */}
        {mainTab === 'dashboard' && (
          <div>
            {/* BAR CHART */}
            <div style={card}>
              <div style={{ padding: '25px 30px' }}>
                <h2 style={{ color: '#333', margin: '0 0 20px', fontSize: '20px' }}>📊 District-wise Performance</h2>
                <p style={{ color: '#999', margin: '0 0 20px', fontSize: '13px' }}>Click on any district bar to view detailed operator data</p>
                <div style={{ height: '280px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '10px', padding: '20px 10px 40px', borderBottom: '2px solid #e0e0e0', position: 'relative', overflowX: 'auto' }}>
                  {districts.slice(0, 15).map((d, i) => {
                    const val = d.total_enrollments_this_month || d.approved_operators || 0;
                    const h = Math.max((val / maxEnroll) * 100, 5);
                    return (
                      <div key={d.district_id} onClick={() => openDistrictDetail(d)} style={{ flex: 1, minWidth: '50px', maxWidth: '80px', height: `${h}%`, background: `linear-gradient(135deg, ${gc(i)}, ${gc(i)}99)`, borderRadius: '10px 10px 0 0', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}
                        onMouseOver={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'scaleY(1.03)'; }}
                        onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scaleY(1)'; }}>
                        <span style={{ position: 'absolute', top: '-22px', left: '50%', transform: 'translateX(-50%)', fontSize: '13px', fontWeight: '700', color: '#333' }}>{val}</span>
                        <span style={{ position: 'absolute', bottom: '-30px', left: '50%', transform: 'translateX(-50%)', fontSize: '10px', fontWeight: '600', whiteSpace: 'nowrap', color: '#666' }}>{d.district_name?.substring(0, 8)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DISTRICT CARDS GRID */}
            <div style={card}>
              <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0' }}><h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📍 All Districts Overview</h2></div>
              <div style={{ padding: '20px 25px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '18px' }}>
                  {districts.map((d, i) => (
                    <div key={d.district_id} onClick={() => openDistrictDetail(d)} style={{ background: 'white', padding: '22px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s', borderLeft: `5px solid ${gc(i)}` }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; }}>
                      <h3 style={{ color: gc(i), marginBottom: '14px', fontSize: '18px', fontWeight: '700' }}>{d.district_name} <span style={{ fontSize: '12px', color: '#999' }}>({d.district_code})</span></h3>
                      {[
                        { l: '👥 Operators', v: d.total_operators || 0 },
                        { l: '📊 Approved', v: d.approved_operators || 0 },
                        { l: '⏰ Pending', v: d.pending_operators || 0 },
                        { l: '👤 Supervisor', v: d.admin_name || 'Not Assigned' },
                      ].map((r, j) => (
                        <div key={j} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: j < 3 ? '1px solid #f0f0f0' : 'none' }}>
                          <span style={{ color: '#666', fontSize: '13px' }}>{r.l}</span>
                          <span style={{ color: '#333', fontWeight: '600', fontSize: '13px' }}>{r.v}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* QUICK PENDING APPROVALS */}
            <div style={card}>
              <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📋 Pending Operator Approvals</h2>
                <span style={{ padding: '6px 16px', background: pendingDocs.length + pendingPayment.length > 0 ? '#fff3cd' : '#d4edda', borderRadius: '20px', fontSize: '13px', fontWeight: '600', color: pendingDocs.length + pendingPayment.length > 0 ? '#856404' : '#155724' }}>{pendingDocs.length + pendingPayment.length} pending</span>
              </div>
              {[...pendingDocs, ...pendingPayment].length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}><div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div><p>No pending approvals! All caught up.</p></div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Name', 'Email', 'District', 'Type', 'Status', 'Submitted', 'Actions'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {[...pendingDocs, ...pendingPayment].map((op, idx) => { const b = getStatusBadge(op); return (
                      <tr key={op.operator_id || idx} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}>{idx + 1}</td>
                        <td style={{ ...tdS, fontWeight: '600', color: '#333' }}>{op.full_name}</td>
                        <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.email}</td>
                        <td style={{ ...tdS, color: '#667eea', fontWeight: '600', fontSize: '12px' }}>{op.district_name || '—'}</td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                        <td style={{ ...tdS, color: '#999', fontSize: '12px' }}>{D(op.created_at)}</td>
                        <td style={tdS}>
                          <button onClick={() => openOperatorDetail(op.operator_id)} style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>👁️ Review</button>
                        </td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ====== PENDING TAB ====== */}
        {mainTab === 'pending' && (
          <div style={card}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0' }}><h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>⏳ All Pending — Documents & Payments</h2></div>
            {[...pendingDocs, ...pendingPayment].filter(o => {
              if (districtFilter !== 'all' && String(o.district_id) !== districtFilter) return false;
              if (searchQuery) { const q = searchQuery.toLowerCase(); return o.full_name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q); }
              return true;
            }).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}><div style={{ fontSize: '50px', marginBottom: '10px' }}>🎉</div><p>No pending approvals!</p></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['#', 'Name', 'Email', 'Phone', 'District', 'Op ID', 'Type', 'Status', 'Submitted', 'Action'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {[...pendingDocs, ...pendingPayment].filter(o => {
                    if (districtFilter !== 'all' && String(o.district_id) !== districtFilter) return false;
                    if (searchQuery) { const q = searchQuery.toLowerCase(); return o.full_name?.toLowerCase().includes(q) || o.email?.toLowerCase().includes(q); }
                    return true;
                  }).map((op, idx) => { const b = getStatusBadge(op); return (
                    <tr key={op.operator_id || idx} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdS}>{idx + 1}</td>
                      <td style={{ ...tdS, fontWeight: '600' }}>{op.full_name}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.email}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.phone || '—'}</td>
                      <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{op.district_name || '—'}</td>
                      <td style={{ ...tdS, color: '#333', fontWeight: '700' }}>{op.operator_user_id || '—'}</td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                      <td style={{ ...tdS, color: '#999', fontSize: '12px' }}>{D(op.created_at)}</td>
                      <td style={tdS}><button onClick={() => openOperatorDetail(op.operator_id)} style={{ padding: '8px 18px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>👁️ Review</button></td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ====== ALL OPERATORS TAB ====== */}
        {mainTab === 'operators' && (
          <div style={card}>
            <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
              {[{ k: 'all', l: `All (${operators.length})` }, { k: 'docs_pending', l: `📄 Docs (${pendingDocs.length})` }, { k: 'payment_pending', l: `🔍 Pay (${pendingPayment.length})` }, { k: 'approved', l: `✅ OK (${approved.length})` }].map(t => (
                <button key={t.k} onClick={() => setOpFilter(t.k)} style={{ flex: 1, padding: '14px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: opFilter === t.k ? '#667eea' : 'transparent', color: opFilter === t.k ? 'white' : '#666' }}>{t.l}</button>
              ))}
            </div>
            {getFilteredOps().length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>📭 No operators found</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['#', 'Name', 'Email', 'Phone', 'District', 'Op ID', 'Type', 'Status', 'Registered', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {getFilteredOps().map((op, idx) => { const b = getStatusBadge(op); return (
                    <tr key={op.operator_id || idx} style={{ cursor: 'pointer' }} onClick={() => openOperatorDetail(op.operator_id)} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdS}>{idx + 1}</td>
                      <td style={{ ...tdS, fontWeight: '600' }}>👤 {op.full_name}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.email}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.phone || '—'}</td>
                      <td style={{ ...tdS, color: '#667eea', fontWeight: '600', fontSize: '12px' }}>🏛️ {op.district_name || '—'}</td>
                      <td style={{ ...tdS, fontWeight: '700', color: '#333' }}>{op.operator_user_id || '—'}</td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                      <td style={{ ...tdS, color: '#999', fontSize: '12px' }}>{D(op.created_at)}</td>
                      <td style={tdS}><button onClick={e => { e.stopPropagation(); openOperatorDetail(op.operator_id); }} style={{ padding: '6px 14px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>👁️</button></td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ====== DISTRICTS TAB ====== */}
        {mainTab === 'districts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
            {districts.map((d, i) => (
              <div key={d.district_id} onClick={() => openDistrictDetail(d)} style={{ background: 'white', borderRadius: '15px', padding: '22px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.3s', borderTop: `4px solid ${gc(i)}` }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 5px 20px rgba(0,0,0,0.15)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)'; }}>
                <h3 style={{ color: gc(i), fontSize: '18px', margin: '0 0 6px', fontWeight: '700' }}>{d.district_name}</h3>
                <p style={{ color: '#999', fontSize: '12px', margin: '0 0 14px' }}>{d.district_code} • 👤 {d.admin_name || 'No Supervisor'}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                  {[{ v: d.total_operators || 0, l: 'Total', c: '#667eea', bg: '#eef0fb' }, { v: d.approved_operators || 0, l: 'Approved', c: '#28a745', bg: '#d4edda' }, { v: d.pending_operators || 0, l: 'Pending', c: '#f39c12', bg: '#fff3cd' }].map((s, j) => (
                    <div key={j} style={{ textAlign: 'center', padding: '10px 6px', background: s.bg, borderRadius: '10px' }}>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: s.c, margin: 0 }}>{s.v}</p>
                      <p style={{ fontSize: '9px', color: '#666', margin: '2px 0 0', fontWeight: '600' }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ====== DISTRICT DETAIL VIEW ====== */}
        {mainTab === 'district-detail' && selectedDistrict && (
          <div>
            <button onClick={() => setMainTab('districts')} style={{ padding: '10px 20px', background: '#f0f0f0', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginBottom: '16px' }}>← Back to Districts</button>
            <div style={{ ...card, borderLeft: '5px solid #667eea', padding: '22px 28px', marginBottom: '20px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#333' }}>📍 {selectedDistrict.district_name} <span style={{ fontSize: '14px', color: '#999' }}>({selectedDistrict.district_code})</span></h2>
              <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>👤 Supervisor: <strong>{selectedDistrict.admin_name || 'Not Assigned'}</strong> {selectedDistrict.admin_email ? `(${selectedDistrict.admin_email})` : ''}</p>
            </div>

            <div style={card}>
              <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}><h3 style={{ margin: 0, fontSize: '15px' }}>👥 Operators ({districtOps.length})</h3></div>
              {districtOps.length === 0 ? <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No operators</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Name', 'Email', 'Phone', 'Op ID', 'Type', 'Status', 'Approved', ''].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {districtOps.map((op, i) => { const b = getStatusBadge(op); return (
                      <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}>{i + 1}</td>
                        <td style={{ ...tdS, fontWeight: '600' }}>{op.full_name}</td>
                        <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.email}</td>
                        <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.phone || '—'}</td>
                        <td style={{ ...tdS, fontWeight: '700', color: '#667eea' }}>{op.operator_user_id || '—'}</td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '700', background: op.final_approved ? '#d4edda' : '#f8d7da', color: op.final_approved ? '#155724' : '#721c24' }}>{op.final_approved ? '✅' : '❌'}</span></td>
                        <td style={tdS}><button onClick={() => openOperatorDetail(op.operator_id)} style={{ padding: '6px 14px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>👁️</button></td>
                      </tr>
                    ); })}
                  </tbody>
                </table>
              )}
            </div>

            <div style={card}>
              <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}><h3 style={{ margin: 0, fontSize: '15px' }}>📋 Reports ({districtReports.length})</h3></div>
              {districtReports.length === 0 ? <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No reports</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Operator', 'Op ID', 'Date', 'Enrollments', 'Updates', 'Status', 'Remarks'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {districtReports.slice(0, 100).map((r, i) => (
                      <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}>{i + 1}</td>
                        <td style={{ ...tdS, fontWeight: '600' }}>{r.operator_name}</td>
                        <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{r.operator_user_id || '—'}</td>
                        <td style={{ ...tdS, fontWeight: '600' }}>{D(r.report_date)}</td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#28a745', fontSize: '17px' }}>{r.enrollments_count || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#17a2b8', fontSize: '17px' }}>{r.updates_count || 0}</span></td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: r.review_status === 'approved' ? '#d4edda' : '#fff3cd', color: r.review_status === 'approved' ? '#155724' : '#856404' }}>{r.review_status || 'pending'}</span></td>
                        <td style={{ ...tdS, color: '#888', fontSize: '11px' }}>{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ====== REPORTS TAB ====== */}
        {mainTab === 'reports' && (
          <div style={card}>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}><div style={{ fontSize: '50px', marginBottom: '10px' }}>📋</div><p>Select date range and click Apply to load reports.</p></div>
            ) : (
              <>
                <div style={{ padding: '14px 25px', background: '#e8eaf6', display: 'flex', gap: '24px', fontSize: '14px' }}>
                  <span>📋 Total: <strong>{reports.length}</strong></span>
                  <span>📝 Enrollments: <strong style={{ color: '#28a745' }}>{reports.reduce((s, r) => s + (r.enrollments_count || 0), 0)}</strong></span>
                  <span>🔄 Updates: <strong style={{ color: '#17a2b8' }}>{reports.reduce((s, r) => s + (r.updates_count || 0), 0)}</strong></span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Operator', 'District', 'Date', 'Enrollments', 'Updates', 'Remarks'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {reports.slice(0, 200).map((r, i) => (
                      <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}>{i + 1}</td>
                        <td style={{ ...tdS, fontWeight: '600' }}>👤 {r.operator_name}</td>
                        <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>🏛️ {r.district_name || '—'}</td>
                        <td style={{ ...tdS, fontWeight: '600' }}>{D(r.report_date)}</td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#28a745', fontSize: '17px' }}>{r.enrollments_count || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#17a2b8', fontSize: '17px' }}>{r.updates_count || 0}</span></td>
                        <td style={{ ...tdS, color: '#888', fontSize: '11px' }}>{r.remarks || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ====== USERS TAB ====== */}
        {mainTab === 'users' && (
          <div style={card}>
            <div style={{ padding: '16px 25px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>🔑 All System Users</h3>
              <button onClick={loadUsers} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🔄 Refresh</button>
            </div>
            {users.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Click Refresh to load users</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['#', 'Name', 'Email', 'Phone', 'Role', 'District', 'Active', 'Created'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {users.map((u, idx) => { const rb = getRoleBadge(u.role); return (
                    <tr key={u.id || idx} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdS}>{idx + 1}</td>
                      <td style={{ ...tdS, fontWeight: '600' }}>{u.full_name}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{u.email}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{u.phone || '—'}</td>
                      <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '11px', fontWeight: '600', background: rb.bg, color: rb.c }}>{rb.t}</span></td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{u.district_name || '—'}</td>
                      <td style={tdS}>{u.is_active !== false ? '✅' : '❌'}</td>
                      <td style={{ ...tdS, color: '#999', fontSize: '12px' }}>{D(u.created_at)}</td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ====== OPERATOR DETAIL MODAL ====== */}
        {showDetailModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '20px', maxWidth: '850px', width: '95%', maxHeight: '93vh', overflow: 'auto' }}>
              {detailLoading ? <div style={{ textAlign: 'center', padding: '60px' }}>⏳ Loading...</div> : selectedOp ? (
                <>
                  <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0', color: 'white' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h2 style={{ margin: 0, fontSize: '20px' }}>{selectedOp.full_name}</h2>
                        <p style={{ margin: '4px 0 0', opacity: 0.9, fontSize: '13px' }}>Operator #{selectedOp.operator_id} • {selectedOp.operator_type || 'N/A'} • Step {selectedOp.current_step}/8</p>
                      </div>
                      <button onClick={() => setShowDetailModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                    </div>
                  </div>
                  <div style={{ padding: '22px 28px' }}>
                    <div style={{ padding: '12px 18px', borderRadius: '10px', marginBottom: '20px', fontWeight: '600', fontSize: '14px',
                      background: selectedOp.final_approved ? '#d4edda' : selectedOp.registration_status === 'documents_pending' ? '#fff3cd' : selectedOp.registration_status === 'payment_verification' ? '#e8daef' : '#f8f9fa',
                      color: selectedOp.final_approved ? '#155724' : selectedOp.registration_status === 'documents_pending' ? '#856404' : selectedOp.registration_status === 'payment_verification' ? '#6c3483' : '#333'
                    }}>
                      {selectedOp.final_approved ? '✅ FULLY APPROVED' : selectedOp.registration_status === 'documents_pending' ? '📄 DOCUMENTS PENDING — Review below' : selectedOp.registration_status === 'payment_verification' ? '🔍 PAYMENT VERIFICATION — Check screenshot' : `Status: ${selectedOp.registration_status}`}
                    </div>

                    <h4 style={{ color: '#333', margin: '0 0 12px', fontSize: '15px' }}>👤 Personal Information</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '22px' }}>
                      {[{ l: 'Full Name', v: selectedOp.full_name }, { l: 'Email', v: selectedOp.email }, { l: 'Phone', v: selectedOp.phone || 'N/A' }, { l: 'District', v: selectedOp.district_name || `ID: ${selectedOp.district_id}` }, { l: 'Operator Type', v: selectedOp.operator_type || 'N/A' }, { l: 'Certificate', v: selectedOp.has_certificate ? `✅ ${selectedOp.certificate_number}` : '❌ No' }, { l: 'Status', v: selectedOp.registration_status }, { l: 'Step', v: `${selectedOp.current_step}/8` }, { l: 'Registered', v: D(selectedOp.created_at) }].map((item, i) => (
                        <div key={i} style={{ padding: '10px 12px', background: '#f8f9fa', borderRadius: '8px' }}>
                          <p style={{ fontSize: '10px', color: '#999', margin: '0 0 2px', textTransform: 'uppercase' }}>{item.l}</p>
                          <p style={{ fontWeight: '600', color: '#333', margin: 0, fontSize: '13px', wordBreak: 'break-all' }}>{item.v}</p>
                        </div>
                      ))}
                    </div>

                    <h4 style={{ color: '#333', margin: '0 0 12px', fontSize: '15px', borderTop: '2px solid #f0f0f0', paddingTop: '18px' }}>📄 Documents</h4>
                    {(selectedOp.documents || []).length === 0 ? <p style={{ color: '#999', fontSize: '13px' }}>No documents uploaded</p> : (
                      <div style={{ display: 'grid', gap: '8px', marginBottom: '20px' }}>
                        {selectedOp.documents.map((doc, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 15px', background: '#f8f9fa', borderRadius: '10px', border: doc.status === 'approved' ? '2px solid #28a745' : '2px solid #e0e0e0' }}>
                            <div><p style={{ fontWeight: '600', color: '#333', margin: 0, fontSize: '13px' }}>{getDocLabel(doc.document_type)}</p><p style={{ color: '#667eea', margin: '2px 0 0', fontSize: '12px', fontWeight: '600' }}>{doc.document_number || doc.file_name || 'N/A'}</p></div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: doc.status === 'approved' ? '#d4edda' : doc.status === 'rejected' ? '#f8d7da' : '#fff3cd', color: doc.status === 'approved' ? '#155724' : doc.status === 'rejected' ? '#721c24' : '#856404' }}>{doc.status || 'pending'}</span>
                              {(doc.file_path || doc.file_url) && <a href={`${API_URL}${doc.file_path || doc.file_url}`} target="_blank" rel="noreferrer" style={{ padding: '4px 10px', background: '#667eea', color: 'white', borderRadius: '6px', fontSize: '10px', textDecoration: 'none', fontWeight: '600' }}>📥 View</a>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedOp.payment && (
                      <>
                        <h4 style={{ color: '#333', margin: '0 0 12px', fontSize: '15px', borderTop: '2px solid #f0f0f0', paddingTop: '18px' }}>💰 Payment</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
                          <div style={{ padding: '10px 12px', background: '#f8f9fa', borderRadius: '8px' }}><p style={{ fontSize: '10px', color: '#999', margin: '0 0 2px' }}>AMOUNT</p><p style={{ fontWeight: '700', color: '#28a745', margin: 0, fontSize: '18px' }}>₹{selectedOp.payment.amount?.toLocaleString()}</p></div>
                          <div style={{ padding: '10px 12px', background: '#f8f9fa', borderRadius: '8px' }}><p style={{ fontSize: '10px', color: '#999', margin: '0 0 2px' }}>STATUS</p><p style={{ fontWeight: '600', color: '#333', margin: 0, fontSize: '13px' }}>{selectedOp.payment.payment_status}</p></div>
                          <div style={{ padding: '10px 12px', background: '#f8f9fa', borderRadius: '8px' }}><p style={{ fontSize: '10px', color: '#999', margin: '0 0 2px' }}>TXN ID</p><p style={{ fontWeight: '600', color: '#333', margin: 0, fontSize: '13px' }}>{selectedOp.payment.transaction_id || 'N/A'}</p></div>
                        </div>
                        <div style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                          {selectedOp.payment.qr_code_url && <div style={{ textAlign: 'center' }}><p style={{ fontSize: '11px', color: '#999', margin: '0 0 5px' }}>QR Code</p><img src={`${API_URL}${selectedOp.payment.qr_code_url}`} alt="QR" style={{ width: '120px', border: '1px solid #e0e0e0', borderRadius: '8px' }} onError={e => e.target.style.display = 'none'} /></div>}
                          {selectedOp.payment.payment_screenshot_url && <div style={{ textAlign: 'center' }}><p style={{ fontSize: '11px', color: '#999', margin: '0 0 5px' }}>Screenshot</p><a href={`${API_URL}${selectedOp.payment.payment_screenshot_url}`} target="_blank" rel="noreferrer"><img src={`${API_URL}${selectedOp.payment.payment_screenshot_url}`} alt="SS" style={{ width: '200px', border: '2px solid #667eea', borderRadius: '8px', cursor: 'pointer' }} onError={e => e.target.parentElement.innerHTML = '<span style="color:#999">Not available</span>'} /></a></div>}
                        </div>
                      </>
                    )}

                    {selectedOp.rejection_reason && <div style={{ padding: '10px 14px', background: '#f8d7da', borderRadius: '8px', color: '#721c24', fontSize: '13px', marginBottom: '15px' }}><strong>Rejection:</strong> {selectedOp.rejection_reason}</div>}

                    <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '18px' }}>
                      {selectedOp.registration_status === 'documents_pending' && (
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <button onClick={() => handleApproveDocs(selectedOp.operator_id)} style={{ flex: 1, padding: '13px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>✅ Approve Documents</button>
                          <button onClick={() => handleRejectDocs(selectedOp.operator_id)} style={{ flex: 1, padding: '13px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>❌ Reject Documents</button>
                        </div>
                      )}
                      {selectedOp.registration_status === 'payment_verification' && (
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                          <button onClick={() => handleVerifyPayment(selectedOp.operator_id)} style={{ flex: 1, padding: '13px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>✅ Verify Payment (Final!)</button>
                          <button onClick={() => handleRejectPayment(selectedOp.operator_id)} style={{ flex: 1, padding: '13px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>❌ Reject Payment</button>
                        </div>
                      )}
                      {selectedOp.final_approved && <div style={{ padding: '12px', background: '#d4edda', borderRadius: '10px', textAlign: 'center', color: '#155724', fontWeight: '600', marginBottom: '10px' }}>✅ Operator fully approved and active</div>}
                      <button onClick={() => setShowDetailModal(false)} style={{ width: '100%', padding: '11px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>Close</button>
                    </div>
                  </div>
                </>
              ) : <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>Failed to load</div>}
            </div>
          </div>
        )}

        {/* ====== CREATE USER MODAL ====== */}
        {showCreateModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '20px', maxWidth: '580px', width: '95%', maxHeight: '90vh', overflow: 'auto' }}>
              <div style={{ padding: '22px 28px', background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '20px 20px 0 0', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ margin: 0, fontSize: '20px' }}>➕ Create New User</h2>
                  <button onClick={() => setShowCreateModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '34px', height: '34px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px' }}>✕</button>
                </div>
              </div>
              <form onSubmit={handleCreateUser} style={{ padding: '22px 28px' }}>
                <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Role *</label>
                  <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} style={inputS}>
                    <option value="supervisor">🏛️ District Supervisor</option><option value="central_supervisor">🏢 Central Supervisor</option><option value="hq_supervisor">🏗️ HQ Supervisor</option><option value="accountant">💰 Accountant</option>
                  </select>
                </div>
                <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Full Name *</label><input type="text" value={newUser.full_name} onChange={e => setNewUser({ ...newUser, full_name: e.target.value })} required placeholder="Enter full name" style={inputS} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
                  <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Email *</label><input type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required placeholder="user@clickportal.com" style={inputS} /></div>
                  <div><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Password *</label><input type="password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required minLength="8" placeholder="Min 8 chars" style={inputS} /></div>
                </div>
                <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '13px' }}>Phone</label><input type="tel" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} placeholder="Optional" style={inputS} /></div>
                {newUser.role === 'supervisor' && (
                  <div style={{ marginBottom: '15px' }}><label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', color: '#333', fontSize: '13px' }}>District *</label>
                    <select value={newUser.district_id} onChange={e => setNewUser({ ...newUser, district_id: e.target.value })} required style={inputS}>
                      <option value="">Select District</option>{districts.map(d => <option key={d.district_id} value={d.district_id}>{d.district_name}</option>)}
                    </select>
                  </div>
                )}
                <div style={{ padding: '12px', background: '#e8eaf6', borderRadius: '8px', marginBottom: '15px', fontSize: '12px', color: '#3f51b5' }}><strong>ℹ️</strong> Supervisor = 1 district • Central = UIDAI verify • Accountant = Payments • HQ = Multi-district</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>✅ Create User</button>
                  <button type="button" onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '12px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;