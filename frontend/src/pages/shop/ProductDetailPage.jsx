import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Check, Shield, Truck, RotateCcw, AlertTriangle, ArrowLeft } from 'lucide-react';
import { productApi } from '../../api/productApi';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, getImageUrl } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';

const ProductDetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState('');

  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    setLoading(true);
    setError('');
    productApi
      .getProductByIdOrSlug(slug)
      .then((res) => {
        if (res.success) {
          setProduct(res.data);
          setActiveImageIndex(0);
        }
      })
      .catch((err) => {
        setError(err.message || 'Product could not be loaded.');
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '48px 20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 }}>
          <Skeleton height="440px" borderRadius="var(--radius-md)" />
          <div>
            <Skeleton height="32px" width="70%" style={{ marginBottom: 16 }} />
            <Skeleton height="20px" width="40%" style={{ marginBottom: 24 }} />
            <Skeleton height="80px" style={{ marginBottom: 24 }} />
            <Skeleton height="48px" width="50%" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div className="card empty-state" style={{ maxWidth: 500, margin: '0 auto' }}>
          <AlertTriangle size={48} color="var(--danger)" />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Product Not Found</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error || 'The requested product is unavailable.'}</p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>
            Back to Catalog
          </button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.status === 'OUT_OF_STOCK' || product.stockQuantity <= 0;
  const hasDiscount = Number(product.discountPercent) > 0;
  const images = product.images || [];
  const currentImage = images[activeImageIndex]?.imageUrl || null;

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/products/${product.slug}` } });
      return;
    }

    if (isOutOfStock) return;

    setAdding(true);
    const res = await addToCart(product.id, quantity);
    setAdding(false);

    if (res.success) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    }
  };

  return (
    <div className="container" style={{ padding: '40px 20px 80px' }}>
      {/* Breadcrumb Back Link */}
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--text-secondary)',
          fontSize: '0.88rem',
          marginBottom: 32,
        }}
      >
        <ArrowLeft size={16} />
        <span>Back to Catalog</span>
      </Link>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(320px, 1fr)',
          gap: 56,
          alignItems: 'flex-start',
        }}
        className="product-detail-grid"
      >
        {/* Gallery Section */}
        <div>
          <div
            style={{
              width: '100%',
              paddingTop: '85%',
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              backgroundColor: '#0d131f',
              border: '1px solid var(--border-subtle)',
              marginBottom: 16,
            }}
          >
            <img
              src={getImageUrl(currentImage)}
              alt={product.name}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                padding: 16,
              }}
            />
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }}>
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 'var(--radius-sm)',
                    overflow: 'hidden',
                    border: activeImageIndex === idx ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    backgroundColor: '#0d131f',
                    flexShrink: 0,
                    cursor: 'pointer',
                    opacity: activeImageIndex === idx ? 1 : 0.6,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  <img
                    src={getImageUrl(img.imageUrl)}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info Section */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <Badge variant="primary">{product.category?.name || 'General'}</Badge>
            {product.brand && (
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)' }}>
                {product.brand}
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              SKU: {product.sku}
            </span>
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)',
              fontWeight: 800,
              lineHeight: 1.25,
              marginBottom: 16,
            }}
          >
            {product.name}
          </h1>

          {/* Pricing Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: 16,
              padding: '16px 0',
              borderTop: '1px solid var(--border-subtle)',
              borderBottom: '1px solid var(--border-subtle)',
              marginBottom: 24,
            }}
          >
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {formatCurrency(product.offerPrice)}
            </div>

            {hasDiscount && (
              <>
                <div style={{ fontSize: '1.2rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                  {formatCurrency(product.price)}
                </div>
                <Badge variant="warning">{Math.round(product.discountPercent)}% DISCOUNT</Badge>
              </>
            )}
          </div>

          {/* Stock Status Indicator */}
          <div style={{ marginBottom: 24 }}>
            {isOutOfStock ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--danger)', fontWeight: 600 }}>
                <AlertTriangle size={18} />
                <span>Currently Out of Stock</span>
              </div>
            ) : product.stockQuantity <= 5 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--warning)', fontWeight: 600 }}>
                <AlertTriangle size={18} />
                <span>Only {product.stockQuantity} unit{product.stockQuantity === 1 ? '' : 's'} remaining in stock</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--success)', fontWeight: 600 }}>
                <Check size={18} />
                <span>In Stock ({product.stockQuantity} available)</span>
              </div>
            )}
          </div>

          {/* Quantity Controls & Add To Cart */}
          {!isOutOfStock && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'var(--bg-tertiary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '10px 16px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span style={{ minWidth: 36, textAlign: 'center', fontWeight: 700 }}>{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(product.stockQuantity, quantity + 1))}
                  style={{ padding: '10px 16px', color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700 }}
                  disabled={quantity >= product.stockQuantity}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                className={`btn btn-lg ${added ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleAddToCart}
                disabled={adding}
                style={{ flex: 1 }}
                id="product-detail-add-cart-btn"
              >
                {added ? (
                  <>
                    <Check size={20} color="var(--success)" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={20} />
                    <span>{isAuthenticated ? 'Add to Cart' : 'Sign In to Buy'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: 36 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 12 }}>Product Overview</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {product.description}
            </p>
          </div>

          {/* Trust Value Badges */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: 16,
              padding: '20px',
              backgroundColor: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Truck size={20} color="var(--primary)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Free Express Delivery</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={20} color="var(--success)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>1-Year Official Warranty</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <RotateCcw size={20} color="var(--warning)" />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>30-Day Easy Returns</span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 840px) {
          .product-detail-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProductDetailPage;
