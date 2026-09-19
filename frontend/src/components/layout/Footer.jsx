import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ShieldCheck, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#070a10',
        borderTop: '1px solid var(--border-subtle)',
        paddingTop: 48,
        paddingBottom: 32,
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 40,
            marginBottom: 48,
          }}
        >
          {/* Col 1 */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShoppingBag size={18} color="#ffffff" />
              </div>
              <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>ApexStore</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.6 }}>
              Curated luxury hardware, flagship acoustics, and timeless apparel. Designed for discerning individuals.
            </p>
          </div>

          {/* Col 2 */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Navigation
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <Link to="/">All Products</Link>
              <Link to="/cart">Cart</Link>
              <Link to="/profile">My Account</Link>
              <Link to="/orders">Order History</Link>
            </div>
          </div>

          {/* Col 3 */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Customer Support
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <span>24/7 Concierge Support</span>
              <span>Express Insured Shipping</span>
              <span>30-Day Hassle-Free Returns</span>
              <span>support@apexstore.com</span>
            </div>
          </div>

          {/* Col 4 */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
              Staff & Administration
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 12 }}>
              Authorized retail personnel and inventory management:
            </p>
            <Link
              to="/admin/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                fontSize: '0.85rem',
                color: 'var(--primary)',
                fontWeight: 600,
              }}
            >
              <ShieldCheck size={16} />
              <span>Admin Portal Login</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 24,
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            fontSize: '0.82rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>&copy; {new Date().getFullYear()} ApexStore Inc. All rights reserved.</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>Built with precision & high-performance engineering</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
