// 8-Step Registration Wizard — Rebuilt (Next/Prev Buttons, No Certificate Form, All Flows)

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'; const API = API_URL + '/api/v1';
const getAuth = () => ({ headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } });

const STEPS = [
  { num: 1, name: 'Welcome', icon: '👋' },
  { num: 2, name: 'Certificate', icon: '📜' },
  { num: 3, name: 'Type Selection', icon: '📱' },
  { num: 4, name: 'Documents', icon: '📄' },
  { num: 5, name: 'Doc Approval', icon: '✅' },
  { num: 6, name: 'Payment', icon: '💰' },
  { num: 7, name: 'Payment Verify', icon: '🔍' },
  { num: 8, name: 'Complete', icon: '🎉' },
];

const RegistrationWizard = ({ operatorData, onUpdate }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusData, setStatusData] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Certificate form
  const [hasCertificate, setHasCertificate] = useState(null);
  const [certificateNumber, setCertificateNumber] = useState('');

  // No-certificate form (email to company)
  const [noCertForm, setNoCertForm] = useState({ full_name: '', email: '', phone: '', district: '', message: '' });
  const [noCertSubmitted, setNoCertSubmitted] = useState(false);

  // Operator type
  const [selectedType, setSelectedType] = useState(null);

  // Documents
  const [docNumbers, setDocNumbers] = useState({ nsc_certificate: '', pan_card: '', aadhaar_card: '', police_verification: '' });
  const [uploadedDocs, setUploadedDocs] = useState({ nsc_certificate: false, pan_card: false, aadhaar_card: false, police_verification: false });

  // Payment
  const [paymentData, setPaymentData] = useState(null);
  const [paymentUploadSuccess, setPaymentUploadSuccess] = useState(false);
  const [wizardToast, setWizardToast] = useState({ show: false, msg: '' });
  const showWizardToast = (msg) => { setWizardToast({show: true, msg}); setTimeout(() => setWizardToast({show: false, msg: ''}), 5000); };

  // ============ STATUS → STEP MAPPING ============
  const mapStatusToStep = useCallback((status) => {
    const map = {
      'pending': 1,
      'type_selection': 3,
      'documents_upload': 4,
      'documents_pending': 5,
      'documents_rejected': 4,
      'payment_pending': 6,
      'payment_rejected': 6,
      'payment_verification': 7,
      'completed': 8,
      'approved': 8,
    };
    return map[status] || 1;
  }, []);

  // ============ LOAD STATUS ============
  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/operator/registration-status`, getAuth());
      const data = res.data;
      setStatusData(data);
      setStep(mapStatusToStep(data.registration_status));
      if (data.rejection_reason) setRejectionReason(data.rejection_reason);
      if (data.registration_status === 'documents_upload' || data.registration_status === 'documents_rejected') {
        try {
          const dRes = await axios.get(`${API}/operator/dashboard`, getAuth());
          if (dRes.data?.documents) {
            const u = {};
            dRes.data.documents.forEach(d => { u[d.document_type] = true; });
            setUploadedDocs(prev => ({ ...prev, ...u }));
          }
        } catch (e) {}
      }
      if (data.registration_status === 'payment_pending' || data.registration_status === 'payment_rejected') {
        try {
          const pRes = await axios.get(`${API}/payment/status`, getAuth());
          setPaymentData(pRes.data);
        } catch (e) {}
      }
    } catch (e) {
      console.error(e);
      setStep(1);
    } finally { setLoading(false); }
  }, [mapStatusToStep]);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  // ============ HANDLERS ============

  // Step 2: Certificate
  const handleCertificateSubmit = async (hasCert) => {
    if (hasCert && !certificateNumber.trim()) {
      showWizardToast('Please enter certificate number');
      return;
    }
    try {
      setLoading(true);
      await axios.post(`${API}/operator/certificate-info`, {
        has_certificate: hasCert,
        certificate_number: hasCert ? certificateNumber : null
      }, getAuth());
      if (hasCert) {
        setStep(3);
      }
    } catch (e) {
      showWizardToast(e.response?.data?.detail || 'Failed');
    } finally { setLoading(false); }
  };

  // No certificate form submit (email to company)
  const handleNoCertFormSubmit = async () => {
    if (!noCertForm.full_name || !noCertForm.email || !noCertForm.phone) {
      showWizardToast('Please fill all required fields');
      return;
    }
    try {
      setLoading(true);
      // First set certificate info to false
      await axios.post(`${API}/operator/certificate-info`, {
        has_certificate: false,
        certificate_number: null
      }, getAuth());

      // Send LMS request
      await axios.post(`${API}/operator/request-lms`, null, {
        params: {
          operator_id: operatorData?.operator_id || operatorData?.id || 0,
          full_name: noCertForm.full_name,
          email: noCertForm.email,
          phone: noCertForm.phone,
          district: noCertForm.district
        },
        ...getAuth()
      });
      setNoCertSubmitted(true);
      showWizardToast('Request sent to Click team! They will contact you.');
    } catch (e) {
      showWizardToast(e.response?.data?.detail || 'Failed to send request');
    } finally { setLoading(false); }
  };

  // Step 3: Type selection
  const handleTypeSelect = async (type) => {
    if (!operatorData?.operator_id && !operatorData?.id) {
      showWizardToast('Operator data not loaded. Please refresh.');
      return;
    }
    try {
      setLoading(true);
      setSelectedType(type);
      await axios.post(`${API}/operator/select-type`, {
        operator_type_id: type === 'TAB' ? 1 : 2
      }, getAuth());
      setStep(4);
    } catch (e) {
      showWizardToast(e.response?.data?.detail || 'Failed');
    } finally { setLoading(false); }
  };

  // Step 4: Document upload
  const handleDocUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!docNumbers[docType]) {
      showWizardToast(`Enter ${docType.replace(/_/g, ' ')} number first`);
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('operator_id', operatorData?.operator_id || operatorData?.id);
    fd.append('document_type', docType);
    fd.append('document_number', docNumbers[docType]);
    try {
      setLoading(true);
      await axios.post(`${API}/upload/document`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setUploadedDocs(prev => ({ ...prev, [docType]: true }));
      showWizardToast(`${docType.replace(/_/g, ' ')} uploaded!`);
    } catch (e) {
      showWizardToast(e.response?.data?.detail || 'Upload failed');
    } finally { setLoading(false); }
  };

  const allDocsUploaded = uploadedDocs.nsc_certificate && uploadedDocs.pan_card && uploadedDocs.aadhaar_card && uploadedDocs.police_verification;

  const handleSubmitDocs = async () => {
    try {
      setLoading(true);
      await axios.post(`${API}/operator/submit-documents`, {}, getAuth());
      showWizardToast('Documents submitted for review!');
      setStep(5);
    } catch (e) { showWizardToast(e.response?.data?.detail || 'Failed'); } finally { setLoading(false); }
  };

  // Step 6: Payment screenshot
  const handlePaymentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const txnId = document.getElementById('txn_id')?.value || '';
    const fd = new FormData();
    fd.append('file', file);
    if (txnId) fd.append('transaction_id', txnId);
    try {
      setLoading(true);
      await axios.post(`${API}/payment/upload-screenshot`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setPaymentUploadSuccess(true);
      showWizardToast('Payment screenshot uploaded successfully! It will be verified by our team.');
      setStep(7);
    } catch (e) { showWizardToast(e.response?.data?.detail || 'Failed'); } finally { setLoading(false); }
  };

  // ============ STYLES ============
  const s = {
    card: { background: 'white', padding: '35px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)' },
    btnPrimary: { padding: '14px 35px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '600', cursor: 'pointer' },
    btnSecondary: { padding: '14px 35px', background: '#f0f0f0', color: '#333', border: 'none', borderRadius: '10px', fontSize: '16px', fontWeight: '500', cursor: 'pointer' },
    btnDisabled: { padding: '14px 35px', background: '#e0e0e0', color: '#999', border: 'none', borderRadius: '10px', fontSize: '16px', cursor: 'not-allowed' },
    input: { width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', marginTop: '5px' },
    alert: (type) => ({
      padding: '15px 20px', borderRadius: '10px', marginBottom: '20px',
      background: type === 'info' ? '#e3f2fd' : type === 'warning' ? '#fff3cd' : type === 'success' ? '#d4edda' : type === 'danger' ? '#f8d7da' : '#f8f9fa',
      color: type === 'info' ? '#1565c0' : type === 'warning' ? '#856404' : type === 'success' ? '#155724' : type === 'danger' ? '#721c24' : '#333',
    }),
    docCard: (done) => ({ padding: '20px', background: '#f8f9fa', borderRadius: '12px', border: done ? '2px solid #28a745' : '2px solid #e0e0e0', marginBottom: '15px' }),
    typeCard: (selected) => ({ padding: '25px', background: selected ? '#e8eaf6' : '#f8f9fa', borderRadius: '15px', border: selected ? '3px solid #667eea' : '2px solid #e0e0e0', cursor: 'pointer', marginBottom: '15px', transition: 'all 0.3s' }),
  };

  const docLabels = { nsc_certificate: '📜 NSC Certificate', pan_card: '💳 PAN Card', aadhaar_card: '🆔 Aadhaar Card', police_verification: '👮 Police Verification' };

  // ============ LOADING ============
  if (step === 0 || (loading && step === 0)) {
    return (
    <>
    {wizardToast.show && <div style={{ position: 'fixed', top: '20px', right: '20px', padding: '16px 28px', borderRadius: '12px', color: 'white', fontSize: '14px', fontWeight: '600', zIndex: 9999, background: '#16a34a', boxShadow: '0 4px 16px rgba(0,0,0,0.2)' }}>✅ {wizardToast.msg}</div>}<div style={{ ...s.card, textAlign: 'center', padding: '60px' }}><div style={{ fontSize: '40px' }}>⏳</div><p>Loading registration status...</p></div></>);
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* PROGRESS BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '30px', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.08)', overflowX: 'auto' }}>
        {STEPS.map((st) => {
          const isActive = step === st.num;
          const isDone = step > st.num;
          return (
            <div key={st.num} style={{ textAlign: 'center', minWidth: '65px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 5px', fontWeight: 'bold', fontSize: '14px',
                background: isDone ? '#28a745' : isActive ? '#667eea' : '#e0e0e0',
                color: isDone || isActive ? 'white' : '#999',
              }}>{isDone ? '✓' : st.num}</div>
              <div style={{ fontSize: '10px', color: isActive ? '#667eea' : '#999', fontWeight: isActive ? '700' : '400' }}>{st.name}</div>
            </div>
          );
        })}
      </div>

      {/* ============ STEP 1: WELCOME ============ */}
      {step === 1 && (
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>🎉</div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Welcome to Click Portal!</h2>
            <p style={{ color: '#666', marginBottom: '25px', fontSize: '16px' }}>
              Complete your registration in a few simple steps to become an authorized Aadhaar operator.
            </p>
            <div style={s.alert('info')}>
              <strong>📋 You will need:</strong><br />
              1. NSC Certificate (or request one)<br />
              2. PAN Card<br />
              3. Aadhaar Card<br />
              4. Police Verification Document<br />
              5. ₹50,000 Security Deposit
            </div>
            <button onClick={() => setStep(2)} style={s.btnPrimary}>
              🚀 Start Registration →
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 2: CERTIFICATE ============ */}
      {step === 2 && (
        <div style={s.card}>
          <h2 style={{ color: '#333', marginBottom: '5px' }}>📜 Step 2: NSC Certificate</h2>
          <p style={{ color: '#666', marginBottom: '25px' }}>Do you have an NSC (National Skill Certificate) for Aadhaar operations?</p>

          {hasCertificate === null && (
            <div style={{ display: 'flex', gap: '15px' }}>
              <div onClick={() => setHasCertificate(true)} style={{ ...s.typeCard(false), flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>✅</div>
                <h3 style={{ color: '#28a745' }}>Yes, I have it</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>I have NSC certificate ready</p>
              </div>
              <div onClick={() => setHasCertificate(false)} style={{ ...s.typeCard(false), flex: 1, textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>❌</div>
                <h3 style={{ color: '#dc3545' }}>No, I don't</h3>
                <p style={{ color: '#666', fontSize: '14px' }}>I need to get certificate first</p>
              </div>
            </div>
          )}

          {/* YES — Enter certificate number */}
          {hasCertificate === true && (
            <div>
              <div style={s.alert('success')}>✅ Great! Enter your certificate number below.</div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', color: '#333' }}>Certificate Number *</label>
                <input type="text" value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)}
                  placeholder="Enter NSC certificate number" style={s.input} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => { setHasCertificate(null); setCertificateNumber(''); }} style={s.btnSecondary}>← Back</button>
                <button onClick={() => handleCertificateSubmit(true)} disabled={!certificateNumber.trim() || loading}
                  style={certificateNumber.trim() && !loading ? s.btnPrimary : s.btnDisabled}>
                  {loading ? 'Saving...' : 'Next → Type Selection'}
                </button>
              </div>
            </div>
          )}

          {/* NO — Fill form, email goes to company */}
          {hasCertificate === false && !noCertSubmitted && (
            <div>
              <div style={s.alert('warning')}>
                <strong>⚠️ Certificate Required</strong><br />
                Fill the form below. Click team will help you get your NSC certificate. Your details will be emailed to the team.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Full Name *</label>
                  <input type="text" value={noCertForm.full_name} onChange={(e) => setNoCertForm({ ...noCertForm, full_name: e.target.value })}
                    placeholder="Your full name" style={s.input} />
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Email *</label>
                  <input type="email" value={noCertForm.email} onChange={(e) => setNoCertForm({ ...noCertForm, email: e.target.value })}
                    placeholder="your@email.com" style={s.input} />
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Phone *</label>
                  <input type="tel" value={noCertForm.phone} onChange={(e) => setNoCertForm({ ...noCertForm, phone: e.target.value })}
                    placeholder="9876543210" style={s.input} />
                </div>
                <div>
                  <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>District</label>
                  <input type="text" value={noCertForm.district} onChange={(e) => setNoCertForm({ ...noCertForm, district: e.target.value })}
                    placeholder="e.g. Jaipur" style={s.input} />
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Additional Message</label>
                <textarea value={noCertForm.message} onChange={(e) => setNoCertForm({ ...noCertForm, message: e.target.value })}
                  placeholder="Any additional info..." rows={3}
                  style={{ ...s.input, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setHasCertificate(null)} style={s.btnSecondary}>← Back</button>
                <button onClick={handleNoCertFormSubmit} disabled={loading}
                  style={!loading ? { ...s.btnPrimary, background: '#28a745' } : s.btnDisabled}>
                  {loading ? 'Sending...' : '📧 Send Request to Click Team'}
                </button>
              </div>
            </div>
          )}

          {/* No cert — form submitted */}
          {hasCertificate === false && noCertSubmitted && (
            <div style={{ textAlign: 'center' }}>
              <div style={s.alert('success')}>
                <strong>✅ Request Sent!</strong><br />
                Click team will contact you regarding your NSC certificate. Once you have it, come back and continue registration.
              </div>
              <p style={{ color: '#666', fontSize: '14px' }}>📧 Email sent to: admin@clickportal.com</p>
              <button onClick={() => { setHasCertificate(null); setNoCertSubmitted(false); }} style={s.btnSecondary}>
                ← I now have certificate, continue
              </button>
            </div>
          )}

          {/* Back to step 1 */}
          {hasCertificate === null && (
            <div style={{ marginTop: '20px' }}>
              <button onClick={() => setStep(1)} style={s.btnSecondary}>← Back to Welcome</button>
            </div>
          )}
        </div>
      )}

      {/* ============ STEP 3: TYPE SELECTION ============ */}
      {step === 3 && (
        <div style={s.card}>
          <h2 style={{ color: '#333', marginBottom: '5px' }}>📱 Step 3: Operator Type</h2>
          <p style={{ color: '#666', marginBottom: '25px' }}>Select which type of Aadhaar operator you want to be:</p>
          <div style={{ display: 'flex', gap: '15px' }}>
            <div onClick={() => !loading && handleTypeSelect('TAB')} style={{ ...s.typeCard(selectedType === 'TAB'), flex: 1 }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📱</div>
              <h3 style={{ color: '#667eea', marginBottom: '5px' }}>TAB Operator</h3>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                Use tablet device for Aadhaar services.<br />
                • New enrollment (0-5 yrs, FREE)<br />
                • Mobile number update (₹75)
              </p>
            </div>
            <div onClick={() => !loading && handleTypeSelect('ECMP')} style={{ ...s.typeCard(selectedType === 'ECMP'), flex: 1 }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🖥️</div>
              <h3 style={{ color: '#667eea', marginBottom: '5px' }}>ECMP Operator</h3>
              <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>
                Use desktop system for full Aadhaar services.<br />
                • All enrollment types<br />
                • All update types
              </p>
            </div>
          </div>
          {loading && <p style={{ textAlign: 'center', color: '#667eea', marginTop: '15px' }}>Saving...</p>}
          <div style={{ marginTop: '20px' }}>
            <button onClick={() => setStep(2)} style={s.btnSecondary}>← Back to Certificate</button>
          </div>
        </div>
      )}

      {/* ============ STEP 4: DOCUMENTS ============ */}
      {step === 4 && (
        <div style={s.card}>
          <h2 style={{ color: '#333', marginBottom: '5px' }}>📄 Step 4: Upload Documents</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>Upload all 4 required documents with their numbers.</p>

          {rejectionReason && (
            <div style={s.alert('danger')}>
              <strong>❌ Documents Rejected:</strong> {rejectionReason}<br />
              Please re-upload the required documents.
            </div>
          )}

          {Object.keys(docLabels).map(docType => (
            <div key={docType} style={s.docCard(uploadedDocs[docType])}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, color: '#333' }}>{docLabels[docType]}</h4>
                {uploadedDocs[docType] && <span style={{ color: '#28a745', fontWeight: '600', fontSize: '14px' }}>✅ Uploaded</span>}
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input type="text" value={docNumbers[docType]} onChange={(e) => setDocNumbers({ ...docNumbers, [docType]: e.target.value })}
                  placeholder={`Enter ${docType.replace(/_/g, ' ')} number`}
                  style={{ ...s.input, flex: 1, marginTop: 0 }} />
                <label style={{
                  padding: '10px 20px', background: uploadedDocs[docType] ? '#28a745' : '#667eea', color: 'white',
                  borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap'
                }}>
                  {uploadedDocs[docType] ? '🔄 Re-upload' : '📤 Upload'}
                  <input type="file" accept="image/*,.pdf" onChange={(e) => handleDocUpload(e, docType)} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button onClick={() => setStep(3)} style={s.btnSecondary}>← Back</button>
            <button onClick={handleSubmitDocs} disabled={!allDocsUploaded || loading}
              style={allDocsUploaded && !loading ? { ...s.btnPrimary, background: '#28a745' } : s.btnDisabled}>
              {loading ? 'Submitting...' : allDocsUploaded ? '📤 Submit for Review →' : `Upload all 4 docs first (${Object.values(uploadedDocs).filter(Boolean).length}/4)`}
            </button>
          </div>
        </div>
      )}

      {/* ============ STEP 5: WAITING APPROVAL ============ */}
      {step === 5 && (
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>⏳</div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Waiting for Document Approval</h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>
              Your documents have been submitted and are being reviewed by the district supervisor.<br />
              You will be notified once they are approved.
            </p>
            <div style={s.alert('info')}>
              <strong>📋 Status:</strong> Documents Under Review<br />
              <strong>⏰ Estimated Time:</strong> 1-2 business days
            </div>
            <button onClick={() => { loadStatus(); if (onUpdate) onUpdate(); }} style={s.btnPrimary}>🔄 Refresh Status</button>
          </div>
        </div>
      )}

      {/* ============ STEP 6: PAYMENT ============ */}
      {step === 6 && (
        <div style={s.card}>
          <h2 style={{ color: '#333', marginBottom: '5px' }}>💰 Step 6: Security Deposit</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Your documents are approved! Pay ₹50,000 security deposit.</p>

          {rejectionReason && statusData?.registration_status === 'payment_rejected' && (
            <div style={s.alert('danger')}>
              <strong>❌ Payment Rejected:</strong> {rejectionReason}<br />
              Please re-upload a clear payment screenshot.
            </div>
          )}

          <div style={s.alert('success')}>✅ Documents approved! Now proceed with payment.</div>

          <div style={{ textAlign: 'center', marginBottom: '25px', padding: '20px', background: '#f0f4ff', borderRadius: '12px' }}>
              <p style={{ fontWeight: '600', color: '#333', marginBottom: '12px', fontSize: '16px' }}>📱 Scan QR Code to Pay</p>
              <img src={`${API_URL}/uploads/qr_codes/payment_qr.png`} alt="Payment QR Code"
                style={{ maxWidth: '220px', border: '3px solid #667eea', borderRadius: '12px', padding: '8px', background: 'white' }}
                onError={(e) => { e.target.style.display = 'none'; }} />
              {paymentData?.qr_code_url && (
                <img src={`${API_URL}${paymentData.qr_code_url}`} alt="QR Code"
                  style={{ maxWidth: '220px', border: '3px solid #667eea', borderRadius: '12px', padding: '8px', background: 'white', display: 'block', margin: '10px auto' }}
                  onError={(e) => { e.target.style.display = 'none'; }} />
              )}
              <p style={{ color: '#667eea', fontWeight: '700', fontSize: '28px', marginTop: '12px' }}>₹50,000</p>
              <div style={{ marginTop: '10px', padding: '10px', background: 'white', borderRadius: '8px', border: '1px solid #e0e0e0' }}>
                <p style={{ fontSize: '13px', color: '#666', margin: '0 0 4px' }}>Or pay manually to UPI ID:</p>
                <p style={{ fontSize: '16px', fontWeight: '700', color: '#333', margin: 0 }}>click@paytm</p>
              </div>
          </div>

          <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', marginBottom: '20px' }}>
            <h4 style={{ color: '#333', marginBottom: '10px' }}>📷 Upload Payment Screenshot</h4>
            <p style={{ color: '#666', fontSize: '13px', marginBottom: '10px' }}>After making payment, upload a clear screenshot showing the transaction.</p>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ fontWeight: '600', color: '#333', fontSize: '14px' }}>Transaction ID / UTR Number</label>
              <input type="text" id="txn_id" placeholder="Enter transaction ID or UTR number"
                style={{ width: '100%', padding: '12px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', marginTop: '5px' }} />
            </div>
            {paymentUploadSuccess && (
              <div style={{ padding: '12px 20px', background: '#d4edda', borderRadius: '10px', marginBottom: '15px', color: '#155724', fontWeight: '600' }}>
                ✅ Payment screenshot uploaded successfully! It will be verified by our team.
              </div>
            )}
            <label style={{ display: 'inline-block', padding: '12px 25px', background: loading ? '#ccc' : '#667eea', color: 'white', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
              {loading ? '⏳ Uploading...' : '📤 Choose Screenshot'}
              <input type="file" accept="image/*" onChange={handlePaymentUpload} style={{ display: 'none' }} disabled={loading} />
            </label>
          </div>

          <button onClick={() => setStep(5)} style={s.btnSecondary}>← Back</button>
        </div>
      )}

      {/* ============ STEP 7: PAYMENT VERIFICATION ============ */}
      {step === 7 && (
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>🔍</div>
            <h2 style={{ color: '#333', marginBottom: '10px' }}>Payment Verification in Progress</h2>
            <p style={{ color: '#666', marginBottom: '25px' }}>
              Your payment screenshot has been submitted. The accountant will verify it shortly.
            </p>
            <div style={s.alert('info')}>
              <strong>💰 Amount:</strong> ₹50,000<br />
              <strong>📋 Status:</strong> Payment Under Verification<br />
              <strong>⏰ Estimated Time:</strong> 1-2 business days
            </div>
            <button onClick={() => { loadStatus(); if (onUpdate) onUpdate(); }} style={s.btnPrimary}>🔄 Refresh Status</button>
          </div>
        </div>
      )}

      {/* ============ STEP 8: COMPLETE ============ */}
      {step === 8 && (
        <div style={s.card}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '60px', marginBottom: '15px' }}>🎉</div>
            <h2 style={{ color: '#28a745', marginBottom: '10px' }}>Registration Complete!</h2>
            <p style={{ color: '#666', marginBottom: '20px' }}>
              Congratulations! Your registration is fully approved.<br />
              Your operator credentials have been sent to your email.
            </p>
            <div style={s.alert('success')}>
              <strong>✅ What's Next:</strong><br />
              1. Check your email for Operator ID & Password<br />
              2. Login with your new Operator ID<br />
              3. You'll be called to HQ to receive your TAB device<br />
              4. Start submitting daily reports!
            </div>
            <button onClick={() => { if (onUpdate) onUpdate(); }} style={s.btnPrimary}>🔄 Go to Dashboard</button>
          </div>
        </div>
      )}
    </div>
  
  );
};

export default RegistrationWizard;