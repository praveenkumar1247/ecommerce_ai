import React, { useState, useEffect } from 'react';
import { Users, Mail, Phone, Calendar, ShoppingBag } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/common/Badge';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getAllUsers()
      .then((res) => {
        if (res.success) setUsers(res.data);
      })
      .catch((err) => console.error('Failed to load customers:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Customer Directory</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Monitor customer activity, lifetime spend, and order participation
        </p>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Customer</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined Date</th>
              <th>Total Orders</th>
              <th>Lifetime Spend</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No customer records found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.82rem',
                        }}
                      >
                        {u.fullName?.charAt(0).toUpperCase()}
                      </div>
                      <strong style={{ color: 'var(--text-primary)' }}>{u.fullName}</strong>
                    </div>
                  </td>
                  <td>{u.email}</td>
                  <td>{u.phone || '—'}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td>
                    <span className="badge badge-primary">{u.totalOrders} order(s)</span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--success)' }}>
                    {formatCurrency(u.totalSpend)}
                  </td>
                  <td>
                    <Badge variant={u.status === 'ACTIVE' ? 'success' : 'danger'}>{u.status}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsersPage;
