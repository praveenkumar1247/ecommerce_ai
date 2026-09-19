import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Package,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

const AdminDashboardPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .getStats()
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .catch((err) => console.error('Failed to fetch dashboard stats:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <Skeleton height="32px" width="220px" style={{ marginBottom: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 20, marginBottom: 32 }}>
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} height="110px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      </div>
    );
  }

  const { overview, recentOrders = [], lowStockList = [] } = data || {};

  const statCards = [
    {
      label: 'Gross Paid Revenue',
      value: formatCurrency(overview?.totalRevenue || 0),
      icon: DollarSign,
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Total Orders',
      value: overview?.totalOrders || 0,
      icon: ShoppingBag,
      color: '#6366f1',
      bg: 'rgba(99, 102, 241, 0.1)',
      sub: `${overview?.pendingOrders || 0} Pending Fulfillment`,
    },
    {
      label: 'Catalog Products',
      value: overview?.totalProducts || 0,
      icon: Package,
      color: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.1)',
      sub: `${overview?.activeProducts || 0} Active / ${overview?.outOfStockProducts || 0} OOS`,
    },
    {
      label: 'Registered Customers',
      value: overview?.totalUsers || 0,
      icon: Users,
      color: '#ec4899',
      bg: 'rgba(236, 72, 153, 0.1)',
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Store Overview</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Real-time metrics across orders, sales performance, and warehouse inventory
        </p>
      </div>

      {/* KPI Metrics Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 20,
          marginBottom: 36,
        }}
      >
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {card.label}
                </span>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    backgroundColor: card.bg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} color={card.color} />
                </div>
              </div>

              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {card.value}
              </div>

              {card.sub && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {card.sub}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Two-Column Recent Data */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: 28,
          alignItems: 'flex-start',
        }}
        className="admin-dash-grid"
      >
        {/* Recent Orders */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Orders</h3>
            <Link to="/admin/orders" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>
              No orders placed yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.orderNumber}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {order.user?.fullName} &bull; {formatDate(order.createdAt)}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800 }}>{formatCurrency(order.totalAmount)}</div>
                    <Badge variant={order.orderStatus === 'DELIVERED' ? 'success' : order.orderStatus === 'CANCELLED' ? 'danger' : 'primary'}>
                      {order.orderStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Low Stock Watchlist */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="var(--warning)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Low Stock Watchlist</h3>
            </div>
            <Link to="/admin/products" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>Manage Stock</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {lowStockList.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '16px 0' }}>
              All inventory levels are healthy!
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {lowStockList.map((prod) => (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.88rem',
                  }}
                >
                  <img
                    src={getImageUrl(prod.images?.[0]?.imageUrl)}
                    alt=""
                    style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'contain', backgroundColor: '#0d131f' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {prod.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      SKU: {prod.sku}
                    </div>
                  </div>
                  <Badge variant={prod.stockQuantity === 0 ? 'danger' : 'warning'}>
                    {prod.stockQuantity === 0 ? 'Out of Stock' : `${prod.stockQuantity} Left`}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .admin-dash-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboardPage;
