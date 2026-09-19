import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../common/Badge';

const ProductCard = ({ product }) => {
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const isOutOfStock = product.status === 'OUT_OF_STOCK' || product.stockQuantity <= 0;
  const primaryImage = product.images?.[0]?.imageUrl || null;
  const hasDiscount = Number(product.discountPercent) > 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${product.slug}` } });
      return;
    }

    if (isOutOfStock) return;

    setAdding(true);
    const res = await addToCart(product.id, 1);
    setAdding(false);

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1800);
    }
  };

  return (
    <div
      className="card card-hover"
      style={{
        padding: 0,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Product Image & Badges */}
      <Link
        to={`/products/${product.slug}`}
        style={{
          position: 'relative',
          paddingTop: '80%',
          backgroundColor: '#0d131f',
          overflow: 'hidden',
          display: 'block',
        }}
      >
        <img
          src={getImageUrl(primaryImage)}
          alt={product.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform var(--transition-smooth)',
          }}
          className="product-card-img"
          loading="lazy"
        />

        {/* Badges Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            zIndex: 2,
          }}
        >
          {isOutOfStock ? (
            <Badge variant="danger">Out of Stock</Badge>
          ) : hasDiscount ? (
            <Badge variant="warning">{Math.round(product.discountPercent)}% OFF</Badge>
          ) : null}
        </div>
      </Link>

      {/* Product Information */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
            {product.category?.name || product.brand || 'Original'}
          </span>
          {product.brand && (
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--secondary)' }}>
              {product.brand}
            </span>
          )}
        </div>

        <Link to={`/products/${product.slug}`} style={{ marginBottom: 12 }}>
          <h4
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: '2.8em',
            }}
          >
            {product.name}
          </h4>
        </Link>

        {/* Pricing */}
        <div style={{ marginTop: 'auto', paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCurrency(product.offerPrice)}
            </div>
            {hasDiscount && (
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                {formatCurrency(product.price)}
              </div>
            )}
          </div>

          {/* Action Button */}
          <button
            type="button"
            className={`btn btn-sm ${added ? 'btn-secondary' : isOutOfStock ? 'btn-outline' : 'btn-primary'}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock || adding}
            style={{ borderRadius: 'var(--radius-full)', padding: '8px 14px' }}
            id={`product-card-add-btn-${product.id}`}
          >
            {added ? (
              <>
                <Check size={16} color="var(--success)" />
                <span>Added</span>
              </>
            ) : isOutOfStock ? (
              <span>Unavailable</span>
            ) : (
              <>
                <ShoppingBag size={15} />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>

      <style>{`
        .card:hover .product-card-img {
          transform: scale(1.04);
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
