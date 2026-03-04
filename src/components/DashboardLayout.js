import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/main.css';

const roleMenus = {
  owner: [
    { icon: '📊', label: 'Dashboard', path: '/owner/dashboard', section: 'dashboard' },
    { icon: '👥', label: 'All Operators', path: '/owner/dashboard', section: 'operators' },
    { icon: '🏢', label: 'Districts', path: '/owner/dashboard', section: 'districts' },
    { icon: '💰', label: 'Payments', path: '/owner/dashboard', section: 'payments' },
  ],
  admin: [
    { icon: '📊', label: 'Dashboard', path: '/admin/dashboard', section: 'dashboard' },
    { icon: '👥', label: 'Operators', path: '/admin/dashboard', section: 'operators' },
    { icon: '📄', label: 'Documents', path: '/admin/dashboard', section: 'documents' },
    { icon: '💰', label: 'Payments', path: '/admin/dashboard', section: 'payments' },
    { icon: '🏢', label: 'Districts', path: '/admin/dashboard', section: 'districts' },
  ],
  accountant: [
    { icon: '📊', label: 'Dashboard', path: '/accountant/dashboard', section: 'dashboard' },
    { icon: '💰', label: 'Payments', path: '/accountant/dashboard', section: 'payments' },
    { icon: '👥', label: 'Operators', path: '/accountant/dashboard', section: 'operators' },
  ],
  central_supervisor: [
    { icon: '📊', label: 'Dashboard', path: '/central-dashboard', section: 'dashboard' },
    { icon: '📋', label: 'UIDAI Reports', path: '/central-dashboard', section: 'reports' },
    { icon: '🔍', label: 'Cross Check', path: '/central-dashboard', section: 'crosscheck' },
  ],
  hq_supervisor: [
    { icon: '📊', label: 'Dashboard', path: '/hq-supervisor/dashboard', section: 'dashboard' },
    { icon: '👥', label: 'Supervisors', path: '/hq-supervisor/dashboard', section: 'supervisors' },
    { icon: '📋', label: 'Reports', path: '/hq-supervisor/dashboard', section: 'reports' },
  ],
  supervisor: [
    { icon: '📊', label: 'Dashboard', path: '/supervisor/dashboard', section: 'dashboard' },
    { icon: '👥', label: 'Operators', path: '/supervisor/dashboard', section: 'operators' },
    { icon: '📋', label: 'Daily Reports', path: '/supervisor/dashboard', section: 'reports' },
  ],
  operator: [
    { icon: '📊', label: 'Dashboard', path: '/operator/dashboard', section: 'dashboard' },
    { icon: '📋', label: 'Daily Reports', path: '/operator/dashboard', section: 'reports' },
    { icon: '📄', label: 'Documents', path: '/operator/dashboard', section: 'documents' },
    { icon: '💰', label: 'Payment', path: '/operator/dashboard', section: 'payment' },
  ],
};

const comingSoonItems = [
  { icon: '🖥️', label: 'Machine Module', section: 'machine' },
  { icon: '💹', label: 'Commission', section: 'commission' },
];

const roleLabels = {
  owner: 'Owner', admin: 'Admin', accountant: 'Accountant',
  central_supervisor: 'Central Supervisor', hq_supervisor: 'HQ Supervisor',
  supervisor: 'District Supervisor', operator: 'Operator',
};

const DashboardLayout = ({ children, activeSection, onSectionChange }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const role = user?.role || 'operator';
  const menuItems = roleMenus[role] || [];

  return (
    <div className="dashboard-layout">
      {/* Mobile Overlay */}
      {mobileOpen && <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} onClick={() => setMobileOpen(false)} />}

      {/* Sidebar */}
      <div className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">CE</div>
          <div>
            <div className="sidebar-title">Click Portal</div>
            <div className="sidebar-subtitle">E-Governance System</div>
          </div>
        </div>

        <div className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-title">Menu</div>
            {menuItems.map((item, i) => (
              <button key={i} className={`nav-item ${activeSection === item.section ? 'active' : ''}`}
                onClick={() => { onSectionChange?.(item.section); setMobileOpen(false); }}>
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-title">Coming Soon</div>
            {comingSoonItems.map((item, i) => (
              <button key={i} className={`nav-item ${activeSection === item.section ? 'active' : ''}`}
                onClick={() => { onSectionChange?.(item.section); setMobileOpen(false); }}
                style={{ opacity: 0.6 }}>
                <span className="nav-item-icon">{item.icon}</span>
                {item.label}
                <span style={{ marginLeft: 'auto', fontSize: '10px', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '10px' }}>Soon</span>
              </button>
            ))}
          </div>

          <div className="nav-section" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
            <button className="nav-item" onClick={() => { if (window.confirm('Logout?')) logout(); }}>
              <span className="nav-item-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button onClick={() => setMobileOpen(!mobileOpen)} style={{ display: 'none', background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }} className="mobile-menu-btn">☰</button>
            <div className="topbar-title">{roleLabels[role]} Panel</div>
          </div>
          <div className="topbar-user">
            <span>{user?.full_name || 'User'}</span>
            <div className="topbar-avatar">{user?.full_name?.charAt(0) || 'U'}</div>
          </div>
        </div>

        <div className="page-content">
          {/* Coming Soon Check */}
          {activeSection === 'machine' || activeSection === 'commission' ? (
            <div className="coming-soon">
              <div className="coming-soon-icon">{activeSection === 'machine' ? '🖥️' : '💹'}</div>
              <div className="coming-soon-title">{activeSection === 'machine' ? 'Machine Module' : 'Commission Module'}</div>
              <div className="coming-soon-text">This feature is under development and will be available soon.</div>
            </div>
          ) : children}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
