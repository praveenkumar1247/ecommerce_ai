import React from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

const OrderSuccessPage = () => {
  const { id } = useParams();
  const location = useLocation();
  const order = location.state?.order;

  return (
    <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
      <div className="card" style={{ maxWidth: 580, margin: '0 auto', padding: '48px 32px' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--success-bg)',
            color: 'var(--success)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            border: '2px solid rgba(16, 185, 129, 0.4)',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: 8 }}>Order Confirmed!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: 24 }}>
          Thank you for shopping with ApexStore. Your order has been placed and inventory is reserved.
        </p>

        <div
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px 20px',
            textAlign: 'left',
            marginBottom: 32,
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Order Reference:</span>
            <strong style={{ color: 'var(--primary)' }}>{order?.orderNumber || `ORD-${id}`}</strong>
          </div>
          {order?.totalAmount && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total Amount:</span>
              <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(order.totalAmount)}</strong>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Status:</span>
            <span className="badge badge-success">{order?.paymentStatus || 'PAID'}</span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
          <Link to={`/orders/${id}`} className="btn btn-primary">
            <Package size={18} />
            <span>View Order Details</span>
          </Link>
          <Link to="/" className="btn btn-secondary">
            <Home size={18} />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
