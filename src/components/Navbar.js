import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const roleLabels = {
  owner: 'Owner', admin: 'Admin', accountant: 'Accountant',
  central_supervisor: 'Central Supervisor', hq_supervisor: 'HQ Supervisor',
  supervisor: 'District Supervisor', operator: 'Operator',
};

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardLink = () => {
    const routes = {
      operator: '/operator/dashboard', supervisor: '/supervisor/dashboard',
      hq_supervisor: '/hq-supervisor/dashboard', accountant: '/accountant/dashboard',
      admin: '/admin/dashboard', owner: '/owner/dashboard',
      central_supervisor: '/central-dashboard',
    };
    return routes[user?.role] || '/';
  };

  return (
    <div style={{
      background: '#0f172a', padding: '0 32px', height: '64px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      position: 'sticky', top: 0, zIndex: 1000,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px', background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
          borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'white', fontWeight: '700', fontSize: '14px',
        }}>CE</div>
        <div>
          <div style={{ color: 'white', fontSize: '16px', fontWeight: '600' }}>Click Portal</div>
          <div style={{ color: '#94a3b8', fontSize: '11px' }}>{roleLabels[user?.role] || 'User'} Panel</div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <Link to={getDashboardLink()} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: '14px', fontWeight: '500' }}>Dashboard</Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.1)', padding: '8px 16px', borderRadius: '12px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
            color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: '600', fontSize: '13px',
          }}>{user?.full_name?.charAt(0) || 'U'}</div>
          <div>
            <div style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>{user?.full_name || 'User'}</div>
            <div style={{ color: '#64748b', fontSize: '11px' }}>{user?.operator_user_id || user?.email}</div>
          </div>
        </div>

        <button onClick={() => { if (window.confirm('Logout?')) logout(); }}
          style={{ background: '#dc2626', color: 'white', border: 'none', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '13px' }}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Navbar;
