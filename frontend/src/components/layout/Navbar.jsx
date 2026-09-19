import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, User, Search, LogOut, ShieldCheck, Package, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

const Navbar = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/?search=${encodeURIComponent(searchTerm.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', height: 72, gap: 24 }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, var(--primary) 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 16px var(--primary-glow)',
            }}
          >
            <ShoppingBag size={20} color="#ffffff" />
          </div>
          <span style={{ fontSize: '1.35rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Apex<span style={{ color: 'var(--primary)' }}>Store</span>
          </span>
        </Link>

        {/* Desktop Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          style={{
            flex: 1,
            maxWidth: 540,
            position: 'relative',
            display: 'none',
          }}
          className="desktop-search"
        >
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Search audio, laptops, footwear, apparel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: 42,
              paddingRight: 16,
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
            }}
            id="navbar-search-input"
          />
        </form>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: 'auto' }}>
          {/* Admin Switch Link */}
          {isAdmin && (
            <Link
              to="/admin"
              className="btn btn-sm btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(99, 102, 241, 0.4)' }}
            >
              <ShieldCheck size={16} color="var(--primary)" />
              <span>Admin Portal</span>
            </Link>
          )}

          {/* Cart Icon with Count Badge */}
          <Link
            to="/cart"
            id="navbar-cart-btn"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              transition: 'all var(--transition-fast)',
            }}
            aria-label="Shopping Cart"
          >
            <ShoppingBag size={20} />
            {totalItems > 0 && (
              <span
                id="navbar-cart-count"
                style={{
                  position: 'absolute',
                  top: -4,
                  right: -4,
                  minWidth: 20,
                  height: 20,
                  padding: '0 6px',
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, var(--primary) 0%, #ec4899 100%)',
                  color: '#ffffff',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(236, 72, 153, 0.4)',
                }}
              >
                {totalItems}
              </span>
            )}
          </Link>

          {/* User Account Controls */}
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                id="navbar-user-menu-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--secondary) 0%, var(--primary) 100%)',
                    color: '#ffffff',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {user.fullName?.charAt(0).toUpperCase()}
                </div>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }} className="desktop-name">
                  {user.fullName?.split(' ')[0]}
                </span>
              </button>

              {/* Dropdown Menu */}
              {userDropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 220,
                    backgroundColor: '#111827',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-lg)',
                    padding: 8,
                    zIndex: 100,
                  }}
                  onClick={() => setUserDropdownOpen(false)}
                >
                  <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: 6 }}>
                    <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {user.fullName}
                    </p>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {user.email}
                    </p>
                  </div>

                  <Link
                    to="/profile"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                    }}
                    className="dropdown-link"
                  >
                    <User size={16} color="var(--text-secondary)" />
                    <span>My Profile & Addresses</span>
                  </Link>

                  <Link
                    to="/orders"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      color: 'var(--text-primary)',
                    }}
                    className="dropdown-link"
                  >
                    <Package size={16} color="var(--text-secondary)" />
                    <span>Orders & Tracking</span>
                  </Link>

                  <button
                    onClick={logout}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.88rem',
                      color: 'var(--danger)',
                      textAlign: 'left',
                      marginTop: 4,
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                  >
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link to="/login" className="btn btn-sm btn-secondary" id="navbar-login-link">
                Sign In
              </Link>
              <Link to="/register" className="btn btn-sm btn-primary" id="navbar-register-link">
                Register
              </Link>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-primary)',
            }}
            className="mobile-toggle"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            padding: '16px 20px',
            backgroundColor: 'var(--bg-secondary)',
            borderTop: '1px solid var(--border-subtle)',
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ marginBottom: 16 }}>
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%' }}
            />
          </form>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', fontWeight: 600 }}>
              Catalog
            </Link>
            {isAuthenticated && (
              <>
                <Link to="/profile" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0' }}>
                  Profile & Addresses
                </Link>
                <Link to="/orders" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0' }}>
                  Order History
                </Link>
              </>
            )}
            {isAdmin && (
              <Link to="/admin" onClick={() => setMobileMenuOpen(false)} style={{ padding: '8px 0', color: 'var(--primary)' }}>
                Admin Portal
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Media query styling for header responsiveness */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-search { display: block !important; }
          .mobile-toggle { display: none !important; }
        }
        @media (max-width: 767px) {
          .desktop-name { display: none; }
        }
        .dropdown-link:hover {
          background-color: rgba(255, 255, 255, 0.06);
        }
      `}</style>
    </header>
  );
};

export default Navbar;
