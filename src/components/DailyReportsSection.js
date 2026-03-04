// Daily Reports Section - Submit & View Reports

import React, { useState, useEffect } from 'react';
import { dailyReportAPI } from '../services/api';

const DailyReportsSection = () => {
  const [activeView, setActiveView] = useState('submit'); // submit, history, summary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Submit Report
  const [reportData, setReportData] = useState({
    enrollments_count: '',
    updates_count: '',
    remarks: '',
  });

  // Reports History
  const [reports, setReports] = useState([]);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (activeView === 'history') {
      loadReports();
    }
    if (activeView === 'summary') {
      loadSummary();
    }
  }, [activeView]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await dailyReportAPI.getMyReports({ limit: 30 });
      setReports(response.data.reports || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async () => {
    setLoading(true);
    try {
      const response = await dailyReportAPI.getMySummary();
      setSummary(response.data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await dailyReportAPI.submitReport({
        enrollments_count: parseInt(reportData.enrollments_count),
        updates_count: parseInt(reportData.updates_count),
        remarks: reportData.remarks || null,
      });

      setSuccess('Report submitted successfully! ✅');
      setReportData({
        enrollments_count: '',
        updates_count: '',
        remarks: '',
      });

      // Reload if on history view
      if (activeView === 'history') {
        setTimeout(loadReports, 1000);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '30px',
        borderBottom: '2px solid #f0f0f0',
      }}>
        <button
          onClick={() => setActiveView('submit')}
          style={{
            padding: '15px 30px',
            background: activeView === 'submit' ? '#667eea' : 'transparent',
            color: activeView === 'submit' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeView === 'submit' ? '3px solid #667eea' : 'none',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          📝 Submit Today's Report
        </button>
        <button
          onClick={() => setActiveView('history')}
          style={{
            padding: '15px 30px',
            background: activeView === 'history' ? '#667eea' : 'transparent',
            color: activeView === 'history' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeView === 'history' ? '3px solid #667eea' : 'none',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          📊 Report History
        </button>
        <button
          onClick={() => setActiveView('summary')}
          style={{
            padding: '15px 30px',
            background: activeView === 'summary' ? '#667eea' : 'transparent',
            color: activeView === 'summary' ? 'white' : '#666',
            border: 'none',
            borderBottom: activeView === 'summary' ? '3px solid #667eea' : 'none',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          📈 Summary
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-danger" style={{ marginBottom: '20px' }}>
          ❌ {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success" style={{ marginBottom: '20px' }}>
          ✅ {success}
        </div>
      )}

      {/* SUBMIT REPORT VIEW */}
      {activeView === 'submit' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>📝 Submit Today's Work Report</h3>
          <p style={{ color: '#666', marginBottom: '30px' }}>
            Enter your work details for today - {new Date().toLocaleDateString('en-IN', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>

          <form onSubmit={handleSubmitReport}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Enrollments Count *</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={reportData.enrollments_count}
                  onChange={(e) => setReportData({...reportData, enrollments_count: e.target.value})}
                  required
                  placeholder="Enter number of enrollments"
                />
                <small style={{ color: '#999', fontSize: '12px' }}>
                  Number of new enrollments completed today
                </small>
              </div>

              <div className="form-group">
                <label>Updates Count *</label>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  value={reportData.updates_count}
                  onChange={(e) => setReportData({...reportData, updates_count: e.target.value})}
                  required
                  placeholder="Enter number of updates"
                />
                <small style={{ color: '#999', fontSize: '12px' }}>
                  Number of updates/corrections done today
                </small>
              </div>
            </div>

            <div className="form-group" style={{ marginTop: '20px' }}>
              <label>Remarks (Optional)</label>
              <textarea
                value={reportData.remarks}
                onChange={(e) => setReportData({...reportData, remarks: e.target.value})}
                rows="4"
                maxLength="500"
                placeholder="Add any additional notes or remarks about today's work..."
                style={{ resize: 'vertical' }}
              />
              <small style={{ color: '#999', fontSize: '12px' }}>
                {reportData.remarks.length}/500 characters
              </small>
            </div>

            {/* Summary Preview */}
            {(reportData.enrollments_count || reportData.updates_count) && (
              <div style={{
                marginTop: '30px',
                padding: '20px',
                background: '#f8f9fa',
                borderRadius: '15px',
                border: '2px solid #e0e0e0',
              }}>
                <h4 style={{ marginBottom: '15px', color: '#667eea' }}>Report Preview:</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px' }}>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Enrollments
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#28a745' }}>
                      {reportData.enrollments_count || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Updates
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#17a2b8' }}>
                      {reportData.updates_count || 0}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#999', marginBottom: '5px' }}>
                      Total Work
                    </p>
                    <p style={{ fontSize: '32px', fontWeight: 'bold', color: '#667eea' }}>
                      {parseInt(reportData.enrollments_count || 0) + parseInt(reportData.updates_count || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ 
                marginTop: '30px',
                width: '100%',
                padding: '15px',
                fontSize: '16px',
              }}
            >
              {loading ? 'Submitting...' : 'Submit Report ✓'}
            </button>
          </form>

          <div className="alert alert-info" style={{ marginTop: '30px' }}>
            ℹ️ <strong>Note:</strong> You can submit/update your report only for today. 
            If you already submitted today's report, submitting again will update it.
          </div>
        </div>
      )}

      {/* HISTORY VIEW */}
      {activeView === 'history' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>📊 Your Report History</h3>
          
          {loading && (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          )}

          {!loading && reports.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: '#f8f9fa',
              borderRadius: '15px',
            }}>
              <div style={{ fontSize: '60px', marginBottom: '20px' }}>📋</div>
              <p style={{ color: '#666', fontSize: '18px' }}>
                No reports submitted yet
              </p>
              <p style={{ color: '#999', fontSize: '14px' }}>
                Submit your first report to see it here
              </p>
            </div>
          )}

          {!loading && reports.length > 0 && (
            <div>
              {/* Stats Summary */}
              <div className="stats-grid" style={{ marginBottom: '30px' }}>
                <div className="stat-card">
                  <div className="stat-icon green">📊</div>
                  <div className="stat-details">
                    <h3>Total Reports</h3>
                    <p>{reports.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon blue">📝</div>
                  <div className="stat-details">
                    <h3>Total Enrollments</h3>
                    <p>{reports.reduce((sum, r) => sum + r.enrollments_count, 0)}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon orange">✅</div>
                  <div className="stat-details">
                    <h3>Total Updates</h3>
                    <p>{reports.reduce((sum, r) => sum + r.updates_count, 0)}</p>
                  </div>
                </div>
              </div>

              {/* Reports Table */}
              <div style={{
                background: 'white',
                borderRadius: '15px',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Enrollments</th>
                      <th>Updates</th>
                      <th>Total</th>
                      <th>Remarks</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map(report => (
                      <tr key={report.id}>
                        <td>
                          <strong>
                            {new Date(report.report_date).toLocaleDateString('en-IN')}
                          </strong>
                        </td>
                        <td>
                          <span style={{ 
                            color: '#28a745', 
                            fontWeight: 'bold',
                            fontSize: '18px',
                          }}>
                            {report.enrollments_count}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: '#17a2b8', 
                            fontWeight: 'bold',
                            fontSize: '18px',
                          }}>
                            {report.updates_count}
                          </span>
                        </td>
                        <td>
                          <span style={{ 
                            color: '#667eea', 
                            fontWeight: 'bold',
                            fontSize: '18px',
                          }}>
                            {report.enrollments_count + report.updates_count}
                          </span>
                        </td>
                        <td style={{ maxWidth: '200px' }}>
                          <small style={{ color: '#666' }}>
                            {report.remarks || '-'}
                          </small>
                        </td>
                        <td>
                          <small style={{ color: '#999' }}>
                            {new Date(report.submitted_at).toLocaleString('en-IN')}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUMMARY VIEW */}
      {activeView === 'summary' && (
        <div>
          <h3 style={{ marginBottom: '20px' }}>📈 Performance Summary</h3>

          {loading && (
            <div className="loading">
              <div className="spinner"></div>
            </div>
          )}

          {!loading && summary && (
            <div>
              {/* This Month */}
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                marginBottom: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}>
                <h4 style={{ 
                  color: '#667eea', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  📅 This Month
                </h4>
                <div className="stats-grid">
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Total Enrollments
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>
                      {summary.this_month.total_enrollments}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Total Updates
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#17a2b8' }}>
                      {summary.this_month.total_updates}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Days Reported
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>
                      {summary.this_month.days_reported}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Avg/Day (Enrollments)
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffc107' }}>
                      {summary.this_month.avg_enrollments.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Last 30 Days */}
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                marginBottom: '20px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}>
                <h4 style={{ 
                  color: '#17a2b8', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  📊 Last 30 Days
                </h4>
                <div className="stats-grid">
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Total Enrollments
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>
                      {summary.last_30_days.total_enrollments}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Total Updates
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#17a2b8' }}>
                      {summary.last_30_days.total_updates}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Days Reported
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>
                      {summary.last_30_days.days_reported}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Avg/Day (Enrollments)
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffc107' }}>
                      {summary.last_30_days.avg_enrollments.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              {/* All Time */}
              <div style={{
                background: 'white',
                padding: '30px',
                borderRadius: '15px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
              }}>
                <h4 style={{ 
                  color: '#28a745', 
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}>
                  🏆 All Time
                </h4>
                <div className="stats-grid">
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Total Enrollments
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#28a745' }}>
                      {summary.all_time.total_enrollments}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Total Updates
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#17a2b8' }}>
                      {summary.all_time.total_updates}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Days Reported
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#667eea' }}>
                      {summary.all_time.days_reported}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: '#999', fontSize: '14px', marginBottom: '5px' }}>
                      Avg/Day (Enrollments)
                    </p>
                    <p style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffc107' }}>
                      {summary.all_time.avg_enrollments.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyReportsSection;