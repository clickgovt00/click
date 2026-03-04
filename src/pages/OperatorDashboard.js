// Operator Dashboard - CRM Style (District Details + Registration + Daily Reports + Change Password)

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import RegistrationWizard from '../components/RegistrationWizard';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

const OperatorDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type='success') => { setToast({show:true, msg, type}); setTimeout(() => setToast({show:false, msg:'', type:'success'}), 3000); };
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);

  // Change Password
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm_password: '' });

  // Daily Reports
  const [reports, setReports] = useState([]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportForm, setReportForm] = useState({ report_date: new Date().toISOString().split('T')[0], enrollments_count: '', updates_count: '', remarks: '' });
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportStats, setReportStats] = useState({ totalReports: 0, totalEnrollments: 0, totalUpdates: 0 });

  useEffect(() => { loadDashboard(); }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await axios.get(`${API}/operator/dashboard`, getAuth());
      setDashboardData(res.data);
      if (res.data?.final_approved) {
        loadReports();
      }
    } catch (e) {
      console.error(e);
      try {
        const res2 = await axios.get(`${API}/operator/registration-status`, getAuth());
        setDashboardData(res2.data);
      } catch (e2) {
        setError('Failed to load dashboard. Please refresh.');
      }
    } finally { setLoading(false); }
  };

  const loadReports = async () => {
    try {
      const res = await axios.get(`${API}/daily-reports/my-reports`, getAuth());
      const rpts = res.data.reports || res.data || [];
      setReports(Array.isArray(rpts) ? rpts : []);
      setReportStats({
        totalReports: rpts.length,
        totalEnrollments: rpts.reduce((s, r) => s + (r.enrollments_count || 0), 0),
        totalUpdates: rpts.reduce((s, r) => s + (r.updates_count || 0), 0),
      });
    } catch (e) { console.error(e); }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportForm.enrollments_count && !reportForm.updates_count) { showToast('Enter at least enrollments or updates count', 'error'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('report_date', reportForm.report_date);
      fd.append('enrollments_count', parseInt(reportForm.enrollments_count) || 0);
      fd.append('updates_count', parseInt(reportForm.updates_count) || 0);
      if (reportForm.remarks) fd.append('remarks', reportForm.remarks);
      if (screenshot) fd.append('screenshot', screenshot);
      await axios.post(`${API}/daily-reports/submit`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      showToast(' Daily report submitted!');
      loadDashboard();
      setShowReportForm(false);
      setReportForm({ report_date: new Date().toISOString().split('T')[0], enrollments_count: '', updates_count: '', remarks: '' });
      setScreenshot(null);
      loadReports();
    } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed to submit report')); } finally { setSubmitting(false); }
    loadDashboard();
  };

  const handleChangePassword = async () => {
    if (!pwdForm.new_password || pwdForm.new_password.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    if (pwdForm.new_password !== pwdForm.confirm_password) { showToast('Passwords do not match', 'error'); return; }
    try {
      const fd = new URLSearchParams();
      fd.append('current_password', pwdForm.current_password);
      fd.append('new_password', pwdForm.new_password);
      await axios.post(`${API}/auth/change-password`, fd, { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Authorization': `Bearer ${localStorage.getItem('token')}` } });
      showToast(' Password changed successfully!');
      loadDashboard();
      setShowChangePwd(false);
      setPwdForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (e) { showToast(' ' + (e.response?.data?.detail || 'Failed')); }
    loadDashboard();
  };

  const isApproved = dashboardData?.final_approved;
  const getReviewBadge = (st) => ({ 'pending': { t: '⏳ Pending', bg: '#fff3cd', c: '#856404' }, 'approved': { t: '✅ OK', bg: '#d4edda', c: '#155724' }, 'rejected': { t: '❌ Not OK', bg: '#f8d7da', c: '#721c24' } }[st] || { t: st || 'pending', bg: '#f0f0f0', c: '#666' });

  if (loading) return (<div><Navbar />
      {/* Toast Notification */}
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, animation: 'slideIn 0.3s ease', background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}<div style={{ textAlign: 'center', padding: '60px', fontSize: '18px' }}>⏳ Loading dashboard...</div></div>);
  if (error) return (<div><Navbar /><div style={{ textAlign: 'center', padding: '60px', color: '#dc3545' }}>{error}</div></div>);

  return (
    <div>
      <Navbar />
      <div style={{ padding: '30px 50px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* HEADER */}
        <div style={{ background: 'white', padding: '25px 30px', borderRadius: '15px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ color: '#333', fontSize: '26px', margin: '0 0 5px' }}>
                👤 {user?.full_name || dashboardData?.full_name || 'Operator'} Dashboard
              </h1>
              <p style={{ color: '#666', margin: 0, fontSize: '14px' }}>
                {isApproved ? '✅ Approved Operator — Submit daily reports' : '📋 Complete your registration below'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button onClick={() => setShowChangePwd(true)} style={{
                padding: '8px 16px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600',
              }}>🔐 Change Password</button>
              {isApproved && (
                <span style={{ padding: '6px 16px', background: '#d4edda', color: '#155724', borderRadius: '20px', fontWeight: '600', fontSize: '14px' }}>✅ Active</span>
              )}
            </div>
          </div>
        </div>

        {/* TEMP PASSWORD BANNER */}
        {dashboardData?.is_temp_password && (
          <div style={{ padding: '15px 25px', background: '#fff3cd', borderRadius: '12px', marginBottom: '15px', border: '2px solid #ffc107', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span><strong>⚠️ Temporary Password!</strong> You are using a temporary password. We recommend changing it.</span>
            <button onClick={() => setShowChangePwd(true)} style={{ padding: '8px 18px', background: '#ffc107', color: '#333', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>🔐 Change Now</button>
          </div>
        )}

        {/* OPERATOR DETAILS CARD */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
          {[
            { l: 'Name', v: user?.full_name || dashboardData?.full_name || '—', i: '👤', c: '#667eea' },
            { l: 'Email', v: user?.email || dashboardData?.email || '—', i: '📧', c: '#17a2b8' },
            { l: 'District', v: dashboardData?.district_name || '—', i: '🏛️', c: '#28a745' },
            { l: 'Operator ID', v: dashboardData?.operator_user_id || (isApproved ? 'Check Email' : 'After Approval'), i: '🔑', c: '#ffc107' },
            { l: 'Status', v: isApproved ? '✅ Active' : '⏳ ' + (dashboardData?.registration_status || 'Pending'), i: '📋', c: isApproved ? '#28a745' : '#ffc107' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'white', padding: '18px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderTop: `3px solid ${s.c}` }}>
              <p style={{ color: '#999', fontSize: '11px', margin: '0 0 3px', textTransform: 'uppercase' }}>{s.i} {s.l}</p>
              <p style={{ fontWeight: '600', color: '#333', margin: 0, fontSize: '14px', wordBreak: 'break-all' }}>{s.v}</p>
            </div>
          ))}
        </div>

        {/* BEFORE APPROVAL: REGISTRATION */}
        {!isApproved && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '25px' }}>
              {[
                { l: 'Registration Step', v: `${dashboardData?.current_step || 1}/8`, c: '#667eea', i: '📋' },
                { l: 'Approval', v: dashboardData?.final_approved ? 'Approved' : 'Pending', c: '#ffc107', i: '⏳' },
                { l: 'Documents', v: dashboardData?.documents_approved ? '✅ Approved' : '⏳ Pending', c: dashboardData?.documents_approved ? '#28a745' : '#ffc107', i: '📄' },
                { l: 'Payment', v: dashboardData?.payment_verified ? '✅ Verified' : '⏳ Pending', c: dashboardData?.payment_verified ? '#28a745' : '#ffc107', i: '💰' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.c}` }}>
                  <p style={{ color: '#999', fontSize: '12px', margin: 0 }}>{s.i} {s.l}</p>
                  <p style={{ fontSize: '22px', fontWeight: '700', color: s.c, margin: '5px 0 0' }}>{s.v}</p>
                </div>
              ))}
            </div>
            <RegistrationWizard operatorData={dashboardData?.operator || dashboardData} onUpdate={loadDashboard} />
          </>
        )}

        {/* AFTER APPROVAL: DAILY REPORTS */}
        {isApproved && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '25px' }}>
              {[
                { l: 'Total Reports', v: reportStats.totalReports, c: '#667eea', i: '📊' },
                { l: 'Total Enrollments', v: reportStats.totalEnrollments, c: '#28a745', i: '👶' },
                { l: 'Total Updates', v: reportStats.totalUpdates, c: '#17a2b8', i: '📱' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.c}` }}>
                  <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>{s.i} {s.l}</p>
                  <p style={{ fontSize: '28px', fontWeight: '700', color: s.c, margin: '5px 0 0' }}>{s.v}</p>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: '#333', margin: 0 }}>📊 Daily Reports</h2>
              <button onClick={() => setShowReportForm(!showReportForm)} style={{
                padding: '12px 24px', background: showReportForm ? '#dc3545' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer',
              }}>{showReportForm ? '✕ Cancel' : '➕ Submit Today\'s Report'}</button>
            </div>

            {showReportForm && (
              <div style={{ background: 'white', borderRadius: '15px', padding: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', marginBottom: '25px' }}>
                <h3 style={{ color: '#333', margin: '0 0 20px' }}>📝 Submit Daily Report</h3>
                <form onSubmit={handleSubmitReport}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '5px' }}>📅 Date *</label>
                      <input type="date" value={reportForm.report_date} max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setReportForm({ ...reportForm, report_date: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '5px' }}>👶 Enrollments</label>
                      <input type="number" min="0" value={reportForm.enrollments_count} placeholder="0"
                        onChange={(e) => setReportForm({ ...reportForm, enrollments_count: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '18px', fontWeight: '600', textAlign: 'center' }} />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '5px' }}>📱 Updates</label>
                      <input type="number" min="0" value={reportForm.updates_count} placeholder="0"
                        onChange={(e) => setReportForm({ ...reportForm, updates_count: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '18px', fontWeight: '600', textAlign: 'center' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '5px' }}>📷 Screenshot</label>
                      <div style={{ border: '2px dashed #e0e0e0', borderRadius: '8px', padding: '15px', textAlign: 'center', background: '#f8f9fa', cursor: 'pointer' }}
                        onClick={() => document.getElementById('ss-input').click()}>
                        <input id="ss-input" type="file" accept="image/*" onChange={(e) => setScreenshot(e.target.files[0])} style={{ display: 'none' }} />
                        {screenshot ? <p style={{ color: '#28a745', fontWeight: '600', margin: 0 }}>✅ {screenshot.name}</p> : <p style={{ color: '#666', margin: 0 }}>📷 Click to upload</p>}
                      </div>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: '600', color: '#333', fontSize: '14px', marginBottom: '5px' }}>📝 Remarks</label>
                      <textarea value={reportForm.remarks} onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                        placeholder="Any notes..." rows={3} style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', resize: 'none' }} />
                    </div>
                  </div>
                  <button type="submit" disabled={submitting} style={{
                    padding: '14px 35px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px',
                    fontSize: '16px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
                  }}>{submitting ? 'Submitting...' : '📤 Submit Report'}</button>
                </form>
              </div>
            )}

            <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
              <div style={{ padding: '15px 25px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, color: '#333' }}>📋 My Reports</h3>
                <button onClick={loadReports} style={{ padding: '8px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>🔄 Refresh</button>
              </div>
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                  <div style={{ fontSize: '50px', marginBottom: '10px' }}>📭</div>
                  <p>No reports yet. Submit your first report above!</p>
                </div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                    {['#', 'Date', 'Enrollments', 'Updates', 'Screenshot', 'Review', 'Remarks'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', fontWeight: '600', color: '#555', fontSize: '13px' }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {reports.map((r, idx) => {
                      const b = getReviewBadge(r.review_status);
                      return (
                        <tr key={r.id || idx} style={{ borderBottom: '1px solid #f0f0f0' }}>
                          <td style={{ padding: '13px 16px', color: '#999' }}>{idx + 1}</td>
                          <td style={{ padding: '13px 16px', fontWeight: '600', color: '#333', fontSize: '13px' }}>
                            {r.report_date ? new Date(r.report_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                          </td>
                          <td style={{ padding: '13px 16px' }}><span style={{ fontWeight: '700', color: '#28a745', fontSize: '18px' }}>{r.enrollments_count || 0}</span></td>
                          <td style={{ padding: '13px 16px' }}><span style={{ fontWeight: '700', color: '#17a2b8', fontSize: '18px' }}>{r.updates_count || 0}</span></td>
                          <td style={{ padding: '13px 16px' }}>
                            {r.screenshot_url || r.screenshot_path ? <a href={`${API_URL}${r.screenshot_url || r.screenshot_path}`} target="_blank" rel="noreferrer"
                              style={{ padding: '4px 10px', background: '#667eea', color: 'white', borderRadius: '6px', fontSize: '11px', textDecoration: 'none', fontWeight: '600' }}>📷 View</a> : '—'}
                          </td>
                          <td style={{ padding: '13px 16px' }}><span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: b.bg, color: b.c }}>{b.t}</span></td>
                          <td style={{ padding: '13px 16px', color: '#666', fontSize: '12px' }}>{r.remarks || r.review_remarks || '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* CHANGE PASSWORD MODAL */}
        {showChangePwd && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '15px', maxWidth: '420px', width: '95%', padding: '30px' }}>
              <h3 style={{ margin: '0 0 20px', color: '#333' }}>🔐 Change Password</h3>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Current Password</label>
                <input type="password" value={pwdForm.current_password} onChange={(e) => setPwdForm({ ...pwdForm, current_password: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>New Password (min 8 chars)</label>
                <input type="password" value={pwdForm.new_password} onChange={(e) => setPwdForm({ ...pwdForm, new_password: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontWeight: '600', fontSize: '13px', marginBottom: '4px' }}>Confirm Password</label>
                <input type="password" value={pwdForm.confirm_password} onChange={(e) => setPwdForm({ ...pwdForm, confirm_password: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '2px solid #e0e0e0', borderRadius: '8px' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={handleChangePassword} style={{ flex: 1, padding: '11px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>✅ Change</button>
                <button onClick={() => setShowChangePwd(false)} style={{ flex: 1, padding: '11px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;