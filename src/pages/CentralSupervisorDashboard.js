// Central Supervisor Dashboard
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

const CentralSupervisorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type='success') => { setToast({show:true, msg, type}); setTimeout(() => setToast({show:false, msg:'', type:'success'}), 3000); };
  const [dashData, setDashData] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchQ, setSearchQ] = useState('');

  // Detail view
  const [selectedUpload, setSelectedUpload] = useState(null);
  const [uploadDetail, setUploadDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Review popup
  const [showReview, setShowReview] = useState(false);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Screenshot
  const [ssUrl, setSsUrl] = useState('');
  const [showSS, setShowSS] = useState(false);

  useEffect(() => { loadAll(); }, []);
  useEffect(() => { loadUploads(); }, [statusFilter, districtFilter, dateFilter]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadDash(), loadUploads(), loadDistricts()]);
    setLoading(false);
  };

  const loadDash = async () => { try { const r = await axios.get(`${API}/central-supervisor/dashboard`, getAuth()); setDashData(r.data); } catch (e) {} };

  const loadUploads = async () => {
    try {
      let url = `${API}/central-supervisor/uploads?`;
      if (statusFilter && statusFilter !== 'all') url += `status_filter=${statusFilter}&`;
      if (districtFilter) url += `district_filter=${districtFilter}&`;
      if (dateFilter) url += `date_filter=${dateFilter}&`;
      const r = await axios.get(url, getAuth());
      setUploads(r.data?.uploads || []);
    } catch (e) {}
  };

  const loadDistricts = async () => { try { const r = await axios.get(`${API}/central-supervisor/districts`, getAuth()); setDistricts(r.data?.districts || []); } catch (e) {} };

  const openDetail = async (upload) => {
    setSelectedUpload(upload);
    setLoadingDetail(true);
    try {
      const r = await axios.get(`${API}/central-supervisor/upload/${upload.id}/details`, getAuth());
      setUploadDetail(r.data);
    } catch (e) { setUploadDetail(null); }
    setLoadingDetail(false);
  };

  const openReview = (upload, action) => { setReviewTarget({ id: upload.id, action, district: upload.district_name }); setReviewRemarks(''); setShowReview(true); };

  const confirmReview = async () => {
    if (!reviewTarget) return;
    if (reviewTarget.action === 'reject' && !reviewRemarks.trim()) { showToast('Reason required for rejection'); return; }
    try {
      const rem = encodeURIComponent(reviewRemarks || 'Verified');
      if (reviewTarget.action === 'verify') {
        await axios.post(`${API}/central-supervisor/verify/${reviewTarget.id}?remarks=${rem}`, {}, getAuth());
        showToast(' Verified!');
        loadAll();
      } else {
        await axios.post(`${API}/central-supervisor/reject/${reviewTarget.id}?remarks=${rem}`, {}, getAuth());
        showToast(' Rejected!');
        loadAll();
      }
      setShowReview(false); setReviewTarget(null);
      loadUploads(); loadDash();
      if (selectedUpload && selectedUpload.id === reviewTarget.id) {
        setSelectedUpload(null); setUploadDetail(null);
      }
    } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
    loadAll();
  };

  const B = (s) => ({
    pending: { t: '⏳ Pending', bg: '#fff3cd', c: '#856404' },
    verified: { t: '✅ Verified', bg: '#d4edda', c: '#155724' },
    rejected: { t: '❌ Rejected', bg: '#f8d7da', c: '#721c24' },
  }[s] || { t: s || '—', bg: '#f0f0f0', c: '#666' });

  const D = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

  const filteredUploads = uploads.filter(u => {
    if (!searchQ.trim()) return true;
    const q = searchQ.toLowerCase();
    return (u.district_name || '').toLowerCase().includes(q) || (u.supervisor_name || '').toLowerCase().includes(q);
  });

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
        <div style={{ background: 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)', padding: '22px 28px', borderRadius: '15px', marginBottom: '20px', color: 'white' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: '0 0 6px', fontSize: '22px' }}>🏢 Central Supervisor</h1>
              <div style={{ display: 'flex', gap: '20px', opacity: 0.95, fontSize: '13px' }}>
                <span>👤 {dashData?.supervisor_name || user?.full_name || '—'}</span>
                <span>📧 {dashData?.supervisor_email || user?.email || '—'}</span>
                <span>🏛️ <strong>HQ - All Districts</strong></span>
              </div>
            </div>
            <span style={{ padding: '6px 18px', background: 'rgba(255,255,255,0.2)', borderRadius: '20px', fontWeight: '600', fontSize: '13px' }}>Central Supervisor</span>
          </div>
        </div>

        {/* STATS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px', marginBottom: '20px' }}>
          {[
            { l: 'Total Uploads', v: dashData?.total_uploads || 0, c: '#667eea', i: '📦', ck: () => setStatusFilter('all') },
            { l: 'Pending', v: dashData?.pending || 0, c: '#dc3545', i: '⏳', ck: () => setStatusFilter('pending') },
            { l: 'Verified', v: dashData?.verified || 0, c: '#28a745', i: '✅', ck: () => setStatusFilter('verified') },
            { l: 'Rejected', v: dashData?.rejected || 0, c: '#e74c3c', i: '❌', ck: () => setStatusFilter('rejected') },
            { l: 'Districts', v: dashData?.total_districts || 0, c: '#17a2b8', i: '🏛️', ck: () => {} },
          ].map((s, i) => (
            <div key={i} onClick={s.ck} style={{ background: 'white', padding: '16px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.c}`, cursor: 'pointer', transition: 'all 0.15s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.03)'} onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
              <p style={{ color: '#999', fontSize: '11px', margin: 0 }}>{s.i} {s.l}</p>
              <p style={{ fontSize: '26px', fontWeight: '700', color: s.c, margin: '3px 0 0' }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* Back button when detail view */}
        {selectedUpload && (
          <button onClick={() => { setSelectedUpload(null); setUploadDetail(null); }} style={{ padding: '10px 20px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', marginBottom: '15px', fontSize: '13px' }}>← Back to All Uploads</button>
        )}

        {/* ===== UPLOADS LIST ===== */}
        {!selectedUpload && (
          <div style={card}>
            {/* Filters */}
            <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                {/* Status filter tabs */}
                {[{ k: 'all', l: `All (${uploads.length})` }, { k: 'pending', l: `⏳ Pending` }, { k: 'verified', l: `✅ Verified` }, { k: 'rejected', l: `❌ Rejected` }].map(t => (
                  <button key={t.k} onClick={() => setStatusFilter(t.k)} style={{
                    padding: '8px 16px', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '12px',
                    background: statusFilter === t.k ? '#e74c3c' : 'white', color: statusFilter === t.k ? 'white' : '#666',
                  }}>{t.l}</button>
                ))}
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                  <select value={districtFilter} onChange={e => setDistrictFilter(e.target.value)}
                    style={{ padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }}>
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)}
                    style={{ padding: '8px 12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '12px' }} />
                  {dateFilter && <button onClick={() => setDateFilter('')} style={{ padding: '8px 12px', background: '#f0f0f0', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '11px' }}>✕</button>}
                </div>
              </div>
              <div style={{ marginTop: '8px' }}>
                <input type="text" placeholder="🔍 Search district, supervisor..." value={searchQ} onChange={e => setSearchQ(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '13px' }} />
              </div>
            </div>

            {/* Table */}
            {filteredUploads.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>{statusFilter === 'pending' ? '🎉' : '📭'}</div>
                <p>{statusFilter === 'pending' ? 'No pending uploads!' : 'No uploads found.'}</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ background: '#f8f9fa' }}>
                  {['#', 'District', 'Supervisor', 'Date', 'Operators', 'Enrollments', 'Updates', 'Status', 'Uploaded', 'Actions'].map(h => <th key={h} style={thS}>{h}</th>)}
                </tr></thead>
                <tbody>
                  {filteredUploads.map((u, i) => {
                    const b = B(u.status);
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                        onClick={() => openDetail(u)}
                        onMouseOver={e => e.currentTarget.style.background = '#fef5f5'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                        <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                        <td style={{ ...tdS, fontWeight: '700', color: '#e74c3c', fontSize: '13px' }}>🏛️ {u.district_name || '—'}</td>
                        <td style={{ ...tdS, fontWeight: '600', color: '#333' }}>{u.supervisor_name || '—'}</td>
                        <td style={{ ...tdS, fontWeight: '600', color: '#333' }}>{D(u.upload_date)}</td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#667eea', fontSize: '15px' }}>{u.total_operators}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>{u.total_enrollments}</span></td>
                        <td style={tdS}><span style={{ fontWeight: '700', color: '#17a2b8', fontSize: '16px' }}>{u.total_updates}</span></td>
                        <td style={tdS}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                        <td style={{ ...tdS, color: '#999', fontSize: '11px' }}>{D(u.created_at)}</td>
                        <td style={tdS}>
                          {u.status === 'pending' ? (
                            <div style={{ display: 'flex', gap: '4px' }} onClick={e => e.stopPropagation()}>
                              <button onClick={() => openReview(u, 'verify')} style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>✅ Verify</button>
                              <button onClick={() => openReview(u, 'reject')} style={{ padding: '5px 10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>❌</button>
                            </div>
                          ) : (
                            <button onClick={e => { e.stopPropagation(); openDetail(u); }} style={{ padding: '5px 12px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: '600' }}>👁️ View</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ===== UPLOAD DETAIL VIEW ===== */}
        {selectedUpload && (
          <div>
            {loadingDetail ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>⏳ Loading details...</div>
            ) : uploadDetail ? (
              <div>
                {/* Upload Info Card */}
                <div style={{ background: 'white', padding: '20px 24px', borderRadius: '12px', marginBottom: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', borderLeft: '5px solid #e74c3c' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ margin: '0 0 6px', color: '#333', fontSize: '20px' }}>🏛️ {uploadDetail.upload?.district_name}</h2>
                      <div style={{ display: 'flex', gap: '18px', fontSize: '13px', flexWrap: 'wrap' }}>
                        <span style={{ color: '#666' }}>👤 Supervisor: <strong>{uploadDetail.upload?.supervisor_name}</strong></span>
                        <span style={{ color: '#333', fontWeight: '600' }}>📅 {D(uploadDetail.upload?.upload_date)}</span>
                        {(() => { const b = B(uploadDetail.upload?.status); return <span style={{ padding: '2px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span>; })()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      {[
                        { v: uploadDetail.upload?.total_operators, l: 'Operators', c: '#667eea', bg: '#eef0fb' },
                        { v: uploadDetail.upload?.total_enrollments, l: 'Enrollments', c: '#28a745', bg: '#d4edda' },
                        { v: uploadDetail.upload?.total_updates, l: 'Updates', c: '#0c5460', bg: '#d1ecf1' },
                      ].map((s, j) => (
                        <div key={j} style={{ textAlign: 'center', padding: '10px 16px', background: s.bg, borderRadius: '10px', minWidth: '80px' }}>
                          <p style={{ fontSize: '22px', fontWeight: '700', color: s.c, margin: 0 }}>{s.v}</p>
                          <p style={{ fontSize: '9px', color: '#666', margin: '2px 0 0' }}>{s.l}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  {uploadDetail.upload?.status === 'pending' && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                      <button onClick={() => openReview(uploadDetail.upload, 'verify')} style={{ padding: '10px 24px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>✅ Verify this Upload</button>
                      <button onClick={() => openReview(uploadDetail.upload, 'reject')} style={{ padding: '10px 24px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>❌ Reject</button>
                      {uploadDetail.upload?.compressed_file_path && (
                        <a href={`${API_URL}${uploadDetail.upload.compressed_file_path}`} download style={{ padding: '10px 24px', background: '#667eea', color: 'white', borderRadius: '10px', fontWeight: '600', fontSize: '14px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>📥 Download ZIP</a>
                      )}
                    </div>
                  )}
                  {uploadDetail.upload?.review_remarks && uploadDetail.upload?.status !== 'pending' && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: uploadDetail.upload?.status === 'verified' ? '#d4edda' : '#f8d7da', borderRadius: '8px', fontSize: '13px' }}>
                      <strong>Remarks:</strong> {uploadDetail.upload.review_remarks}
                    </div>
                  )}
                </div>

                {/* Operator-wise Reports */}
                <div style={card}>
                  <div style={{ padding: '12px 20px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0' }}>
                    <h4 style={{ margin: 0, fontSize: '14px', color: '#333' }}>👥 Operator-wise Reports ({uploadDetail.operator_reports?.length || 0})</h4>
                  </div>
                  {(!uploadDetail.operator_reports || uploadDetail.operator_reports.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>No operator reports</div>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead><tr style={{ background: '#f8f9fa' }}>
                        {['#', 'Operator', 'Operator ID', 'Email', 'Enrollments', 'Updates', '📷', 'Remarks'].map(h => <th key={h} style={thS}>{h}</th>)}
                      </tr></thead>
                      <tbody>
                        {uploadDetail.operator_reports.map((r, i) => (
                          <tr key={r.report_id || i} style={{ borderBottom: '1px solid #f0f0f0' }}
                            onMouseOver={e => e.currentTarget.style.background = '#fef5f5'} onMouseOut={e => e.currentTarget.style.background = 'white'}>
                            <td style={{ ...tdS, color: '#999' }}>{i + 1}</td>
                            <td style={{ ...tdS, fontWeight: '600', color: '#333', fontSize: '13px' }}>{r.operator_name}</td>
                            <td style={{ ...tdS, color: '#667eea', fontWeight: '600' }}>{r.operator_user_id || '—'}</td>
                            <td style={{ ...tdS, color: '#666' }}>{r.operator_email || '—'}</td>
                            <td style={tdS}><span style={{ fontWeight: '700', color: '#28a745', fontSize: '16px' }}>{r.enrollments_count || 0}</span></td>
                            <td style={tdS}><span style={{ fontWeight: '700', color: '#17a2b8', fontSize: '16px' }}>{r.updates_count || 0}</span></td>
                            <td style={tdS}>
                              {r.screenshot_url ? (
                                <button onClick={() => { setSsUrl(`${API_URL}${r.screenshot_url}`); setShowSS(true); }}
                                  style={{ padding: '3px 8px', background: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', fontSize: '10px', cursor: 'pointer' }}>📷</button>
                              ) : '—'}
                            </td>
                            <td style={{ ...tdS, color: '#666', fontSize: '11px', fontStyle: 'italic' }}>{r.remarks || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>Failed to load details</div>
            )}
          </div>
        )}

        {/* REVIEW POPUP */}
        {showReview && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '18px', maxWidth: '420px', width: '95%', padding: '30px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: reviewTarget?.action === 'verify' ? '#d4edda' : '#f8d7da', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', fontSize: '28px' }}>{reviewTarget?.action === 'verify' ? '✅' : '❌'}</div>
                <h3 style={{ margin: '0 0 4px', color: '#333' }}>{reviewTarget?.action === 'verify' ? 'Verify Upload?' : 'Reject Upload?'}</h3>
                <p style={{ color: '#888', margin: 0, fontSize: '13px' }}>District: <strong>{reviewTarget?.district}</strong></p>
              </div>
              <textarea value={reviewRemarks} onChange={e => setReviewRemarks(e.target.value)}
                placeholder={reviewTarget?.action === 'verify' ? 'Optional remarks...' : 'Rejection reason (required)...'}
                rows={3} style={{ width: '100%', padding: '10px 12px', border: '2px solid #e0e0e0', borderRadius: '10px', fontSize: '14px', resize: 'none', marginBottom: '15px' }} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={confirmReview} disabled={reviewTarget?.action === 'reject' && !reviewRemarks.trim()}
                  style={{ flex: 1, padding: '13px', border: 'none', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', background: reviewTarget?.action === 'verify' ? '#28a745' : '#dc3545', color: 'white', opacity: (reviewTarget?.action === 'reject' && !reviewRemarks.trim()) ? 0.5 : 1 }}>
                  {reviewTarget?.action === 'verify' ? '✅ Confirm Verify' : '❌ Confirm Reject'}</button>
                <button onClick={() => { setShowReview(false); setReviewTarget(null); }} style={{ flex: 1, padding: '13px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* SCREENSHOT */}
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

export default CentralSupervisorDashboard;