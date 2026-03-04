// Owner Dashboard - Supreme Analytics & Overview (👑 Super Admin)
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
const D = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type='success') => { setToast({show:true, msg, type}); setTimeout(() => setToast({show:false, msg:'', type:'success'}), 3000); };
  const [districts, setDistricts] = useState([]);
  const [operators, setOperators] = useState([]);
  const [users, setUsers] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [mainTab, setMainTab] = useState('analytics');
  const [period, setPeriod] = useState('this_month');
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [districtOps, setDistrictOps] = useState([]);
  const [districtReports, setDistrictReports] = useState([]);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadComparison(); }, [period]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [distRes, opRes, compRes] = await Promise.all([
        axios.get(`${API}/admin/districts`, getAuth()).catch(() => ({ data: [] })),
        axios.get(`${API}/admin/operators`, getAuth()).catch(() => ({ data: [] })),
        axios.get(`${API}/hq-supervisor/comparison?period=${period}`, getAuth()).catch(() => ({ data: null })),
      ]);
      setDistricts(distRes.data || []);
      setOperators(opRes.data?.operators || opRes.data || []);
      setComparison(compRes.data);
    } catch (e) {} finally { setLoading(false); }
  };

  const loadComparison = async () => {
    try { const r = await axios.get(`${API}/hq-supervisor/comparison?period=${period}`, getAuth()); setComparison(r.data); } catch (e) {}
  };

  const loadUsers = async () => {
    try { const r = await axios.get(`${API}/admin/users`, getAuth()); setUsers(r.data || []); } catch (e) {}
  };

  const openDistrict = async (dist) => {
    setSelectedDistrict(dist); setMainTab('district-detail');
    try { const r = await axios.get(`${API}/admin/operators`, { params: { district_id: dist.district_id }, ...getAuth() }); setDistrictOps(r.data?.operators || r.data || []); } catch (e) { setDistrictOps([]); }
    try { const r = await axios.get(`${API}/hq-supervisor/district/${dist.district_id}/reports`, getAuth()); setDistrictReports(r.data?.reports || []); } catch (e) { setDistrictReports([]); }
  };

  // Stats
  const totalOps = operators.length;
  const approvedOps = operators.filter(o => o.final_approved).length;
  const pendingOps = operators.filter(o => !o.final_approved).length;
  const docsPending = operators.filter(o => o.registration_status === 'documents_pending').length;
  const payPending = operators.filter(o => o.registration_status === 'payment_verification').length;

  const compDistricts = comparison?.districts || [];
  const totalEnrolls = compDistricts.reduce((s, d) => s + (d.total_enrollments || 0), 0);
  const totalUpdates = compDistricts.reduce((s, d) => s + (d.total_updates || 0), 0);
  const totalOutput = totalEnrolls + totalUpdates;

  const maxEnroll = Math.max(...compDistricts.map(d => d.total_enrollments || 0), 1);
  const maxUpdate = Math.max(...compDistricts.map(d => d.total_updates || 0), 1);
  const maxOutput = Math.max(...compDistricts.map(d => (d.total_enrollments || 0) + (d.total_updates || 0)), 1);

  const colors = ['#667eea', '#e74c3c', '#28a745', '#f39c12', '#9b59b6', '#00bcd4', '#e91e63', '#795548', '#2196f3', '#ff5722', '#4caf50', '#ff9800'];
  const gc = i => colors[i % colors.length];

  // Pie chart SVG
  const PieChart = ({ data, size = 200 }) => {
    const total = data.reduce((s, d) => s + d.v, 0) || 1;
    let cum = 0;
    const slices = data.map((d, i) => {
      const start = cum / total * 360;
      cum += d.v;
      const end = cum / total * 360;
      const large = end - start > 180 ? 1 : 0;
      const r = size / 2 - 5;
      const cx = size / 2, cy = size / 2;
      const x1 = cx + r * Math.cos((start - 90) * Math.PI / 180);
      const y1 = cy + r * Math.sin((start - 90) * Math.PI / 180);
      const x2 = cx + r * Math.cos((end - 90) * Math.PI / 180);
      const y2 = cy + r * Math.sin((end - 90) * Math.PI / 180);
      return <path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={d.c} opacity="0.85" />;
    });
    return <svg width={size} height={size}>{slices}</svg>;
  };

  if (loading) return <div><Navbar />
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
      {/* Toast Notification */}
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, animation: 'slideIn 0.3s ease', background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}<div style={{ textAlign: 'center', padding: '60px', fontSize: '18px' }}>⏳ Loading Owner Dashboard...</div></div>;

  const thS = { padding: '14px 16px', fontWeight: '600', color: 'white', fontSize: '12px', textAlign: 'left', textTransform: 'uppercase', background: 'linear-gradient(135deg, #1a1a2e, #16213e)' };
  const tdS = { padding: '14px 16px', fontSize: '13px', borderBottom: '1px solid #f0f0f0' };
  const card = { background: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', marginBottom: '22px' };

  return (
    <div style={{ background: 'linear-gradient(180deg, #0f0c29 0%, #1a1a2e 5%, #f0f2f5 15%)', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '25px 40px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', padding: '28px 35px', borderRadius: '18px', marginBottom: '25px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '200px', height: '200px', background: 'rgba(255,215,0,0.08)', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '100px', width: '120px', height: '120px', background: 'rgba(255,215,0,0.05)', borderRadius: '50%' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div>
              <h1 style={{ margin: '0 0 8px', fontSize: '28px', fontWeight: '700' }}>👑 Owner Dashboard</h1>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>👤 {user?.full_name} • High-level analytics & complete system overview</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ padding: '8px 22px', background: 'linear-gradient(135deg, #ffd700, #ffb347)', borderRadius: '25px', fontWeight: '700', fontSize: '13px', color: '#1a1a2e' }}>👑 OWNER</span>
              <button onClick={loadAll} style={{ padding: '10px 18px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '10px', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>🔄 Refresh</button>
            </div>
          </div>
        </div>

        {/* STAT CARDS - Row 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '14px', marginBottom: '22px' }}>
          {[
            { l: 'Active Districts', v: districts.length, i: '🏛️', bg: 'linear-gradient(135deg, #667eea, #764ba2)' },
            { l: 'Total Operators', v: totalOps, i: '👥', bg: 'linear-gradient(135deg, #17a2b8, #20c997)' },
            { l: 'Approved', v: approvedOps, i: '✅', bg: 'linear-gradient(135deg, #28a745, #20c997)' },
            { l: 'Pending', v: pendingOps, i: '⏳', bg: 'linear-gradient(135deg, #fd7e14, #ffc107)' },
            { l: 'Month Enrollments', v: totalEnrolls, i: '📝', bg: 'linear-gradient(135deg, #e74c3c, #c0392b)' },
            { l: 'Month Updates', v: totalUpdates, i: '🔄', bg: 'linear-gradient(135deg, #9b59b6, #8e44ad)' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, padding: '20px', borderRadius: '16px', color: 'white', boxShadow: '0 4px 15px rgba(0,0,0,0.15)', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div style={{ fontSize: '26px', marginBottom: '6px' }}>{s.i}</div>
              <p style={{ fontSize: '30px', fontWeight: '800', margin: '0 0 2px' }}>{s.v}</p>
              <p style={{ fontSize: '11px', opacity: 0.85, margin: 0, fontWeight: '600' }}>{s.l}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '0', marginBottom: '22px', background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          {[
            { k: 'analytics', l: '📊 Analytics' },
            { k: 'districts', l: '🏛️ Districts' },
            { k: 'performance', l: '🏆 Ranking' },
            { k: 'operators', l: '👥 Operators' },
            { k: 'users', l: '🔑 Users' },
          ].map(t => (
            <button key={t.k} onClick={() => { setMainTab(t.k); setSelectedDistrict(null); if (t.k === 'users') loadUsers(); }}
              style={{ flex: 1, padding: '15px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'all 0.2s',
                background: (mainTab === t.k || (t.k === 'districts' && mainTab === 'district-detail')) ? 'linear-gradient(135deg, #0f0c29, #302b63)' : 'transparent',
                color: (mainTab === t.k || (t.k === 'districts' && mainTab === 'district-detail')) ? 'white' : '#666' }}>{t.l}</button>
          ))}
        </div>

        {/* ======== ANALYTICS TAB ======== */}
        {mainTab === 'analytics' && (
          <div>
            {/* Period Selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
              {[{ k: 'today', l: '📅 Today' }, { k: 'this_week', l: '📅 This Week' }, { k: 'this_month', l: '📅 This Month' }].map(p => (
                <button key={p.k} onClick={() => setPeriod(p.k)} style={{ padding: '10px 22px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', background: period === p.k ? 'linear-gradient(135deg, #0f0c29, #302b63)' : 'white', color: period === p.k ? 'white' : '#666', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>{p.l}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '22px', marginBottom: '22px' }}>
              {/* BAR CHART - Enrollments */}
              <div style={card}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📈 District-wise Enrollments</h2>
                </div>
                <div style={{ padding: '20px 25px' }}>
                  <div style={{ height: '280px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px', padding: '20px 5px 40px', borderBottom: '2px solid #e0e0e0', overflowX: 'auto' }}>
                    {compDistricts.slice(0, 15).map((d, i) => {
                      const h = Math.max((d.total_enrollments / maxEnroll) * 100, 5);
                      return (
                        <div key={i} style={{ flex: 1, minWidth: '40px', maxWidth: '70px', height: `${h}%`, background: `linear-gradient(180deg, ${gc(i)}, ${gc(i)}88)`, borderRadius: '8px 8px 0 0', cursor: 'pointer', position: 'relative', transition: 'all 0.3s' }}
                          onClick={() => { const dist = districts.find(dd => dd.district_name === d.district_name); if (dist) openDistrict(dist); }}
                          onMouseOver={e => e.currentTarget.style.opacity = '0.7'} onMouseOut={e => e.currentTarget.style.opacity = '1'}>
                          <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: '700', color: '#333' }}>{d.total_enrollments}</span>
                          <span style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: '600', whiteSpace: 'nowrap', color: '#888' }}>{d.district_name?.substring(0, 7)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* PIE CHART + Summary */}
              <div style={card}>
                <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0' }}>
                  <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🥧 Output Distribution</h2>
                </div>
                <div style={{ padding: '20px 25px', textAlign: 'center' }}>
                  <PieChart data={[
                    { v: totalEnrolls, c: '#28a745' },
                    { v: totalUpdates, c: '#17a2b8' },
                  ]} size={160} />
                  <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#28a745' }} /><span style={{ fontSize: '12px', color: '#666' }}>Enrollments ({totalEnrolls})</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#17a2b8' }} /><span style={{ fontSize: '12px', color: '#666' }}>Updates ({totalUpdates})</span></div>
                  </div>
                  <div style={{ marginTop: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '12px' }}>
                    <p style={{ fontSize: '11px', color: '#999', margin: '0 0 4px', fontWeight: '600' }}>TOTAL OUTPUT</p>
                    <p style={{ fontSize: '36px', fontWeight: '800', color: '#1a1a2e', margin: 0 }}>{totalOutput}</p>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px' }}>
                    <div style={{ padding: '10px', background: '#d4edda', borderRadius: '10px' }}><p style={{ fontSize: '9px', color: '#155724', margin: '0 0 2px', fontWeight: '600' }}>OPERATORS</p><p style={{ fontSize: '20px', fontWeight: '800', color: '#155724', margin: 0 }}>{approvedOps}/{totalOps}</p></div>
                    <div style={{ padding: '10px', background: '#fff3cd', borderRadius: '10px' }}><p style={{ fontSize: '9px', color: '#856404', margin: '0 0 2px', fontWeight: '600' }}>PENDING</p><p style={{ fontSize: '20px', fontWeight: '800', color: '#856404', margin: 0 }}>{docsPending + payPending}</p></div>
                  </div>
                </div>
              </div>
            </div>

            {/* BAR CHART - Updates */}
            <div style={card}>
              <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🔄 District-wise Updates</h2>
              </div>
              <div style={{ padding: '20px 25px' }}>
                <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', gap: '8px', padding: '20px 5px 40px', borderBottom: '2px solid #e0e0e0', overflowX: 'auto' }}>
                  {[...compDistricts].sort((a, b) => b.total_updates - a.total_updates).slice(0, 15).map((d, i) => {
                    const h = Math.max((d.total_updates / maxUpdate) * 100, 5);
                    return (
                      <div key={i} style={{ flex: 1, minWidth: '40px', maxWidth: '70px', height: `${h}%`, background: 'linear-gradient(180deg, #17a2b8, #17a2b888)', borderRadius: '8px 8px 0 0', position: 'relative' }}>
                        <span style={{ position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)', fontSize: '12px', fontWeight: '700', color: '#333' }}>{d.total_updates}</span>
                        <span style={{ position: 'absolute', bottom: '-28px', left: '50%', transform: 'translateX(-50%)', fontSize: '9px', fontWeight: '600', whiteSpace: 'nowrap', color: '#888' }}>{d.district_name?.substring(0, 7)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* COMBINED OUTPUT BAR */}
            <div style={card}>
              <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0' }}>
                <h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>🏆 Total Output (Enrollments + Updates)</h2>
              </div>
              <div style={{ padding: '20px 25px' }}>
                {[...compDistricts].sort((a, b) => ((b.total_enrollments||0)+(b.total_updates||0)) - ((a.total_enrollments||0)+(a.total_updates||0))).slice(0, 12).map((d, i) => {
                  const out = (d.total_enrollments || 0) + (d.total_updates || 0);
                  const ew = (d.total_enrollments / Math.max(out, 1)) * 100;
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : gc(i), color: i < 3 ? '#333' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', flexShrink: 0 }}>{i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</span>
                      <span style={{ width: '130px', fontSize: '13px', fontWeight: '600', color: '#333', flexShrink: 0 }}>{d.district_name}</span>
                      <div style={{ flex: 1, height: '28px', background: '#f0f0f0', borderRadius: '8px', overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(d.total_enrollments / maxOutput) * 100}%`, height: '100%', background: '#28a745', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {d.total_enrollments > 0 && <span style={{ color: 'white', fontSize: '10px', fontWeight: '700' }}>{d.total_enrollments}E</span>}
                        </div>
                        <div style={{ width: `${(d.total_updates / maxOutput) * 100}%`, height: '100%', background: '#17a2b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {d.total_updates > 0 && <span style={{ color: 'white', fontSize: '10px', fontWeight: '700' }}>{d.total_updates}U</span>}
                        </div>
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: '800', color: '#1a1a2e', width: '50px', textAlign: 'right' }}>{out}</span>
                    </div>
                  );
                })}
                <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#28a745' }} /><span style={{ fontSize: '12px', color: '#666' }}>Enrollments</span></div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><div style={{ width: '14px', height: '14px', borderRadius: '3px', background: '#17a2b8' }} /><span style={{ fontSize: '12px', color: '#666' }}>Updates</span></div>
                </div>
              </div>
            </div>

            {/* SUMMARY TABLE */}
            <div style={card}>
              <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0' }}><h2 style={{ margin: 0, fontSize: '18px', color: '#333' }}>📊 District Summary Table</h2></div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr>{['#', 'District', 'Operators', 'Enrollments', 'Updates', 'Total', 'Reported', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                <tbody>
                  {compDistricts.map((d, i) => {
                    const dist = districts.find(dd => dd.district_name === d.district_name);
                    return (
                      <tr key={i} style={{ cursor: 'pointer' }} onClick={() => dist && openDistrict(dist)} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}><span style={{ width: '26px', height: '26px', borderRadius: '50%', background: gc(i), color: 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700' }}>{i + 1}</span></td>
                        <td style={{ ...tdS, fontWeight: '700', color: '#333', fontSize: '14px' }}>🏛️ {d.district_name}</td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#667eea' }}>{dist?.total_operators || d.total_operators || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#28a745', fontSize: '17px' }}>{d.total_enrollments}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#17a2b8', fontSize: '17px' }}>{d.total_updates}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '800', color: '#e74c3c', fontSize: '17px' }}>{(d.total_enrollments||0)+(d.total_updates||0)}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#9b59b6' }}>{d.operators_reported || 0}</span></td>
                        <td style={tdS}><span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#d4edda', color: '#155724' }}>Active</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======== DISTRICTS TAB ======== */}
        {mainTab === 'districts' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '18px' }}>
            {districts.map((d, i) => (
              <div key={d.district_id} onClick={() => openDistrict(d)} style={{ background: 'white', borderRadius: '16px', padding: '22px', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'all 0.3s', borderTop: `4px solid ${gc(i)}` }}
                onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.08)'; }}>
                <h3 style={{ color: gc(i), fontSize: '18px', margin: '0 0 4px', fontWeight: '700' }}>{d.district_name}</h3>
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

        {/* ======== PERFORMANCE/RANKING TAB ======== */}
        {mainTab === 'performance' && (
          <div style={card}>
            <div style={{ padding: '20px 25px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px' }}>🏆 District Performance Ranking</h2>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[{ k: 'today', l: 'Today' }, { k: 'this_week', l: 'Week' }, { k: 'this_month', l: 'Month' }].map(p => (
                  <button key={p.k} onClick={() => setPeriod(p.k)} style={{ padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px', background: period === p.k ? '#1a1a2e' : '#f0f0f0', color: period === p.k ? 'white' : '#666' }}>{p.l}</button>
                ))}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['Rank', 'District', 'Operators', 'Enrollments', 'Updates', 'Total Output', 'Reported'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {compDistricts.map((d, i) => (
                  <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                    <td style={tdS}><span style={{ width: '30px', height: '30px', borderRadius: '50%', background: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : gc(i), color: i < 3 ? '#333' : 'white', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '700' }}>{i < 3 ? ['🥇','🥈','🥉'][i] : `#${i+1}`}</span></td>
                    <td style={{ ...tdS, fontWeight: '700', fontSize: '14px', color: '#333' }}>🏛️ {d.district_name}</td>
                    <td style={tdS}><span style={{ fontWeight: '700', color: '#667eea', fontSize: '15px' }}>{d.total_operators || d.operators_reported || 0}</span></td>
                    <td style={tdS}><span style={{ fontWeight: '800', color: '#28a745', fontSize: '18px' }}>{d.total_enrollments}</span></td>
                    <td style={tdS}><span style={{ fontWeight: '800', color: '#17a2b8', fontSize: '18px' }}>{d.total_updates}</span></td>
                    <td style={tdS}><span style={{ fontWeight: '800', color: '#e74c3c', fontSize: '20px' }}>{(d.total_enrollments||0)+(d.total_updates||0)}</span></td>
                    <td style={tdS}><span style={{ fontWeight: '700', color: '#9b59b6' }}>{d.operators_reported || 0}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======== OPERATORS TAB ======== */}
        {mainTab === 'operators' && (
          <div style={card}>
            <div style={{ padding: '16px 25px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}><h3 style={{ margin: 0, fontSize: '16px' }}>👥 All Operators ({operators.length})</h3></div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Name', 'Email', 'Phone', 'District', 'Op ID', 'Type', 'Status', 'Approved'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {operators.map((op, i) => (
                  <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                    <td style={tdS}>{i + 1}</td>
                    <td style={{ ...tdS, fontWeight: '600' }}>{op.full_name}</td>
                    <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.email}</td>
                    <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.phone || '—'}</td>
                    <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{op.district_name || '—'}</td>
                    <td style={{ ...tdS, fontWeight: '700' }}>{op.operator_user_id || '—'}</td>
                    <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td>
                    <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: '#fff3cd', color: '#856404' }}>{op.registration_status || '—'}</span></td>
                    <td style={tdS}>{op.final_approved ? '✅' : '❌'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ======== USERS TAB ======== */}
        {mainTab === 'users' && (
          <div style={card}>
            <div style={{ padding: '16px 25px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '16px' }}>🔑 All System Users ({users.length})</h3>
              <button onClick={loadUsers} style={{ padding: '8px 16px', background: '#1a1a2e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>🔄</button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr>{['#', 'Name', 'Email', 'Phone', 'Role', 'District', 'Active', 'Created'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
              <tbody>
                {users.map((u, i) => {
                  const roleColors = { owner: '#ffd700', admin: '#7b1fa2', supervisor: '#3f51b5', hq_supervisor: '#c62828', central_supervisor: '#00838f', accountant: '#e65100', operator: '#2e7d32' };
                  return (
                    <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                      <td style={tdS}>{i + 1}</td>
                      <td style={{ ...tdS, fontWeight: '600' }}>{u.full_name}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{u.email}</td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{u.phone || '—'}</td>
                      <td style={tdS}><span style={{ padding: '3px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: `${roleColors[u.role] || '#666'}20`, color: roleColors[u.role] || '#666' }}>{u.role}</span></td>
                      <td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{u.district_name || '—'}</td>
                      <td style={tdS}>{u.is_active !== false ? '✅' : '❌'}</td>
                      <td style={{ ...tdS, color: '#999', fontSize: '12px' }}>{D(u.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ======== DISTRICT DETAIL ======== */}
        {mainTab === 'district-detail' && selectedDistrict && (
          <div>
            <button onClick={() => setMainTab('districts')} style={{ padding: '10px 20px', background: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>← Back to Districts</button>
            <div style={{ ...card, borderLeft: '5px solid #667eea', padding: '22px 28px' }}>
              <h2 style={{ margin: '0 0 6px', fontSize: '22px', color: '#333' }}>📍 {selectedDistrict.district_name} <span style={{ fontSize: '14px', color: '#999' }}>({selectedDistrict.district_code})</span></h2>
              <p style={{ color: '#666', margin: 0, fontSize: '13px' }}>👤 Supervisor: <strong>{selectedDistrict.admin_name || 'Not Assigned'}</strong></p>
            </div>
            <div style={card}>
              <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}><h3 style={{ margin: 0, fontSize: '15px' }}>👥 Operators ({districtOps.length})</h3></div>
              {districtOps.length === 0 ? <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No operators</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Name', 'Email', 'Phone', 'Op ID', 'Type', 'Status', 'Approved'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {districtOps.map((op, i) => (
                      <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}>{i + 1}</td><td style={{ ...tdS, fontWeight: '600' }}>{op.full_name}</td><td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.email}</td><td style={{ ...tdS, color: '#666', fontSize: '12px' }}>{op.phone || '—'}</td><td style={{ ...tdS, fontWeight: '700', color: '#667eea' }}>{op.operator_user_id || '—'}</td><td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td><td style={tdS}>{op.registration_status}</td><td style={tdS}>{op.final_approved ? '✅' : '❌'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div style={card}>
              <div style={{ padding: '16px 24px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}><h3 style={{ margin: 0, fontSize: '15px' }}>📋 Reports ({districtReports.length})</h3></div>
              {districtReports.length === 0 ? <div style={{ padding: '30px', textAlign: 'center', color: '#999' }}>No reports</div> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr>{['#', 'Operator', 'Op ID', 'Date', 'Enrollments', 'Updates', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}</tr></thead>
                  <tbody>
                    {districtReports.slice(0, 100).map((r, i) => (
                      <tr key={i} onMouseOver={e => e.currentTarget.style.background = '#fafbff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={tdS}>{i + 1}</td><td style={{ ...tdS, fontWeight: '600' }}>{r.operator_name}</td><td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{r.operator_user_id || '—'}</td><td style={{ ...tdS, fontWeight: '600' }}>{D(r.report_date)}</td><td style={tdS}><span style={{ fontWeight: '800', color: '#28a745', fontSize: '17px' }}>{r.enrollments_count || 0}</span></td><td style={tdS}><span style={{ fontWeight: '800', color: '#17a2b8', fontSize: '17px' }}>{r.updates_count || 0}</span></td><td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: r.review_status === 'approved' ? '#d4edda' : '#fff3cd', color: r.review_status === 'approved' ? '#155724' : '#856404' }}>{r.review_status || 'pending'}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OwnerDashboard;