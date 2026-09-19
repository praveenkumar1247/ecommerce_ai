import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  Store,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminSidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard, end: true },
    { label: 'Products', path: '/admin/products', icon: Package },
    { label: 'Categories', path: '/admin/categories', icon: Layers },
    { label: 'Orders & Sales', path: '/admin/orders', icon: ShoppingBag },
    { label: 'Customers', path: '/admin/users', icon: Users },
  ];

  return (
    <aside
      style={{
        width: 260,
        backgroundColor: '#0d121f',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
      }}
      className="admin-sidebar"
    >
      {/* Brand */}
      <div style={{ padding: '0 12px', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LayoutDashboard size={18} color="#ffffff" />
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800 }}>Apex Admin</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Management Console</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all var(--transition-fast)',
              })}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Controls */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <NavLink
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            color: 'var(--text-secondary)',
          }}
        >
          <Store size={18} />
          <span>View Public Store</span>
        </NavLink>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.88rem',
            color: 'var(--danger)',
            width: '100%',
            textAlign: 'left',
          }}
        >
          <LogOut size={18} />
          <span>Logout Admin</span>
        </button>

        <div style={{ padding: '8px 14px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Logged in as: <strong style={{ color: 'var(--text-secondary)' }}>{user?.fullName}</strong>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;
