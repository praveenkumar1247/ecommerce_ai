import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, AlertTriangle, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { formatCurrency, getImageUrl } from '../../utils/formatters';

const CartPage = () => {
  const { cart, items, summary, hasStockIssue, loading, updateQuantity, removeItem, clearCart, validateCartStock } =
    useCart();
  const navigate = useNavigate();

  // Validate real-time stock on opening cart page
  useEffect(() => {
    validateCartStock();
  }, []);

  if (items.length === 0 && !loading) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="card empty-state" style={{ maxWidth: 520, margin: '0 auto' }}>
          <div className="empty-state-icon">
            <ShoppingBag size={36} />
          </div>
          <h2 className="empty-state-title">Your Cart is Empty</h2>
          <p className="empty-state-desc">
            Explore our curated catalog of flagship electronics, designer fashion, and luxury living goods.
          </p>
          <Link to="/" className="btn btn-primary btn-lg" style={{ marginTop: 8 }}>
            <span>Start Shopping</span>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Shopping Bag</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            {cart.totalItems} item{cart.totalItems === 1 ? '' : 's'} in your bag
          </p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            className="btn btn-sm btn-outline"
            onClick={clearCart}
            style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
          >
            Clear Bag
          </button>
        )}
      </div>

      {/* Stock issue warning banner */}
      {hasStockIssue && (
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
          <AlertTriangle size={24} style={{ flexShrink: 0 }} />
          <div>
            <strong>Stock availability changed!</strong> One or more items in your cart exceed current available inventory. Please adjust quantities before checkout.
          </div>
        </div>
      )}

      {/* Cart Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          gap: 36,
          alignItems: 'flex-start',
        }}
        className="cart-grid"
      >
        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: 20,
                display: 'flex',
                gap: 20,
                alignItems: 'center',
                borderColor: !item.isAvailable ? 'rgba(239, 68, 68, 0.4)' : 'var(--border-subtle)',
              }}
            >
              {/* Product Thumbnail */}
              <Link
                to={`/products/${item.slug}`}
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: '#0d131f',
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={getImageUrl(item.image)}
                  alt={item.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }}
                />
              </Link>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  {item.brand || 'Original'}
                </div>
                <Link to={`/products/${item.slug}`}>
                  <h3
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 6,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.name}
                  </h3>
                </Link>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {formatCurrency(item.offerPrice)}
                  </span>
                  {item.discountPercent > 0 && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                      {formatCurrency(item.price)}
                    </span>
                  )}
                </div>

                {/* Stock Warning on Item */}
                {!item.isAvailable && (
                  <div style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 600 }}>
                    ⚠️ {item.stockWarning} (Available: {item.stockQuantity})
                  </div>
                )}
              </div>

              {/* Quantity Stepper */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    style={{ padding: '6px 12px', color: 'var(--text-primary)', fontWeight: 700 }}
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span style={{ minWidth: 28, textAlign: 'center', fontSize: '0.9rem', fontWeight: 700 }}>
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    style={{ padding: '6px 12px', color: 'var(--text-primary)', fontWeight: 700 }}
                    disabled={item.quantity >= item.stockQuantity}
                  >
                    +
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                    {formatCurrency(item.itemSubtotal)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    style={{ color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Sidebar */}
        <div className="card" style={{ padding: 24, position: 'sticky', top: 96 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>Order Summary</h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, fontSize: '0.9rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Retail Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>

            {summary.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)' }}>
                <span>Discount Savings</span>
                <span>-{formatCurrency(summary.discount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Discounted Subtotal</span>
              <span>{formatCurrency(summary.offerSubtotal)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Estimated Shipping</span>
              <span>{summary.shippingFee === 0 ? 'FREE' : formatCurrency(summary.shippingFee)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>Estimated GST (18%)</span>
              <span>{formatCurrency(summary.tax)}</span>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingTop: 16,
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              <span>Estimated Total</span>
              <span>{formatCurrency(summary.totalAmount)}</span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginBottom: 16 }}
            onClick={() => navigate('/checkout')}
            disabled={hasStockIssue || items.length === 0}
            id="cart-checkout-btn"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight size={18} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <ShieldCheck size={16} color="var(--success)" />
            <span>Secure Checkout with Verified Server-Side Stock Locks</span>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .cart-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CartPage;
