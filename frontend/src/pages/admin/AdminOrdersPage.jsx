import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Search, Filter, Clock, MapPin, CreditCard } from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';

const AdminOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [orderStatus, setOrderStatus] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const { success, error: toastError } = useToast();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15 };
      if (orderStatus) params.orderStatus = orderStatus;
      if (paymentStatus) params.paymentStatus = paymentStatus;
      if (search) params.search = search;

      const res = await adminApi.getAllOrders(params);
      if (res.success) {
        setOrders(res.data);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, orderStatus, paymentStatus, search]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await adminApi.updateOrderStatus(orderId, { orderStatus: newStatus });
      success(`Order #${orderId} marked as ${newStatus}.`);
      loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => ({ ...prev, orderStatus: newStatus }));
      }
    } catch (err) {
      toastError(err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const openOrderDetail = (order) => {
    setSelectedOrder(order);
    setIsDetailModalOpen(true);
  };

  const getStatusVariant = (status) => {
    switch (status) {
      case 'DELIVERED':
      case 'PAID':
        return 'success';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'SHIPPED':
        return 'primary';
      case 'CANCELLED':
      case 'FAILED':
        return 'danger';
      default:
        return 'warning';
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Order Fulfillment & Sales</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Process customer shipments, track payment states, and view transaction records
        </p>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by Order #, Customer name, or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 38 }}
          />
        </div>

        <select value={orderStatus} onChange={(e) => setOrderStatus(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">All Order Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="SHIPPED">SHIPPED</option>
          <option value="DELIVERED">DELIVERED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} style={{ minWidth: 160 }}>
          <option value="">All Payment Statuses</option>
          <option value="PENDING">PENDING</option>
          <option value="PAID">PAID</option>
          <option value="FAILED">FAILED</option>
          <option value="REFUNDED">REFUNDED</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Order Ref</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total Amount</th>
              <th>Order Status</th>
              <th>Payment Status</th>
              <th>Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No orders found.
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong style={{ color: 'var(--primary)' }}>{o.orderNumber}</strong>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{o.user?.fullName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{o.user?.email}</div>
                  </td>
                  <td>{o.items?.length || 0} unit(s)</td>
                  <td style={{ fontWeight: 800 }}>{formatCurrency(o.totalAmount)}</td>
                  <td>
                    <select
                      value={o.orderStatus}
                      onChange={(e) => handleStatusChange(o.id, e.target.value)}
                      disabled={updatingId === o.id}
                      style={{ fontSize: '0.82rem', padding: '4px 8px', borderRadius: 4 }}
                    >
                      <option value="PENDING">PENDING</option>
                      <option value="CONFIRMED">CONFIRMED</option>
                      <option value="PROCESSING">PROCESSING</option>
                      <option value="SHIPPED">SHIPPED</option>
                      <option value="DELIVERED">DELIVERED</option>
                      <option value="CANCELLED">CANCELLED</option>
                    </select>
                  </td>
                  <td>
                    <Badge variant={getStatusVariant(o.paymentStatus)}>{o.paymentStatus}</Badge>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {formatDate(o.createdAt)}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => openOrderDetail(o)}
                      title="Inspect Order"
                    >
                      <Eye size={15} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`Order Details: ${selectedOrder?.orderNumber}`}
        maxWidth="720px"
      >
        {selectedOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24, padding: 16, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>CUSTOMER</span>
                <div style={{ fontWeight: 700 }}>{selectedOrder.user?.fullName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedOrder.user?.email}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{selectedOrder.user?.phone}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SHIPPING ADDRESS</span>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {selectedOrder.shippingAddressSnapshot?.addressLine1}
                  <br />
                  {selectedOrder.shippingAddressSnapshot?.city}, {selectedOrder.shippingAddressSnapshot?.state} - {selectedOrder.shippingAddressSnapshot?.postalCode}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PAYMENT RECORD</span>
                <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{selectedOrder.payment?.paymentMethod || 'MOCK_CARD'}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{selectedOrder.payment?.transactionId}</div>
                <Badge variant={getStatusVariant(selectedOrder.paymentStatus)}>{selectedOrder.paymentStatus}</Badge>
              </div>
            </div>

            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 12 }}>Items Snapshot</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {selectedOrder.items?.map((item) => (
                <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-subtle)' }}>
                  <img
                    src={getImageUrl(item.imageUrlSnapshot)}
                    alt=""
                    style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'contain', backgroundColor: '#0d131f' }}
                  />
                  <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem' }}>
                    <div style={{ fontWeight: 700 }}>{item.productNameSnapshot}</div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      Qty: {item.quantity} &times; {formatCurrency(item.finalPrice)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800 }}>{formatCurrency(item.subtotal)}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
              <span>Total Invoice</span>
              <span>{formatCurrency(selectedOrder.totalAmount)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrdersPage;
