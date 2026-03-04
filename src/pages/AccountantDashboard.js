// Accountant Dashboard - Payment Verification with Approve/Reject

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

const AccountantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
  const showToast = (msg, type='success') => { setToast({show:true, msg, type}); setTimeout(() => setToast({show:false, msg:'', type:'success'}), 3000); };
  const [dashboardData, setDashboardData] = useState(null);
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('screenshot_uploaded');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { loadDashboard(); }, []);
  useEffect(() => { loadPayments(); }, [activeTab]);

  const loadDashboard = async () => {
    try {
      const response = await axios.get(`${API}/accountant/dashboard`, getAuth());
      setDashboardData(response.data);
    } catch (error) { console.error('Failed:', error); } finally { setLoading(false); }
  };

  const loadPayments = async () => {
    try {
      const params = activeTab !== 'all' ? { status: activeTab } : {};
      const response = await axios.get(`${API}/accountant/payments`, { params, ...getAuth() });
      setPayments(response.data.payments || []);
    } catch (error) { console.error('Failed:', error); setPayments([]); }
  };

  const viewPaymentDetails = async (paymentId) => {
    try {
      const response = await axios.get(`${API}/accountant/payment/${paymentId}`, getAuth());
      setSelectedPayment(response.data);
      setShowModal(true);
    } catch (error) { console.error('Failed:', error); }
  };

  const handleVerify = async (paymentId) => {
    if (!window.confirm('Verify this payment? Operator will be FULLY APPROVED.')) return;
    try {
      await axios.post(`${API}/accountant/payment/${paymentId}/verify`, {}, getAuth());
      showToast(' Payment verified! Operator approved.');
      loadDashboard();
      setShowModal(false);
      loadPayments();
      loadDashboard();
    } catch (error) { showToast(' Failed: ' + (error.response?.data?.detail || 'Error')); }
    loadDashboard();
  };

  const handleReject = async (paymentId) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await axios.post(`${API}/accountant/payment/${paymentId}/reject?reason=${encodeURIComponent(reason)}`, {}, getAuth());
      showToast(' Payment rejected. Operator will re-upload.');
      loadDashboard();
      setShowModal(false);
      loadPayments();
      loadDashboard();
    } catch (error) { showToast(' Failed: ' + (error.response?.data?.detail || 'Error')); }
    loadDashboard();
  };

  const getStatusBadge = (status) => {
    const map = {
      'screenshot_uploaded': { text: '⏳ Pending Review', color: '#856404', bg: '#fff3cd' },
      'verified': { text: '✅ Verified', color: '#155724', bg: '#d4edda' },
      'rejected': { text: '❌ Rejected', color: '#721c24', bg: '#f8d7da' },
      'pending': { text: '🔄 Awaiting Upload', color: '#666', bg: '#f0f0f0' },
      'qr_generated': { text: '📱 QR Generated', color: '#0c5460', bg: '#d1ecf1' },
    };
    return map[status] || { text: status, color: '#666', bg: '#f0f0f0' };
  };

  const filteredPayments = payments.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.operator_name?.toLowerCase().includes(q) || p.operator_email?.toLowerCase().includes(q) || p.district_name?.toLowerCase().includes(q);
  });

  return (
    <div>
      <Navbar />
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
      {/* Toast Notification */}
      {toast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '14px 24px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '500', zIndex: 9999, animation: 'slideIn 0.3s ease', background: toast.type === 'success' ? '#16a34a' : '#dc2626', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>{toast.type === 'success' ? '✅' : '❌'} {toast.msg}</div>}
      <div style={{ padding: '30px 50px', maxWidth: '1600px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ background: 'white', padding: '25px 30px', borderRadius: '15px', marginBottom: '25px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>
          <h1 style={{ color: '#333', fontSize: '26px', margin: 0 }}>💰 Accountant Dashboard</h1>
          <p style={{ color: '#666', margin: '5px 0 0', fontSize: '14px' }}>Payment Verification & Revenue Management</p>
        </div>

        {/* Stats */}
        {dashboardData && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '25px' }}>
            {[
              { label: 'Total Revenue', value: `₹${dashboardData.total_revenue?.toLocaleString() || 0}`, color: '#667eea', icon: '💵' },
              { label: 'Verified', value: dashboardData.verified_payments || 0, color: '#28a745', icon: '✅' },
              { label: 'Pending Review', value: dashboardData.pending_verification || 0, color: '#ffc107', icon: '⏳' },
              { label: 'Rejected', value: dashboardData.rejected_payments || 0, color: '#dc3545', icon: '❌' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.color}` }}>
                <p style={{ color: '#999', fontSize: '13px', margin: 0 }}>{s.icon} {s.label}</p>
                <p style={{ fontSize: '28px', fontWeight: '700', color: s.color, margin: '5px 0 0' }}>{s.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div style={{ background: 'white', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' }}>

          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #f0f0f0' }}>
            {[
              { key: 'screenshot_uploaded', label: `⏳ Pending (${dashboardData?.pending_verification || 0})` },
              { key: 'verified', label: `✅ Verified (${dashboardData?.verified_payments || 0})` },
              { key: 'rejected', label: `❌ Rejected (${dashboardData?.rejected_payments || 0})` },
              { key: 'all', label: `📋 All (${dashboardData?.total_payments || 0})` },
            ].map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
                flex: 1, padding: '16px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px',
                background: activeTab === tab.key ? '#667eea' : 'transparent',
                color: activeTab === tab.key ? 'white' : '#666',
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Search */}
          <div style={{ padding: '15px 25px', background: '#f8f9fa', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '15px' }}>
            <input type="text" placeholder="🔍 Search by operator name, email, district..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ flex: 1, padding: '10px 15px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px' }} />
            <button onClick={() => { loadPayments(); loadDashboard(); }} style={{ padding: '10px 20px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>🔄 Refresh</button>
          </div>

          {/* Table Content */}
          <div>
            {filteredPayments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px', color: '#999' }}>
                <div style={{ fontSize: '50px', marginBottom: '10px' }}>📭</div>
                No payments found
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa', textAlign: 'left' }}>
                    {['#', 'Operator', 'District', 'Amount', 'Status', 'Date', 'Action'].map(h => (
                      <th key={h} style={{ padding: '13px 16px', fontWeight: '600', color: '#555', fontSize: '13px' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p, idx) => {
                    const badge = getStatusBadge(p.payment_status);
                    return (
                      <tr key={p.payment_id} style={{ borderBottom: '1px solid #f0f0f0', cursor: 'pointer' }}
                        onClick={() => viewPaymentDetails(p.payment_id)}
                        onMouseOver={(e) => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'white'}>
                        <td style={{ padding: '13px 16px', fontWeight: '600', color: '#999' }}>{idx + 1}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ fontWeight: '600', color: '#333' }}>{p.operator_name}</div>
                          <div style={{ fontSize: '12px', color: '#999' }}>{p.operator_email}</div>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#666', fontSize: '13px' }}>{p.district_name}</td>
                        <td style={{ padding: '13px 16px', fontWeight: '700', color: '#28a745', fontSize: '16px' }}>₹{p.amount?.toLocaleString()}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: badge.bg, color: badge.color }}>{badge.text}</span>
                        </td>
                        <td style={{ padding: '13px 16px', color: '#666', fontSize: '13px' }}>{p.uploaded_at ? new Date(p.uploaded_at).toLocaleDateString('en-IN') : '-'}</td>
                        <td style={{ padding: '13px 16px' }}>
                          <button onClick={(e) => { e.stopPropagation(); viewPaymentDetails(p.payment_id); }}
                            style={{ padding: '7px 16px', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' }}>
                            👁️ View
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ===== PAYMENT DETAIL MODAL ===== */}
        {showModal && selectedPayment && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: 'white', borderRadius: '20px', maxWidth: '750px', width: '95%', maxHeight: '92vh', overflow: 'auto' }}>

              {/* Header */}
              <div style={{ padding: '25px 30px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '20px 20px 0 0', color: 'white' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '22px' }}>Payment #{selectedPayment.payment_id}</h2>
                    <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '14px' }}>{selectedPayment.operator_name} • {selectedPayment.district_name}</p>
                  </div>
                  <button onClick={() => setShowModal(false)} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px' }}>✕</button>
                </div>
              </div>

              <div style={{ padding: '25px 30px' }}>

                {/* Operator Info */}
                <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '16px' }}>👤 Operator Details</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                  {[
                    { label: 'Name', value: selectedPayment.operator_name },
                    { label: 'Email', value: selectedPayment.operator_email },
                    { label: 'Phone', value: selectedPayment.operator_phone || 'N/A' },
                    { label: 'District', value: selectedPayment.district_name },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: '12px 15px', background: '#f8f9fa', borderRadius: '10px' }}>
                      <p style={{ fontSize: '11px', color: '#999', margin: '0 0 3px', textTransform: 'uppercase' }}>{item.label}</p>
                      <p style={{ fontWeight: '600', color: '#333', margin: 0, fontSize: '14px' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Payment Info */}
                <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '16px', borderTop: '2px solid #f0f0f0', paddingTop: '20px' }}>💰 Payment Information</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '25px' }}>
                  <div style={{ padding: '15px', background: '#d4edda', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: '#155724', margin: '0 0 3px' }}>AMOUNT</p>
                    <p style={{ fontWeight: '700', color: '#155724', margin: 0, fontSize: '24px' }}>₹{selectedPayment.amount?.toLocaleString()}</p>
                  </div>
                  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: '#999', margin: '0 0 3px' }}>TRANSACTION ID</p>
                    <p style={{ fontWeight: '600', color: '#333', margin: 0, fontSize: '14px' }}>{selectedPayment.transaction_id || 'N/A'}</p>
                  </div>
                  <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '10px', textAlign: 'center' }}>
                    <p style={{ fontSize: '11px', color: '#999', margin: '0 0 3px' }}>STATUS</p>
                    {(() => { const b = getStatusBadge(selectedPayment.payment_status); return (<span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: b.bg, color: b.color }}>{b.text}</span>); })()}
                  </div>
                </div>

                {/* Screenshot */}
                {selectedPayment.payment_screenshot_url && (
                  <div style={{ marginBottom: '25px' }}>
                    <h3 style={{ color: '#333', marginBottom: '15px', fontSize: '16px' }}>📸 Payment Screenshot</h3>
                    <div style={{ border: '2px solid #e0e0e0', borderRadius: '12px', overflow: 'hidden', textAlign: 'center', background: '#f8f9fa', padding: '10px' }}>
                      <img src={`${API_URL}${selectedPayment.payment_screenshot_url}`} alt="Payment Screenshot"
                        style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '8px' }} />
                    </div>
                    <a href={`${API_URL}${selectedPayment.payment_screenshot_url}`} target="_blank" rel="noreferrer"
                      style={{ display: 'inline-block', marginTop: '10px', padding: '8px 16px', background: '#667eea', color: 'white', borderRadius: '8px', fontSize: '13px', textDecoration: 'none', fontWeight: '600' }}>
                      📥 Open Full Image
                    </a>
                  </div>
                )}

                {/* Rejection Reason */}
                {selectedPayment.rejection_reason && (
                  <div style={{ padding: '15px', background: '#f8d7da', borderRadius: '10px', marginBottom: '25px' }}>
                    <p style={{ color: '#721c24', margin: 0 }}><strong>Rejection Reason:</strong> {selectedPayment.rejection_reason}</p>
                  </div>
                )}

                {/* Verified Info */}
                {selectedPayment.verified_by_name && (
                  <div style={{ padding: '15px', background: '#d4edda', borderRadius: '10px', marginBottom: '25px' }}>
                    <p style={{ color: '#155724', margin: 0 }}><strong>Verified by:</strong> {selectedPayment.verified_by_name} on {selectedPayment.verified_at ? new Date(selectedPayment.verified_at).toLocaleString('en-IN') : 'N/A'}</p>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ borderTop: '2px solid #f0f0f0', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedPayment.payment_status === 'screenshot_uploaded' && (
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => handleVerify(selectedPayment.payment_id)}
                        style={{ flex: 1, padding: '14px', background: '#28a745', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                        ✅ Verify Payment — Approve Operator
                      </button>
                      <button onClick={() => handleReject(selectedPayment.payment_id)}
                        style={{ flex: 1, padding: '14px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
                        ❌ Reject Payment
                      </button>
                    </div>
                  )}
                  <button onClick={() => setShowModal(false)}
                    style={{ padding: '12px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '10px', fontSize: '14px', cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountantDashboard;