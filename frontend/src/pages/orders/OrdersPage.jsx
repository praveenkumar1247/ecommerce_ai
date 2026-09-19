import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi
      .getUserOrders()
      .then((res) => {
        if (res.success) setOrders(res.data);
      })
      .catch((err) => console.error('Failed to load orders:', err))
      .finally(() => setLoading(false));
  }, []);

  const getStatusVariant = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'success';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'SHIPPED':
        return 'primary';
      case 'CANCELLED':
        return 'danger';
      default:
        return 'warning';
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <Skeleton height="36px" width="240px" style={{ marginBottom: 24 }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} height="120px" borderRadius="var(--radius-md)" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>My Orders</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Track and manage your order history</p>
      </div>

      {orders.length === 0 ? (
        <div className="card empty-state" style={{ maxWidth: 500, margin: '0 auto' }}>
          <div className="empty-state-icon">
            <Package size={32} />
          </div>
          <h3 className="empty-state-title">No orders yet</h3>
          <p className="empty-state-desc">You have not placed any orders yet. Start exploring our catalog.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 12 }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              className="card card-hover"
              style={{ padding: 24, display: 'flex', flexWrap: 'wrap', gap: 20, alignItems: 'center', justifyContent: 'space-between' }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    {order.orderNumber}
                  </span>
                  <Badge variant={getStatusVariant(order.orderStatus)}>{order.orderStatus}</Badge>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Payment: {order.paymentStatus}
                  </span>
                </div>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} />
                  <span>Placed on {formatDate(order.createdAt)}</span>
                </div>

                <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginTop: 8 }}>
                  {order.items?.length || 0} item{order.items?.length === 1 ? '' : 's'} &bull;{' '}
                  <strong style={{ fontSize: '1rem' }}>{formatCurrency(order.totalAmount)}</strong>
                </div>
              </div>

              <div>
                <Link to={`/orders/${order.id}`} className="btn btn-secondary btn-sm" style={{ gap: 6 }}>
                  <span>View Details & Tracking</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
