import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Package, MapPin, CreditCard, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { orderApi } from '../../api/orderApi';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Skeleton from '../../components/common/Skeleton';

const OrderDetailPage = () => {
  const { id } = useParams();
  const { success, error: toastError } = useToast();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const res = await orderApi.getOrderById(id);
      if (res.success) setOrder(res.data);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleCancelOrder = async () => {
    setCancelling(true);
    try {
      const res = await orderApi.cancelOrder(id);
      if (res.success) {
        success('Order cancelled and inventory restored.');
        setIsCancelModalOpen(false);
        loadOrder();
      }
    } catch (err) {
      toastError(err.message || 'Failed to cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 20px' }}>
        <Skeleton height="32px" width="300px" style={{ marginBottom: 24 }} />
        <Skeleton height="200px" borderRadius="var(--radius-md)" style={{ marginBottom: 24 }} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <Link to="/orders" className="btn btn-primary" style={{ marginTop: 16 }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const addr = order.shippingAddressSnapshot || {};
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.orderStatus);

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <Link
        to="/orders"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
          marginBottom: 24,
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Orders</span>
      </Link>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Order #{order.orderNumber}</h1>
            <Badge variant={order.orderStatus === 'DELIVERED' ? 'success' : order.orderStatus === 'CANCELLED' ? 'danger' : 'primary'}>
              {order.orderStatus}
            </Badge>
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Placed on {formatDate(order.createdAt)}
          </div>
        </div>

        {canCancel && (
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setIsCancelModalOpen(true)}
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.4)' }}
          >
            Cancel Order
          </button>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 32,
          alignItems: 'flex-start',
        }}
        className="order-detail-grid"
      >
        {/* Left: Items Snapshot */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: 20 }}>
            Purchased Items ({order.items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {order.items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'center',
                  paddingBottom: 16,
                  borderBottom: '1px solid var(--border-subtle)',
                }}
              >
                <img
                  src={getImageUrl(item.imageUrlSnapshot)}
                  alt=""
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'contain',
                    backgroundColor: '#0d131f',
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {item.brandSnapshot || 'Original'}
                  </div>
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {item.productNameSnapshot}
                  </h4>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Qty: {item.quantity} &times; {formatCurrency(item.finalPrice)}
                  </div>
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {formatCurrency(item.subtotal)}
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Breakdown */}
          <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Retail Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Discount Savings</span>
                <span>-{formatCurrency(order.discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Shipping Fee</span>
              <span>{Number(order.shippingFee) === 0 ? 'FREE' : formatCurrency(order.shippingFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>GST (18%)</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '1.25rem',
                fontWeight: 800,
                borderTop: '1px solid var(--border-subtle)',
                paddingTop: 16,
              }}
            >
              <span>Total Paid</span>
              <span>{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Right: Shipping & Payment Snapshot */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Shipping Address Snapshot */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <MapPin size={18} color="var(--primary)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Delivery Address</h4>
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 600 }}>
              {addr.fullName}
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: 4 }}>
              {addr.addressLine1}
              {addr.addressLine2 && `, ${addr.addressLine2}`}
              <br />
              {addr.city}, {addr.state} - {addr.postalCode}
              <br />
              {addr.country}
            </p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
              Phone: {addr.phone}
            </p>
          </div>

          {/* Payment Snapshot */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <CreditCard size={18} color="var(--primary)" />
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Payment Details</h4>
            </div>
            <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Status:</span>
                <Badge variant={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'REFUNDED' ? 'warning' : 'danger'}>
                  {order.paymentStatus}
                </Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Method:</span>
                <span style={{ fontWeight: 600 }}>{order.payment?.paymentMethod || 'CARD'}</span>
              </div>
              {order.payment?.transactionId && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Txn ID:</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {order.payment.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        onConfirm={handleCancelOrder}
        title="Cancel this order?"
        message="Are you sure you want to cancel this order? The items will be returned to store inventory and payment refunded if captured."
        confirmText="Confirm Cancellation"
        loading={cancelling}
      />

      <style>{`
        @media (max-width: 860px) {
          .order-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderDetailPage;
