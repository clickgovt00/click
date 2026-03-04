// HQ Supervisor Dashboard - Multi-District CRM with Date Range & Operator Names
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

const HQSupervisorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type='success') => { setToast({show:true, msg, type}); setTimeout(() => setToast({show:false, msg:'', type:'success'}), 3000); };
  const [dashData, setDashData] = useState(null);
  const [districts, setDistricts] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [period, setPeriod] = useState('this_month');
  const [mainView, setMainView] = useState('overview');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtOperators, setDistrictOperators] = useState([]);
  const [districtReports, setDistrictReports] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [centralUploads, setCentralUploads] = useState([]);

  // Filters
  const [districtFilter, setDistrictFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Quick date helpers
  const todayStr = new Date().toISOString().split('T')[0];
  const getMonthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]; };
  const getWeekStart = () => { const d = new Date(); d.setDate(d.getDate() - 7); return d.toISOString().split('T')[0]; };

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadComparison(); }, [period, dateFrom, dateTo, districtFilter]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadDash(), loadDistricts(), loadComparison(), loadCentralUploads()]);
    setLoading(false);
  };

  const loadDash = async () => {
    try { const r = await axios.get(`${API}/hq-supervisor/dashboard`, getAuth()); setDashData(r.data); } catch (e) {}
  };
  const loadDistricts = async () => {
    try { const r = await axios.get(`${API}/hq-supervisor/districts`, getAuth()); setDistricts(Array.isArray(r.data) ? r.data : []); } catch (e) { setDistricts([]); }
  };
  const loadComparison = async () => {
    try {
      let url = `${API}/hq-supervisor/comparison?period=${period}`;
      if (dateFrom) url += `&start_date=${dateFrom}`;
      if (dateTo) url += `&end_date=${dateTo}`;
      if (districtFilter !== 'all') url += `&district_id=${districtFilter}`;
      const r = await axios.get(url, getAuth());
      setComparison(r.data);
    } catch (e) {}
  };
  const loadCentralUploads = async () => {
    try { const r = await axios.get(`${API}/central-supervisor/uploads`, getAuth()); setCentralUploads(r.data?.uploads || []); } catch (e) { setCentralUploads([]); }
  };

  const openDistrictDetail = async (district) => {
    setSelectedDistrict(district);
    setMainView('district-detail');
    setLoadingDetail(true);
    try {
      const r = await axios.get(`${API}/hq-supervisor/district/${district.district_id}/operators`, getAuth());
      setDistrictOperators(r.data?.operators || []);
    } catch (e) { setDistrictOperators([]); }
    await loadDistrictReports(district.district_id);
    setLoadingDetail(false);
  };

  const loadDistrictReports = async (distId) => {
    try {
      let url = `${API}/hq-supervisor/district/${distId || selectedDistrict?.district_id}/reports`;
      const params = [];
      if (dateFrom) params.push(`start_date=${dateFrom}`);
      if (dateTo) params.push(`end_date=${dateTo}`);
      if (params.length) url += '?' + params.join('&');
      const r = await axios.get(url, getAuth());
      setDistrictReports(r.data?.reports || []);
    } catch (e) { setDistrictReports([]); }
  };

  // Reload reports when date changes in detail view
  const applyDateFilter = () => {
    if (selectedDistrict) loadDistrictReports(selectedDistrict.district_id);
  };

  const D = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
  const districtColors = ['#667eea', '#e74c3c', '#28a745', '#f39c12', '#9b59b6', '#00bcd4', '#e91e63', '#795548', '#2196f3', '#ff5722'];
  const getDistColor = (i) => districtColors[i % districtColors.length];

  const filteredDistricts = districts.filter(d => districtFilter === 'all' || d.district_id === parseInt(districtFilter));
  const filteredUploads = centralUploads.filter(u => {
    if (districtFilter !== 'all' && String(u.district_id || u.district_name) !== districtFilter && u.district_id !== parseInt(districtFilter)) return false;
    if (dateFrom && u.upload_date < dateFrom) return false;
    if (dateTo && u.upload_date > dateTo) return false;
    return true;
  });

  if (loading) return (<div><Navbar />
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
      {/* Toast Notification */}
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, animation: 'slideIn 0.3s ease', background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}<div style={{ textAlign: 'center', padding: '60px', fontSize: '18px' }}>⏳ Loading HQ Dashboard...</div></div>);

  const card = { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };
  const thS = { padding: '12px 16px', fontWeight: '600', color: '#555', fontSize: '11px', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.5px' };
  const tdS = { padding: '12px 16px', fontSize: '13px' };
  const inputS = { padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '12px', fontWeight: '500' };
  const btnS = (active) => ({ padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: active ? '#1a237e' : 'white', color: active ? 'white' : '#666', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', transition: 'all 0.15s' });

  const maxEnroll = Math.max(...(comparison?.districts || []).map(d => d.total_enrollments || 0), 1);
  const maxUpdate = Math.max(...(comparison?.districts || []).map(d => d.total_updates || 0), 1);

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '25px 40px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 50%, #3949ab 100%)', padding: '24px 30px', borderRadius: '16px', marginBottom: '22px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '150px', height: '150px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: '700' }}>🏛️ HQ Supervisor — Command Center</h1>
              <div style={{ display: 'flex', gap: '24px', opacity: 0.9, fontSize: '13px' }}>
                <span>👤 {dashData?.supervisor_name || user?.full_name || '—'}</span>
                <span>📧 {dashData?.supervisor_email || user?.email || '—'}</span>
                <span>🏢 <strong>Headquarters — All Districts</strong></span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span style={{ padding: '8px 20px', background: 'rgba(255,255,255,0.15)', borderRadius: '25px', fontWeight: '600', fontSize: '13px' }}>🔭 HQ Supervisor</span>
              <button onClick={loadAll} style={{ padding: '8px 16px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '12px' }}>🔄 Refresh</button>
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '12px', marginBottom: '22px' }}>
          {[
            { l: 'Districts', v: dashData?.assigned_districts || 0, c: '#1a237e', bg: 'linear-gradient(135deg, #e8eaf6, #c5cae9)' },
            { l: 'Total Operators', v: dashData?.total_operators || 0, c: '#667eea', bg: 'linear-gradient(135deg, #e3f2fd, #bbdefb)' },
            { l: 'Active Ops', v: dashData?.approved_operators || 0, c: '#28a745', bg: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)' },
            { l: 'Pending', v: dashData?.pending_approvals || 0, c: '#f39c12', bg: 'linear-gradient(135deg, #fff8e1, #ffecb3)' },
            { l: 'Today Reports', v: dashData?.today_reports_submitted || 0, c: '#17a2b8', bg: 'linear-gradient(135deg, #e0f7fa, #b2ebf2)' },
            { l: 'Today Enrolls', v: dashData?.today_enrollments || 0, c: '#e74c3c', bg: 'linear-gradient(135deg, #fce4ec, #f8bbd0)' },
            { l: 'Today Updates', v: dashData?.today_updates || 0, c: '#9b59b6', bg: 'linear-gradient(135deg, #f3e5f5, #e1bee7)' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, padding: '16px', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <p style={{ color: '#777', fontSize: '10px', margin: '0 0 4px', fontWeight: '600', textTransform: 'uppercase' }}>{s.l}</p>
              <p style={{ fontSize: '28px', fontWeight: '800', color: s.c, margin: 0 }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* GLOBAL FILTERS + DATE RANGE */}
        <div style={{ background: 'white', padding: '14px 20px', borderRadius: '12px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: '700', color: '#1a237e', fontSize: '13px' }}>🔍 Filters:</span>
          <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)} style={{ ...inputS, minWidth: '160px' }}>
            <option value="all">🏛️ All Districts</option>
            {districts.map(d => <option key={d.district_id} value={d.district_id}>{d.district_name}</option>)}
          </select>
          <div style={{ height: '24px', width: '1px', background: '#e0e0e0' }} />
          <span style={{ fontSize: '12px', color: '#888', fontWeight: '600' }}>📅 Date Range:</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={inputS} />
          <span style={{ color: '#ccc' }}>→</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={inputS} />
          <div style={{ height: '24px', width: '1px', background: '#e0e0e0' }} />
          <button onClick={() => { setDateFrom(todayStr); setDateTo(todayStr); }} style={btnS(dateFrom === todayStr && dateTo === todayStr)}>Today</button>
          <button onClick={() => { setDateFrom(getWeekStart()); setDateTo(todayStr); }} style={btnS(dateFrom === getWeekStart())}>This Week</button>
          <button onClick={() => { setDateFrom(getMonthStart()); setDateTo(todayStr); }} style={btnS(dateFrom === getMonthStart())}>This Month</button>
          {(districtFilter !== 'all' || dateFrom || dateTo) && (
            <button onClick={() => { setDistrictFilter('all'); setDateFrom(''); setDateTo(''); }} style={{ padding: '8px 14px', background: '#ffebee', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px', fontWeight: '700', color: '#c62828' }}>✕ Clear All</button>
          )}
          {selectedDistrict && mainView === 'district-detail' && (dateFrom || dateTo) && (
            <button onClick={applyDateFilter} style={{ padding: '8px 16px', background: '#1a237e', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: 'white' }}>🔍 Apply to Reports</button>
          )}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { k: 'overview', l: '🏛️ Districts Overview' },
            { k: 'comparison', l: '📊 Performance Ranking' },
            { k: 'uploads', l: `📤 Central Uploads (${filteredUploads.length})` },
          ].map(t => (
            <button key={t.k} onClick={() => { setMainView(t.k); setSelectedDistrict(null); }} style={{
              padding: '12px 24px', border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
              background: (mainView === t.k || (t.k === 'overview' && mainView === 'district-detail')) ? 'linear-gradient(135deg, #1a237e, #3949ab)' : 'white',
              color: (mainView === t.k || (t.k === 'overview' && mainView === 'district-detail')) ? 'white' : '#555',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>{t.l}</button>
          ))}
          {selectedDistrict && mainView === 'district-detail' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
              <span style={{ color: '#bbb' }}>›</span>
              <span style={{ padding: '10px 18px', background: '#e8eaf6', color: '#1a237e', borderRadius: '12px', fontWeight: '700', fontSize: '13px' }}>🏛️ {selectedDistrict.district_name}</span>
              <button onClick={() => setMainView('overview')} style={{ padding: '8px 14px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>✕ Back</button>
            </div>
          )}
        </div>

        {/* ===== DISTRICTS OVERVIEW ===== */}
        {mainView === 'overview' && (
          <div>
            {filteredDistricts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '15px', color: '#999' }}>🏛️ No districts found</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '16px' }}>
                {filteredDistricts.map((d, i) => {
                  const c = getDistColor(i);
                  const latestUpload = centralUploads.find(u => u.district_name === d.district_name);
                  return (
                    <div key={d.district_id} onClick={() => openDistrictDetail(d)} style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 3px 15px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.2s', borderTop: `4px solid ${c}` }}
                      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
                      onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 3px 15px rgba(0,0,0,0.08)'; }}>

                      <div style={{ padding: '18px 20px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ margin: '0 0 4px', fontSize: '18px', fontWeight: '700', color: '#333' }}>🏛️ {d.district_name}</h3>
                          <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>👤 {d.admin_name || 'No Supervisor'}</p>
                        </div>
                        <span style={{ padding: '4px 12px', background: `${c}15`, color: c, borderRadius: '20px', fontSize: '11px', fontWeight: '700' }}>{d.district_code}</span>
                      </div>

                      <div style={{ padding: '0 20px 12px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                        {[
                          { v: d.total_operators, l: 'Operators', c: '#667eea' },
                          { v: d.approved_operators, l: 'Active', c: '#28a745' },
                          { v: d.operators_reported_today, l: 'Reported', c: '#17a2b8' },
                          { v: d.pending_document_approval + d.pending_payment_verification, l: 'Pending', c: '#f39c12' },
                        ].map((s, j) => (
                          <div key={j} style={{ textAlign: 'center', padding: '8px 4px', background: '#f8f9fa', borderRadius: '10px' }}>
                            <p style={{ fontSize: '20px', fontWeight: '800', color: s.c, margin: 0 }}>{s.v}</p>
                            <p style={{ fontSize: '9px', color: '#999', margin: '2px 0 0', fontWeight: '600', textTransform: 'uppercase' }}>{s.l}</p>
                          </div>
                        ))}
                      </div>

                      <div style={{ padding: '10px 20px', background: '#f8f9fa', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', gap: '16px' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <span style={{ fontSize: '10px', color: '#888' }}>Today Enrolls</span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#28a745' }}>{d.total_enrollments_today}</span>
                            </div>
                            <div style={{ height: '6px', background: '#e8e8e8', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min((d.total_enrollments_today / Math.max(d.total_enrollments_this_month || 1, 1)) * 100, 100)}%`, background: 'linear-gradient(90deg, #28a745, #20c997)', borderRadius: '3px' }} />
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <span style={{ fontSize: '10px', color: '#888' }}>Today Updates</span>
                              <span style={{ fontSize: '12px', fontWeight: '700', color: '#17a2b8' }}>{d.total_updates_today}</span>
                            </div>
                            <div style={{ height: '6px', background: '#e8e8e8', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${Math.min((d.total_updates_today / Math.max(d.total_updates_this_month || 1, 1)) * 100, 100)}%`, background: 'linear-gradient(90deg, #17a2b8, #0dcaf0)', borderRadius: '3px' }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div style={{ padding: '10px 20px 14px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '11px', color: '#999' }}>📊 This Month</span>
                        <div style={{ display: 'flex', gap: '14px' }}>
                          <span style={{ fontSize: '12px' }}><strong style={{ color: '#28a745' }}>{d.total_enrollments_this_month}</strong> <span style={{ color: '#999', fontSize: '10px' }}>enrolls</span></span>
                          <span style={{ fontSize: '12px' }}><strong style={{ color: '#17a2b8' }}>{d.total_updates_this_month}</strong> <span style={{ color: '#999', fontSize: '10px' }}>updates</span></span>
                        </div>
                      </div>

                      {latestUpload && (
                        <div style={{ padding: '8px 20px 14px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '11px', color: '#666' }}>📤 Upload: {D(latestUpload.upload_date)}</span>
                          <span style={{ padding: '2px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                            background: latestUpload.status === 'verified' ? '#d4edda' : latestUpload.status === 'pending' ? '#fff3cd' : '#f8d7da',
                            color: latestUpload.status === 'verified' ? '#155724' : latestUpload.status === 'pending' ? '#856404' : '#721c24',
                          }}>{latestUpload.status === 'verified' ? '✅ Verified' : latestUpload.status === 'pending' ? '⏳ Pending' : '❌ Rejected'}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== PERFORMANCE COMPARISON ===== */}
        {mainView === 'comparison' && (
          <div style={card}>
            <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>📊 District Performance Ranking {comparison?.start_date && comparison?.end_date ? <span style={{fontSize:'12px',color:'#888',fontWeight:'400'}}> — {comparison.start_date} to {comparison.end_date}</span> : ''}</h3>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ k: 'today', l: '📅 Today' }, { k: 'this_week', l: '📅 Week' }, { k: 'this_month', l: '📅 Month' }].map(p => (
                  <button key={p.k} onClick={() => setPeriod(p.k)} style={btnS(period === p.k)}>{p.l}</button>
                ))}
              </div>
            </div>

            {(!comparison?.districts || comparison.districts.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>No data</div>
            ) : (
              <div style={{ padding: '20px 24px' }}>
                {/* Enrollments Bar */}
                <h4 style={{ margin: '0 0 16px', color: '#555', fontSize: '14px' }}>📝 Enrollments Ranking</h4>
                {comparison.districts.map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : getDistColor(i), color: i < 3 ? '#333' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</span>
                    <span style={{ width: '150px', fontSize: '13px', fontWeight: '600', color: '#333', flexShrink: 0 }}>{d.district_name}</span>
                    <div style={{ flex: 1, height: '30px', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max((d.total_enrollments / maxEnroll) * 100, 3)}%`, background: `linear-gradient(90deg, ${getDistColor(i)}, ${getDistColor(i)}99)`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px', transition: 'width 0.5s' }}>
                        <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{d.total_enrollments}</span>
                      </div>
                    </div>
                    <span style={{ fontSize: '11px', color: '#999', width: '80px', textAlign: 'right' }}>{d.operators_reported}/{d.total_operators || '?'} ops</span>
                  </div>
                ))}

                {/* Updates Bar */}
                <h4 style={{ margin: '28px 0 16px', color: '#555', fontSize: '14px' }}>🔄 Updates Ranking</h4>
                {[...comparison.districts].sort((a, b) => b.total_updates - a.total_updates).map((d, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: '#17a2b8', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ width: '150px', fontSize: '13px', fontWeight: '600', color: '#333', flexShrink: 0 }}>{d.district_name}</span>
                    <div style={{ flex: 1, height: '30px', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.max((d.total_updates / maxUpdate) * 100, 3)}%`, background: 'linear-gradient(90deg, #17a2b8, #0dcaf0)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: '10px', transition: 'width 0.5s' }}>
                        <span style={{ color: 'white', fontSize: '13px', fontWeight: '700' }}>{d.total_updates}</span>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Full Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '24px' }}>
                  <thead><tr style={{ background: '#f8f9fa' }}>
                    {['#', 'District', 'Code', 'Total Ops', 'Active Ops', 'Reported', 'Enrollments', 'Updates', 'Total Output'].map(h => <th key={h} style={thS}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {comparison.districts.map((d, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseOver={e => e.currentTarget.style.background = '#f8f9ff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}><span style={{ width: '28px', height: '28px', borderRadius: '50%', background: getDistColor(i), color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700' }}>#{i + 1}</span></td>
                        <td style={{ ...tdS, fontWeight: '700', color: '#333', fontSize: '14px' }}>🏛️ {d.district_name}</td>
                        <td style={{ ...tdS, color: '#1a237e', fontWeight: '600' }}>{d.district_code || '—'}</td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#667eea', fontSize: '15px' }}>{d.total_operators || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#28a745', fontSize: '15px' }}>{d.approved_operators || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#9b59b6', fontSize: '15px' }}>{d.operators_reported || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#28a745', fontSize: '18px' }}>{d.total_enrollments}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#17a2b8', fontSize: '18px' }}>{d.total_updates}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#e74c3c', fontSize: '18px' }}>{d.total_output || ((d.total_enrollments || 0) + (d.total_updates || 0))}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== CENTRAL UPLOADS ===== */}
        {mainView === 'uploads' && (
          <div style={card}>
            <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: '#333' }}>📤 Central Upload Status</h3>
            </div>
            {filteredUploads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>📭 No uploads found</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8f9fa' }}>
                  {['#', 'District', 'Supervisor', 'Date', 'Operators', 'Enrollments', 'Updates', 'Status', 'Uploaded'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredUploads.map((u, i) => {
                    const st = u.status === 'verified' ? { t: '✅ Verified', bg: '#d4edda', c: '#155724' } : u.status === 'pending' ? { t: '⏳ Pending', bg: '#fff3cd', c: '#856404' } : { t: '❌ Rejected', bg: '#f8d7da', c: '#721c24' };
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseOver={e => e.currentTarget.style.background = '#f8f9ff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                        <td style={{ ...tdS, fontWeight: '700', color: '#1a237e' }}>🏛️ {u.district_name}</td>
                        <td style={{ ...tdS, fontWeight: '600', color: '#333' }}>{u.supervisor_name}</td>
                        <td style={{ ...tdS, fontWeight: '600' }}>{D(u.upload_date)}</td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#667eea', fontSize: '15px' }}>{u.total_operators}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>{u.total_enrollments}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#17a2b8', fontSize: '16px' }}>{u.total_updates}</span></td>
                        <td style={tdS}><span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: st.bg, color: st.c }}>{st.t}</span></td>
                        <td style={{ ...tdS, color: '#999', fontSize: '11px' }}>{D(u.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== DISTRICT DETAIL ===== */}
        {mainView === 'district-detail' && selectedDistrict && (
          <div>
            {loadingDetail ? <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>⏳ Loading...</div> : (
              <div>
                {/* Summary Card */}
                <div style={{ background: 'white', padding: '22px 28px', borderRadius: '14px', marginBottom: '16px', boxShadow: '0 3px 15px rgba(0,0,0,0.08)', borderLeft: '5px solid #1a237e' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                    <div>
                      <h2 style={{ margin: '0 0 6px', color: '#333', fontSize: '22px', fontWeight: '700' }}>🏛️ {selectedDistrict.district_name}</h2>
                      <div style={{ display: 'flex', gap: '20px', fontSize: '13px' }}>
                        <span style={{ color: '#666' }}>👤 Supervisor: <strong>{selectedDistrict.admin_name}</strong></span>
                        <span style={{ color: '#1a237e', fontWeight: '600' }}>{selectedDistrict.district_code}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      {[
                        { v: selectedDistrict.total_operators, l: 'Operators', c: '#667eea', bg: '#eef0fb' },
                        { v: selectedDistrict.approved_operators, l: 'Active', c: '#28a745', bg: '#d4edda' },
                        { v: selectedDistrict.pending_document_approval, l: 'Doc Pending', c: '#f39c12', bg: '#fff3cd' },
                        { v: selectedDistrict.pending_payment_verification, l: 'Pay Pending', c: '#e74c3c', bg: '#fce4ec' },
                        { v: selectedDistrict.total_enrollments_today, l: 'Today Enrolls', c: '#28a745', bg: '#e8f5e9' },
                        { v: selectedDistrict.total_enrollments_this_month, l: 'Month Enrolls', c: '#9b59b6', bg: '#f3e5f5' },
                      ].map((s, j) => (
                        <div key={j} style={{ textAlign: 'center', padding: '10px 14px', background: s.bg, borderRadius: '12px', minWidth: '75px' }}>
                          <p style={{ fontSize: '22px', fontWeight: '800', color: s.c, margin: 0 }}>{s.v}</p>
                          <p style={{ fontSize: '9px', color: '#666', margin: '2px 0 0', fontWeight: '600' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Operators */}
                <div style={{ ...card, marginBottom: '16px' }}>
                  <div style={{ padding: '14px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>👥 Operators ({districtOperators.length})</h4>
                  </div>
                  {districtOperators.length === 0 ? <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No operators in this district</div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: '#f8f9fa' }}>
                        {['#', 'Operator Name', 'Email', 'Phone', 'Operator ID', 'Type', 'Status', 'Approved'].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {districtOperators.map((op, i) => (
                          <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseOver={e => e.currentTarget.style.background = '#f8f9ff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                            <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                            <td style={{ ...tdS, fontWeight: '700', color: '#333', fontSize: '13px' }}>👤 {op.full_name}</td>
                            <td style={{ ...tdS, color: '#666' }}>{op.email}</td>
                            <td style={{ ...tdS, color: '#666' }}>{op.phone || '—'}</td>
                            <td style={{ ...tdS, color: '#667eea', fontWeight: '700', fontSize: '13px' }}>{op.operator_user_id || '—'}</td>
                            <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td>
                            <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600',
                              background: op.registration_status === 'approved' ? '#d4edda' : op.registration_status === 'documents_pending' ? '#fff3cd' : '#e3f2fd',
                              color: op.registration_status === 'approved' ? '#155724' : op.registration_status === 'documents_pending' ? '#856404' : '#0d47a1',
                            }}>{op.registration_status}</span></td>
                            <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '700', background: op.final_approved ? '#d4edda' : '#f8d7da', color: op.final_approved ? '#155724' : '#721c24' }}>{op.final_approved ? '✅ Approved' : '❌ Pending'}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                {/* Reports with Date Info */}
                <div style={card}>
                  <div style={{ padding: '14px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>📋 Daily Reports ({districtReports.length})</h4>
                    {(dateFrom || dateTo) && <span style={{ fontSize: '11px', color: '#1a237e', fontWeight: '600' }}>📅 {dateFrom || '...'} → {dateTo || '...'}</span>}
                  </div>
                  {districtReports.length === 0 ? <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No reports found {(dateFrom || dateTo) ? 'for selected date range' : ''}</div> : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: '#f8f9fa' }}>
                        {['#', 'Operator Name', 'Operator ID', 'Report Date', 'Enrollments', 'Updates', 'Review', 'Remarks'].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {districtReports.slice(0, 100).map((r, i) => {
                          const st = r.review_status === 'approved' ? { t: '✅ OK', bg: '#d4edda', c: '#155724' } : r.review_status === 'rejected' ? { t: '❌ Not OK', bg: '#f8d7da', c: '#721c24' } : { t: '⏳ Pending', bg: '#fff3cd', c: '#856404' };
                          return (
                            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseOver={e => e.currentTarget.style.background = '#f8f9ff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                              <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                              <td style={{ ...tdS, fontWeight: '700', color: '#333', fontSize: '13px' }}>👤 {r.operator_name}</td>
                              <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{r.operator_user_id || '—'}</td>
                              <td style={{ ...tdS, fontWeight: '600', color: '#333' }}>{D(r.report_date)}</td>
                              <td style={tdS}><span style={{ fontWeight: '800', color: '#28a745', fontSize: '17px' }}>{r.enrollments_count || 0}</span></td>
                              <td style={tdS}><span style={{ fontWeight: '800', color: '#17a2b8', fontSize: '17px' }}>{r.updates_count || 0}</span></td>
                              <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '600', background: st.bg, color: st.c }}>{st.t}</span></td>
                              <td style={{ ...tdS, color: '#888', fontSize: '11px', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.remarks || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HQSupervisorDashboard;