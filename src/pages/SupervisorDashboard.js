// District Supervisor Dashboard - with Upload to Central
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

const SupervisorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type='success') => { setToast({show:true, msg, type}); setTimeout(() => setToast({show:false, msg:'', type:'success'}), 3000); };
  const [dashData, setDashData] = useState(null);
  const [operators, setOperators] = useState([]);
  const [reports, setReports] = useState([]);
  const [mainView, setMainView] = useState('reports');
  const [reportFilter, setReportFilter] = useState('today');
  const [reportSearch, setReportSearch] = useState('');
  const [opSearch, setOpSearch] = useState('');
  const [selectedOp, setSelectedOp] = useState(null);
  const [opReports, setOpReports] = useState([]);
  const [ssUrl, setSsUrl] = useState('');
  const [showSS, setShowSS] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Upload to Central
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split('T')[0]);
  const [uploadReports, setUploadReports] = useState([]);
  const [selectedReportIds, setSelectedReportIds] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [myUploads, setMyUploads] = useState([]);
  const [loadingUploadReports, setLoadingUploadReports] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadDash(), loadOps(), loadReports(), loadMyUploads()]);
    setLoading(false);
  };

  const loadDash = async () => { try { const r = await axios.get(`${API}/supervisor/dashboard`, getAuth()); setDashData(r.data); } catch (e) {} };
  const loadOps = async () => { try { const r = await axios.get(`${API}/supervisor/operators`, getAuth()); setOperators(r.data?.operators || []); } catch (e) {} };
  const loadReports = async () => { try { const r = await axios.get(`${API}/daily-reports/district-reports`, getAuth()); const d = r.data?.reports || r.data || []; setReports(Array.isArray(d) ? d : []); } catch (e) {} };
  const loadMyUploads = async () => { try { const r = await axios.get(`${API}/supervisor/my-uploads`, getAuth()); setMyUploads(r.data?.uploads || []); } catch (e) {} };

  const loadApprovedForUpload = async (dt) => {
    setLoadingUploadReports(true);
    try {
      const r = await axios.get(`${API}/supervisor/approved-reports-for-upload?upload_date=${dt}`, getAuth());
      setUploadReports(r.data?.reports || []);
      setSelectedReportIds([]);
    } catch (e) { setUploadReports([]); }
    setLoadingUploadReports(false);
  };

  useEffect(() => { if (mainView === 'upload') loadApprovedForUpload(uploadDate); }, [mainView, uploadDate]);

  const today = new Date().toISOString().split('T')[0];
  const activeOps = operators.filter(o => o.final_approved).length;
  const pendingOps = operators.filter(o => !o.final_approved).length;
  const pendingR = reports.filter(r => r.review_status === 'pending').length;
  const okR = reports.filter(r => r.review_status === 'approved').length;
  const notOkR = reports.filter(r => r.review_status === 'rejected').length;
  const todayR = reports.filter(r => r.report_date?.startsWith(today)).length;

  const openOpDetail = (op) => {
    setSelectedOp(op);
    const matched = reports.filter(r => (r.operator_name === op.full_name && r.operator_email === op.email) || (r.operator_user_id && r.operator_user_id === op.operator_user_id));
    setOpReports(matched.sort((a, b) => (b.report_date || '').localeCompare(a.report_date || '')));
    setMainView('op-detail');
  };

  const openReview = (id, action) => { setReviewTarget({ id, action }); setReviewRemarks(''); setShowReview(true); };

  const confirmReview = async () => {
    if (!reviewTarget) return;
    if (reviewTarget.action === 'rejected' && !reviewRemarks.trim()) { showToast('Reason required'); return; }
    try {
      const rem = reviewRemarks || (reviewTarget.action === 'approved' ? 'Verified - OK' : 'Issues found');
      await axios.post(`${API}/daily-reports/review/${reviewTarget.id}?action=${reviewTarget.action}&review_remarks=${encodeURIComponent(rem)}`, {}, getAuth());
      showToast(reviewTarget.action === 'approved' ? 'Marked OK!' : 'Marked Not OK!');
      setShowReview(false); setReviewTarget(null);
      await loadReports();
    } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
    loadAll();
  };

  // Upload to Central
  const toggleReportSelect = (id) => {
    setSelectedReportIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const selectAll = () => {
    if (selectedReportIds.length === uploadReports.length) setSelectedReportIds([]);
    else setSelectedReportIds(uploadReports.map(r => r.report_id));
  };

  const handleUploadToCentral = async () => {
    if (selectedReportIds.length === 0) { showToast('Select at least one report!'); return; }
    if (!window.confirm(`Upload ${selectedReportIds.length} reports for ${uploadDate} to Central Supervisor?`)) return;
    setUploading(true);
    try {
      const res = await axios.post(`${API}/supervisor/upload-to-central?upload_date=${uploadDate}&report_ids=${selectedReportIds.join(',')}`, {}, getAuth());
      showToast(' ' + (res.data?.message || 'Uploaded!'));
      loadMyUploads();
      loadApprovedForUpload(uploadDate);
    } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
    setUploading(false);
  };

  const B = (s) => ({ pending: { t: '⏳ Pending', bg: '#fff3cd', c: '#856404' }, approved: { t: '✅ OK', bg: '#d4edda', c: '#155724' }, rejected: { t: '❌ Not OK', bg: '#f8d7da', c: '#721c24' }, verified: { t: '✅ Verified', bg: '#d4edda', c: '#155724' } }[s] || { t: s || '—', bg: '#f0f0f0', c: '#666' });
  const D = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filteredReports = reports.filter(r => {
    if (reportFilter === 'pending' && r.review_status !== 'pending') return false;
    if (reportFilter === 'ok' && r.review_status !== 'approved') return false;
    if (reportFilter === 'notok' && r.review_status !== 'rejected') return false;
    if (reportFilter === 'today' && !r.report_date?.startsWith(today)) return false;
    if (reportSearch.trim()) { const q = reportSearch.toLowerCase(); return (r.operator_name || '').toLowerCase().includes(q) || (r.operator_user_id || '').toLowerCase().includes(q); }
    return true;
  });

  const filteredOps = operators.filter(o => {
    if (!opSearch.trim()) return true;
    const q = opSearch.toLowerCase();
    return (o.full_name || '').toLowerCase().includes(q) || (o.email || '').toLowerCase().includes(q) || (o.operator_user_id || '').toLowerCase().includes(q) || (o.district_name || '').toLowerCase().includes(q);
  });

  const groupByDate = (rpts) => {
    const m = {};
    rpts.forEach(r => { const d = r.report_date?.split('T')[0] || '?'; if (!m[d]) m[d] = []; m[d].push(r); });
    return Object.entries(m).sort((a, b) => b[0].localeCompare(a[0]));
  };

  const SC = (v, f) => { setMainView(v); if (f) setReportFilter(f); setSelectedOp(null); };

  if (loading) return (<div><Navbar />
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
      {/* Toast Notification */}
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, animation: 'slideIn 0.3s ease', background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
      {/* Refresh Bar */}
      <div style={{ padding: '12px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', color: '#64748b' }}>Last updated: {new Date().toLocaleTimeString()}</span>
        <button onClick={() => { setLoading(true); setTimeout(() => window.location.reload(), 100); }} style={{ padding: '6px 16px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>🔄 Refresh</button>
      </div><div style={{ textAlign: 'center', padding: '60px', fontSize: '18px' }}>⏳ Loading...</div></div>);

  const card = { background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' };
  const thS = { padding: '11px 14px', fontWeight: '600', color: '#555', fontSize: '11px', textAlign: 'left' };
  const tdS = { padding: '11px 14px', fontSize: '12px' };

  return (
    <div style={{ background: '#f5f6fa', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ padding: '25px 40px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '22px 28px', borderRadius: '15px', marginBottom: '20px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '22px' }}>🏛️ District Supervisor</h1>
              <div style={{ display: 'flex', gap: '20px', opacity: 0.95, fontSize: '13px' }}>
                <span>👤 {dashData?.supervisor_name || user?.full_name || '—'}</span>
                <span>📧 {dashData?.supervisor_email || user?.email || '—'}</span>
                <span>🏛️ <strong>{dashData?.district_name || '—'}</strong></span>
              </div>
            </div>
            <span style={{ padding: '6px 18px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontWeight: '600', fontSize: '13px' }}>District Supervisor</span>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { l: 'Operators', v: operators.length, c: '#667eea', i: '👥', ck: () => SC('operators') },
            { l: 'Active', v: activeOps, c: '#28a745', i: '✅', ck: () => SC('operators') },
            { l: 'Registering', v: pendingOps, c: '#ffc107', i: '⏳', ck: () => SC('operators') },
            { l: 'Today', v: todayR, c: '#17a2b8', i: '📅', ck: () => SC('reports', 'today') },
            { l: 'Pending', v: pendingR, c: '#dc3545', i: '📋', ck: () => SC('reports', 'pending') },
            { l: 'OK', v: okR, c: '#28a745', i: '✅', ck: () => SC('reports', 'ok') },
            { l: 'Not OK', v: notOkR, c: '#e74c3c', i: '❌', ck: () => SC('reports', 'notok') },
          ].map((s, i) => (
            <div key={i} onClick={s.ck} style={{ background: 'white', padding: '14px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.c}`, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.04)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; }}>
              <p style={{ color: '#999', fontSize: '10px', margin: 0 }}>{s.i} {s.l}</p>
              <p style={{ fontSize: '22px', fontWeight: '700', color: s.c, margin: '2px 0 0' }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' }}>
          {[
            { k: 'reports', l: `📋 Reports${pendingR > 0 ? ` (${pendingR})` : ''}` },
            { k: 'operators', l: `👥 Operators (${operators.length})` },
            { k: 'upload', l: `📤 Upload to Central` },
          ].map(t => (
            <button key={t.k} onClick={() => SC(t.k)} style={{
              padding: '12px 24px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
              background: (mainView === t.k || (t.k === 'operators' && mainView === 'op-detail')) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'white',
              color: (mainView === t.k || (t.k === 'operators' && mainView === 'op-detail')) ? 'white' : '#666',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}>{t.l}</button>
          ))}
          {selectedOp && mainView === 'op-detail' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '10px' }}>
              <span style={{ color: '#bbb' }}>›</span>
              <span style={{ padding: '8px 16px', background: '#e8eaf6', color: '#3f51b5', borderRadius: '10px', fontWeight: '600', fontSize: '13px' }}>👤 {selectedOp.full_name}</span>
              <button onClick={() => SC('operators')} style={{ padding: '6px 12px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>✕ Back</button>
            </div>
          )}
        </div>

        {/* ===== REPORTS TAB ===== */}
        {mainView === 'reports' && (
          <div style={card}>
            <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
              {[{ k: 'all', l: `All (${reports.length})` }, { k: 'today', l: `📅 Today (${todayR})` }, { k: 'pending', l: `⏳ Pending (${pendingR})` }, { k: 'ok', l: `✅ OK (${okR})` }, { k: 'notok', l: `❌ Not OK (${notOkR})` }].map(t => (
                <button key={t.k} onClick={() => setReportFilter(t.k)} style={{
                  flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                  background: reportFilter === t.k ? '#667eea' : 'transparent', color: reportFilter === t.k ? 'white' : '#666',
                }}>{t.l}</button>
              ))}
            </div>
            <div style={{ padding: '10px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="🔍 Search name, ID..." value={reportSearch} onChange={e => setReportSearch(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '13px' }} />
              <button onClick={loadReports} style={{ padding: '10px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🔄</button>
            </div>
            {filteredReports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}><div style={{ fontSize: '50px', marginBottom: '10px' }}>{reportFilter === 'pending' ? '🎉' : '📭'}</div><p>{reportFilter === 'pending' ? 'All reviewed!' : 'No reports.'}</p></div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8f9fa' }}>
                  {['#', 'Operator', 'Operator ID', 'District', 'Date', 'Enrollments', 'Updates', '📷', 'Status', 'Actions'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredReports.map((r, i) => {
                    const b = B(r.review_status);
                    return (
                      <tr key={r.id || i} style={{ borderBottom: '1px solid #f0f0f0' }} onMouseOver={e => e.currentTarget.style.background = '#f8f9ff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                        <td style={{ ...tdS, fontWeight: '600', color: '#333', fontSize: '13px' }}>{r.operator_name || '—'}</td>
                        <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{r.operator_user_id || '—'}</td>
                        <td style={{ ...tdS, color: '#28a745' }}>{r.district_name || '—'}</td>
                        <td style={{ ...tdS, fontWeight: '600', color: '#333' }}>{D(r.report_date)}</td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>{r.enrollments_count || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#17a2b8', fontSize: '16px' }}>{r.updates_count || 0}</span></td>
                        <td style={tdS}>{(r.screenshot_url || r.screenshot_path) ? <button onClick={() => { setSsUrl(`${API_URL}${r.screenshot_url || r.screenshot_path}`); setShowSS(true); }} style={{ padding: '3px 8px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' }}>📷</button> : '—'}</td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                        <td style={tdS}>{r.review_status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => openReview(r.id, 'approved')} style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>✅ OK</button>
                            <button onClick={() => openReview(r.id, 'rejected')} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>❌</button>
                          </div>
                        ) : <span style={{ color: '#aaa', fontSize: '11px' }}>Reviewed</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== OPERATORS TAB ===== */}
        {mainView === 'operators' && (
          <div style={card}>
            <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '10px' }}>
              <input type="text" placeholder="🔍 Search name, email, ID, district..." value={opSearch} onChange={e => setOpSearch(e.target.value)}
                style={{ flex: 1, padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '13px' }} />
            </div>
            {filteredOps.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>No operators found</div> : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8f9fa' }}>
                  {['#', 'Name', 'Email', 'Operator ID', 'District', 'Type', 'Status', 'Registered', ''].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredOps.map((op, i) => (
                    <tr key={op.operator_id || i} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }} onClick={() => openOpDetail(op)}
                      onMouseOver={e => e.currentTarget.style.background = '#f8f9ff'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                      <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                      <td style={{ ...tdS, fontWeight: '600', color: '#333', fontSize: '13px' }}>{op.full_name}</td>
                      <td style={{ ...tdS, color: '#666' }}>{op.email}</td>
                      <td style={{ ...tdS, color: '#667eea', fontWeight: '700' }}>{op.operator_user_id || '—'}</td>
                      <td style={{ ...tdS, color: '#28a745', fontWeight: '600' }}>{op.district_name || '—'}</td>
                      <td style={tdS}><span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '10px', fontWeight: '600', background: '#e8eaf6', color: '#3f51b5' }}>{op.operator_type || 'N/A'}</span></td>
                      <td style={tdS}><span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '600', background: op.final_approved ? '#d4edda' : '#fff3cd', color: op.final_approved ? '#155724' : '#856404' }}>{op.final_approved ? '✅ Active' : '⏳ Pending'}</span></td>
                      <td style={{ ...tdS, color: '#999', fontSize: '11px' }}>{D(op.created_at)}</td>
                      <td style={tdS}><button onClick={e => { e.stopPropagation(); openOpDetail(op); }} style={{ padding: '5px 14px', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '10px', fontWeight: '600' }}>📊</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== OPERATOR DETAIL ===== */}
        {mainView === 'op-detail' && selectedOp && (
          <div>
            <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderLeft: '5px solid #667eea' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', color: '#333', fontSize: '20px' }}>👤 {selectedOp.full_name}</h2>
                  <div style={{ display: 'flex', gap: '18px', fontSize: '13px' }}>
                    <span style={{ color: '#666' }}>📧 {selectedOp.email}</span>
                    <span style={{ color: '#667eea', fontWeight: '700' }}>🔑 {selectedOp.operator_user_id || '—'}</span>
                    <span style={{ color: '#28a745', fontWeight: '600' }}>🏛️ {selectedOp.district_name || '—'}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  {[{ v: opReports.length, l: 'Reports', c: '#667eea', bg: '#eef0fb' }, { v: opReports.reduce((s, r) => s + (r.enrollments_count || 0), 0), l: 'Enrolls', c: '#28a745', bg: '#d4edda' }, { v: opReports.reduce((s, r) => s + (r.updates_count || 0), 0), l: 'Updates', c: '#0c5460', bg: '#d1ecf1' }].map((s, j) => (
                    <div key={j} style={{ textAlign: 'center', padding: '10px 16px', background: s.bg, borderRadius: '10px' }}>
                      <p style={{ fontSize: '20px', fontWeight: '700', color: s.c, margin: 0 }}>{s.v}</p>
                      <p style={{ fontSize: '9px', color: '#666', margin: 0 }}>{s.l}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {opReports.length === 0 ? <div style={{ textAlign: 'center', padding: '50px', background: 'white', borderRadius: '15px', color: '#999' }}><p>📭 No reports yet.</p></div> : (
              <div style={{ display: 'grid', gap: '10px' }}>
                {groupByDate(opReports).map(([date, dayR]) => {
                  const isToday = date === today;
                  return (
                    <div key={date} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', border: isToday ? '2px solid #667eea' : 'none' }}>
                      <div style={{ padding: '10px 18px', background: isToday ? '#667eea' : '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0, color: isToday ? 'white' : '#333', fontSize: '13px' }}>📅 {D(date)} {isToday && <span style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.3)', borderRadius: '8px', fontSize: '10px', marginLeft: '8px' }}>TODAY</span>}</h4>
                      </div>
                      {dayR.map((r, idx) => {
                        const b = B(r.review_status);
                        return (
                          <div key={r.id || idx} style={{ padding: '14px 18px', borderBottom: idx < dayR.length - 1 ? '1px solid #f0f0f0' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                              <div><p style={{ fontSize: '10px', color: '#999', margin: 0 }}>Enrollments</p><p style={{ fontSize: '22px', fontWeight: '700', color: '#28a745', margin: 0 }}>{r.enrollments_count || 0}</p></div>
                              <div><p style={{ fontSize: '10px', color: '#999', margin: 0 }}>Updates</p><p style={{ fontSize: '22px', fontWeight: '700', color: '#17a2b8', margin: 0 }}>{r.updates_count || 0}</p></div>
                              {(r.screenshot_url || r.screenshot_path) && <button onClick={() => { setSsUrl(`${API_URL}${r.screenshot_url || r.screenshot_path}`); setShowSS(true); }} style={{ padding: '6px 14px', background: '#667eea', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>📷</button>}
                            </div>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span>
                              {r.review_status === 'pending' && (<>
                                <button onClick={() => openReview(r.id, 'approved')} style={{ padding: '7px 14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>✅ OK</button>
                                <button onClick={() => openReview(r.id, 'rejected')} style={{ padding: '7px 14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>❌ Not OK</button>
                              </>)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===== UPLOAD TO CENTRAL TAB ===== */}
        {mainView === 'upload' && (
          <div>
            {/* Date Picker + Load */}
            <div style={{ background: 'white', padding: '20px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: '16px', color: '#333' }}>📤 Upload Approved Reports to Central Supervisor</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#555', display: 'block', marginBottom: '4px' }}>📅 Select Date</label>
                  <input type="date" value={uploadDate} onChange={e => setUploadDate(e.target.value)}
                    style={{ padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
                </div>
                <div style={{ marginTop: '18px' }}>
                  <button onClick={() => loadApprovedForUpload(uploadDate)} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🔍 Load Reports</button>
                </div>
              </div>
            </div>

            {/* Reports to Select */}
            <div style={{ ...card, marginBottom: '15px' }}>
              <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>✅ Approved Reports for {D(uploadDate)} ({uploadReports.length})</h4>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {uploadReports.length > 0 && (
                    <button onClick={selectAll} style={{ padding: '6px 14px', background: selectedReportIds.length === uploadReports.length ? '#dc3545' : '#28a745', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: '600' }}>
                      {selectedReportIds.length === uploadReports.length ? 'Deselect All' : 'Select All ✓'}
                    </button>
                  )}
                  <span style={{ fontSize: '12px', color: '#667eea', fontWeight: '600' }}>{selectedReportIds.length} selected</span>
                </div>
              </div>

              {loadingUploadReports ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>⏳ Loading...</div>
              ) : uploadReports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>📭</div>
                  <p>No approved reports for {D(uploadDate)}. Review reports first!</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f8f9fa' }}>
                    {['☑️', '#', 'Operator', 'Operator ID', 'Enrollments', 'Updates', '📷', 'Status'].map(h => <th key={h} style={thS}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {uploadReports.map((r, i) => (
                      <tr key={r.report_id} style={{ borderBottom: '1px solid #f0f0f0', background: selectedReportIds.includes(r.report_id) ? '#f0f5ff' : 'white', cursor: 'pointer' }}
                        onClick={() => toggleReportSelect(r.report_id)}>
                        <td style={tdS}>
                          <input type="checkbox" checked={selectedReportIds.includes(r.report_id)} onChange={() => toggleReportSelect(r.report_id)}
                            style={{ width: '18px', height: '18px', cursor: 'pointer' }} />
                        </td>
                        <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                        <td style={{ ...tdS, fontWeight: '600', color: '#333' }}>{r.operator_name}</td>
                        <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{r.operator_user_id || '—'}</td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>{r.enrollments_count || 0}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#17a2b8', fontSize: '16px' }}>{r.updates_count || 0}</span></td>
                        <td style={tdS}>{r.screenshot_path ? <button onClick={e => { e.stopPropagation(); setSsUrl(`${API_URL}${r.screenshot_path}`); setShowSS(true); }} style={{ padding: '3px 8px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' }}>📷</button> : '—'}</td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: '#d4edda', color: '#155724' }}>✅ OK</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Upload Summary + Button */}
              {selectedReportIds.length > 0 && (
                <div style={{ padding: '15px 20px', background: '#f0f5ff', borderTop: '2px solid #667eea', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>
                      📊 {selectedReportIds.length} reports selected •
                      📝 {uploadReports.filter(r => selectedReportIds.includes(r.report_id)).reduce((s, r) => s + (r.enrollments_count || 0), 0)} enrollments •
                      🔄 {uploadReports.filter(r => selectedReportIds.includes(r.report_id)).reduce((s, r) => s + (r.updates_count || 0), 0)} updates
                    </p>
                    <p style={{ margin: '3px 0 0', color: '#666', fontSize: '12px' }}>Screenshots will be compressed into ZIP and sent to Central</p>
                  </div>
                  <button onClick={handleUploadToCentral} disabled={uploading} style={{
                    padding: '12px 30px', background: uploading ? '#999' : 'linear-gradient(135deg, #28a745, #20c997)', color: 'white',
                    border: 'none', borderRadius: '10px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '15px',
                  }}>{uploading ? '⏳ Uploading...' : '📤 Upload to Central'}</button>
                </div>
              )}
            </div>

            {/* My Previous Uploads */}
            <div style={card}>
              <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}>
                <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>📋 My Previous Uploads ({myUploads.length})</h4>
              </div>
              {myUploads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No uploads yet</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f8f9fa' }}>
                    {['#', 'Date', 'Operators', 'Enrollments', 'Updates', 'Status', 'Remarks', 'Uploaded At'].map(h => <th key={h} style={thS}>{h}</th>)}
                  </tr></thead>
                  <tbody>
                    {myUploads.map((u, i) => {
                      const b = B(u.status);
                      return (
                        <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                          <td style={{ ...tdS, fontWeight: '600' }}>{D(u.upload_date)}</td>
                          <td style={tdS}>{u.total_operators}</td>
                          <td style={tdS}><span style={{ fontWeight: '700', color: '#28a745' }}>{u.total_enrollments}</span></td>
                          <td style={tdS}><span style={{ fontWeight: '700', color: '#17a2b8' }}>{u.total_updates}</span></td>
                          <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                          <td style={{ ...tdS, color: '#666', fontSize: '11px' }}>{u.review_remarks || '—'}</td>
                          <td style={{ ...tdS, color: '#999', fontSize: '11px' }}>{D(u.created_at)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* REVIEW POPUP */}
        {showReview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '18px', maxWidth: '420px', width: '95%', padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: reviewTarget?.action === 'approved' ? '#d4edda' : '#f8d7da', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '28px' }}>{reviewTarget?.action === 'approved' ? '✅' : '❌'}</div>
                <h3 style={{ margin: 0, color: '#333' }}>{reviewTarget?.action === 'approved' ? 'Mark as OK?' : 'Mark as Not OK?'}</h3>
              </div>
              <textarea value={reviewRemarks} onChange={e => setReviewRemarks(e.target.value)}
                placeholder={reviewTarget?.action === 'approved' ? 'Optional notes...' : 'Reason (required)...'}
                rows={3} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', resize: 'none', marginBottom: '15px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={confirmReview} disabled={reviewTarget?.action === 'rejected' && !reviewRemarks.trim()}
                  style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', background: reviewTarget?.action === 'approved' ? '#28a745' : '#dc3545', color: 'white', opacity: (reviewTarget?.action === 'rejected' && !reviewRemarks.trim()) ? 0.5 : 1 }}>
                  {reviewTarget?.action === 'approved' ? '✅ Confirm OK' : '❌ Confirm Not OK'}</button>
                <button onClick={() => { setShowReview(false); setReviewTarget(null); }} style={{ flex: 1, padding: '13px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREENSHOT POPUP */}
        {showSS && (
          <div onClick={() => setShowSS(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, cursor: 'pointer' }}>
            <div><img src={ssUrl} alt="SS" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '12px', border: '3px solid white' }} onError={e => { e.target.parentElement.innerHTML = '<p style="color:white">Not available</p>'; }} />
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', marginTop: '10px', fontSize: '12px' }}>Click to close</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;