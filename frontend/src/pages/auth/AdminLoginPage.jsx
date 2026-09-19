import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { adminLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMsg('Please enter administrator credentials.');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    const res = await adminLogin({ email, password });
    setLoading(false);

    if (res?.success) {
      navigate('/admin', { replace: true });
    } else {
      setErrorMsg(res?.error || 'Admin authentication rejected.');
    }
  };

  const fillDemoAdmin = () => {
    setEmail('admin@ecommerce.com');
    setPassword('Admin@123456');
    setErrorMsg('');
  };

  return (
    <div
      className="container"
      style={{
        minHeight: '75vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: '36px 32px',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          boxShadow: '0 0 30px rgba(99, 102, 241, 0.15)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              boxShadow: '0 0 24px var(--primary-glow)',
            }}
          >
            <ShieldCheck size={28} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: 6 }}>Apex Admin Portal</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
            Authorized administrator authentication
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'var(--danger-bg)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              marginBottom: 20,
            }}
            role="alert"
          >
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="admin-email">
              Admin Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="admin-email"
                type="email"
                placeholder="admin@ecommerce.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: 38 }}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 24 }}>
            <label className="form-label" htmlFor="admin-password">
              Security Key / Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                id="admin-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: 38 }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginBottom: 16 }}
            disabled={loading}
            id="admin-login-btn"
          >
            {loading ? <div className="spinner" /> : <span>Authenticate Admin</span>}
          </button>
        </form>

        <div
          style={{
            padding: '14px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px dashed var(--border-subtle)',
            borderRadius: 'var(--radius-sm)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            Default Admin Credentials:
          </div>
          <button
            type="button"
            onClick={fillDemoAdmin}
            className="btn btn-sm btn-outline"
            style={{ width: '100%', fontSize: '0.82rem' }}
          >
            Fill Admin (admin@ecommerce.com)
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
