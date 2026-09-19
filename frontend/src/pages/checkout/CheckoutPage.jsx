import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { addressApi } from '../../api/addressApi';
import { orderApi } from '../../api/orderApi';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import Modal from '../../components/common/Modal';

const CheckoutPage = () => {
  const { items, summary, hasStockIssue, refreshCart } = useCart();
  const { success, error: toastError } = useToast();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('MOCK_CARD');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('888');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [notes, setNotes] = useState('');

  // Address Modal State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({
    fullName: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    addressType: 'HOME',
    isDefault: true,
  });

  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState('');

  // Load addresses on mount
  useEffect(() => {
    loadAddresses();
  }, []);

  const loadAddresses = async () => {
    try {
      const res = await addressApi.getAddresses();
      if (res.success && res.data) {
        setAddresses(res.data);
        const defaultAddr = res.data.find((a) => a.isDefault) || res.data[0];
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const handleCreateAddress = async (e) => {
    e.preventDefault();
    try {
      const res = await addressApi.addAddress(newAddress);
      if (res.success) {
        success('Address added.');
        setIsAddressModalOpen(false);
        await loadAddresses();
        setSelectedAddressId(res.data.id);
      }
    } catch (err) {
      toastError(err.message || 'Failed to add address.');
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setCheckoutError('Please select or add a shipping address.');
      return;
    }

    if (items.length === 0) {
      setCheckoutError('Your cart is empty.');
      return;
    }

    if (hasStockIssue) {
      setCheckoutError('Stock availability changed. Please return to cart and review quantities.');
      return;
    }

    setSubmitting(true);
    setCheckoutError('');

    try {
      const payload = {
        addressId: selectedAddressId,
        paymentMethod,
        notes,
        paymentDetails:
          paymentMethod === 'MOCK_CARD'
            ? { cardNumber: cardNumber.replace(/\s/g, ''), cardExpiry, cardCvv }
            : paymentMethod === 'MOCK_UPI'
            ? { upiId }
            : {},
      };

      const res = await orderApi.createOrder(payload);
      if (res.success && res.data) {
        await refreshCart();
        success('Order placed successfully!');
        navigate(`/checkout/success/${res.data.id}`, { state: { order: res.data } });
      }
    } catch (err) {
      console.error('Order creation failed:', err);
      setCheckoutError(err.message || 'Failed to place order. Transaction rolled back safely.');
      toastError(err.message || 'Order failed.');
      // Refresh cart to show updated stock constraints
      await refreshCart();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>Checkout</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 36 }}>
        Review your delivery address, payment method, and reserved inventory.
      </p>

      {checkoutError && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--danger)',
            marginBottom: 28,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
          role="alert"
        >
          <AlertCircle size={22} style={{ flexShrink: 0 }} />
          <div>{checkoutError}</div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 40,
          alignItems: 'flex-start',
        }}
        className="checkout-grid"
      >
        {/* Left Column: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {/* Step 1: Shipping Address */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  1
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Delivery Address</h3>
              </div>

              <button
                type="button"
                className="btn btn-sm btn-outline"
                onClick={() => setIsAddressModalOpen(true)}
              >
                <Plus size={16} />
                <span>Add New Address</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 16px', color: 'var(--text-muted)' }}>
                No saved addresses found. Please add a delivery address to proceed.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <div
                      key={addr.id}
                      onClick={() => setSelectedAddressId(addr.id)}
                      style={{
                        padding: 16,
                        borderRadius: 'var(--radius-sm)',
                        border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--bg-tertiary)',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{addr.fullName}</span>
                        <span className="badge badge-primary">{addr.addressType}</span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {addr.addressLine1}
                        {addr.addressLine2 && `, ${addr.addressLine2}`}
                        <br />
                        {addr.city}, {addr.state} - {addr.postalCode}
                      </p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 8 }}>
                        📞 {addr.phone}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2: Payment Method */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                }}
              >
                2
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Payment Method</h3>
            </div>

            {/* Method Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { id: 'MOCK_CARD', label: 'Credit/Debit Card' },
                { id: 'MOCK_UPI', label: 'UPI / QR' },
                { id: 'MOCK_NETBANKING', label: 'Net Banking' },
                { id: 'COD', label: 'Cash On Delivery' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: paymentMethod === m.id ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: paymentMethod === m.id ? 'var(--primary-light)' : 'var(--bg-tertiary)',
                    color: paymentMethod === m.id ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: paymentMethod === m.id ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {/* Payment Details Sub-forms */}
            {paymentMethod === 'MOCK_CARD' && (
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 20, borderRadius: 'var(--radius-sm)' }}>
                <div className="form-group">
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                  />
                  <span className="form-hint">Tip: Ending with 0000 tests payment gateway decline</span>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Expiry</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      maxLength={4}
                    />
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'MOCK_UPI' && (
              <div style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', padding: 20, borderRadius: 'var(--radius-sm)' }}>
                <div className="form-group">
                  <label className="form-label">Virtual Payment Address (VPA / UPI ID)</label>
                  <input
                    type="text"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="username@okaxis"
                  />
                </div>
              </div>
            )}

            {paymentMethod === 'MOCK_NETBANKING' && (
              <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                You will be connected to our verified mock banking gateway simulator upon confirmation.
              </div>
            )}

            {paymentMethod === 'COD' && (
              <div style={{ padding: 16, color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                💵 Pay with cash upon delivery of your items.
              </div>
            )}
          </div>

          {/* Delivery Instructions */}
          <div className="card" style={{ padding: 20 }}>
            <label className="form-label">Optional Delivery Instructions</label>
            <input
              type="text"
              placeholder="e.g. Leave package with front desk security"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', marginTop: 6 }}
            />
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="card" style={{ padding: 24, position: 'sticky', top: 96 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>Review Items ({items.length})</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 220, overflowY: 'auto', marginBottom: 20, paddingRight: 4 }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={getImageUrl(item.image)}
                  alt=""
                  style={{ width: 44, height: 44, borderRadius: 6, objectFit: 'contain', backgroundColor: '#0d131f' }}
                />
                <div style={{ flex: 1, minWidth: 0, fontSize: '0.85rem' }}>
                  <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>
                  {formatCurrency(item.itemSubtotal)}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', borderTop: '1px solid var(--border-subtle)', paddingTop: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Subtotal</span>
              <span>{formatCurrency(summary.offerSubtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Shipping</span>
              <span>{summary.shippingFee === 0 ? 'FREE' : formatCurrency(summary.shippingFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>GST (18%)</span>
              <span>{formatCurrency(summary.tax)}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 12,
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '1.25rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              <span>Total Payable</span>
              <span>{formatCurrency(summary.totalAmount)}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginBottom: 16 }}
            onClick={handlePlaceOrder}
            disabled={submitting || hasStockIssue || items.length === 0}
            id="checkout-confirm-btn"
          >
            {submitting ? (
              <div className="spinner" />
            ) : (
              <>
                <ShieldCheck size={20} />
                <span>Place Order & Pay</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal isOpen={isAddressModalOpen} onClose={() => setIsAddressModalOpen(false)} title="Add Shipping Address">
        <form onSubmit={handleCreateAddress}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              required
              value={newAddress.fullName}
              onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })}
              placeholder="John Doe"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number *</label>
            <input
              type="tel"
              required
              value={newAddress.phone}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address Line 1 *</label>
            <input
              type="text"
              required
              value={newAddress.addressLine1}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
              placeholder="Flat/House No., Street"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Address Line 2</label>
            <input
              type="text"
              value={newAddress.addressLine2}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
              placeholder="Landmark, Area (Optional)"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">City *</label>
              <input
                type="text"
                required
                value={newAddress.city}
                onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                placeholder="Bengaluru"
              />
            </div>
            <div className="form-group">
              <label className="form-label">State *</label>
              <input
                type="text"
                required
                value={newAddress.state}
                onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                placeholder="Karnataka"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Postal Code *</label>
              <input
                type="text"
                required
                value={newAddress.postalCode}
                onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })}
                placeholder="560001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Address Type</label>
              <select
                value={newAddress.addressType}
                onChange={(e) => setNewAddress({ ...newAddress, addressType: e.target.value })}
              >
                <option value="HOME">HOME</option>
                <option value="WORK">WORK</option>
                <option value="OTHER">OTHER</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsAddressModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Address
            </button>
          </div>
        </form>
      </Modal>

      <style>{`
        @media (max-width: 860px) {
          .checkout-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;
