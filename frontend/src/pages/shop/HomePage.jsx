import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, PackageSearch, ArrowRight } from 'lucide-react';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
import ProductCard from '../../components/product/ProductCard';
import ProductFilters from '../../components/product/ProductFilters';
import Skeleton from '../../components/common/Skeleton';

const HomePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [loading, setLoading] = useState(true);

  // Active filter state from URL params
  const categoryParam = searchParams.get('category') || '';
  const searchParam = searchParams.get('search') || '';
  const minPriceParam = searchParams.get('minPrice') || '';
  const maxPriceParam = searchParams.get('maxPrice') || '';
  const inStockParam = searchParams.get('inStockOnly') === 'true';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page'), 10) || 1;

  // Fetch Categories
  useEffect(() => {
    categoryApi
      .getPublicCategories()
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pageParam,
        limit: 12,
        sort: sortParam,
      };
      if (categoryParam) params.category = categoryParam;
      if (searchParam) params.search = searchParam;
      if (minPriceParam) params.minPrice = minPriceParam;
      if (maxPriceParam) params.maxPrice = maxPriceParam;
      if (inStockParam) params.inStockOnly = true;

      const res = await productApi.getProducts(params);
      if (res.success) {
        setProducts(res.data);
        if (res.meta) {
          setPagination(res.meta);
        }
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  }, [categoryParam, searchParam, minPriceParam, maxPriceParam, inStockParam, sortParam, pageParam]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Update URL search parameters helper
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to first page
    setSearchParams(newParams);
  };

  const resetFilters = () => {
    setSearchParams({});
  };

  return (
    <div>
      {/* Hero Banner */}
      {!searchParam && !categoryParam && (
        <section
          style={{
            position: 'relative',
            padding: '72px 0 64px',
            borderBottom: '1px solid var(--border-subtle)',
            overflow: 'hidden',
          }}
        >
          <div className="container">
            <div style={{ maxWidth: 760 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-light)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  color: 'var(--primary)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  marginBottom: 20,
                }}
              >
                <Sparkles size={15} />
                <span>AUTUMN COLLECTION 2026</span>
              </div>

              <h1
                style={{
                  fontSize: 'clamp(2.4rem, 5vw, 3.8rem)',
                  fontWeight: 800,
                  lineHeight: 1.15,
                  letterSpacing: '-0.03em',
                  marginBottom: 20,
                }}
              >
                Engineered for Performance. <br />
                <span
                  style={{
                    background: 'linear-gradient(135deg, #a5b4fc 0%, #6366f1 50%, #d946ef 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Crafted for Distinction.
                </span>
              </h1>

              <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 32 }}>
                Explore flagship acoustics, ultra-light engineering, and bespoke artisan apparel. Authenticity guaranteed with express global fulfillment.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                <a href="#product-catalog" className="btn btn-primary btn-lg">
                  <span>Explore Catalog</span>
                  <ArrowRight size={18} />
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Catalog & Filter Section */}
      <section id="product-catalog" style={{ paddingTop: 48, paddingBottom: 64 }}>
        <div className="container">
          {/* Section Header */}
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
              <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                {searchParam ? `Search Results for "${searchParam}"` : categoryParam ? `Category: ${categoryParam}` : 'Featured Products'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Showing {products.length} of {pagination.totalCount} product{pagination.totalCount === 1 ? '' : 's'}
              </p>
            </div>
          </div>

          {/* Main Grid Layout */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '260px 1fr',
              gap: 32,
              alignItems: 'flex-start',
            }}
            className="home-grid"
          >
            {/* Sidebar Filters */}
            <ProductFilters
              categories={categories}
              selectedCategory={categoryParam}
              onCategoryChange={(slug) => updateFilter('category', slug)}
              minPrice={minPriceParam}
              maxPrice={maxPriceParam}
              onPriceChange={(type, val) => updateFilter(type === 'min' ? 'minPrice' : 'maxPrice', val)}
              inStockOnly={inStockParam}
              onInStockChange={(val) => updateFilter('inStockOnly', val ? 'true' : '')}
              sort={sortParam}
              onSortChange={(val) => updateFilter('sort', val)}
              onResetFilters={resetFilters}
            />

            {/* Products Column */}
            <div>
              {loading ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 24,
                  }}
                >
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="card" style={{ padding: 16 }}>
                      <Skeleton height="180px" style={{ marginBottom: 16 }} />
                      <Skeleton height="20px" width="60%" style={{ marginBottom: 8 }} />
                      <Skeleton height="16px" style={{ marginBottom: 16 }} />
                      <Skeleton height="36px" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="card empty-state">
                  <div className="empty-state-icon">
                    <PackageSearch size={32} />
                  </div>
                  <h3 className="empty-state-title">No products found</h3>
                  <p className="empty-state-desc">
                    We couldn't find any items matching your selected criteria. Try adjusting your filters or search term.
                  </p>
                  <button type="button" className="btn btn-secondary" onClick={resetFilters}>
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                      gap: 24,
                    }}
                  >
                    {products.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {/* Pagination Controls */}
                  {pagination.totalPages > 1 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 10,
                        marginTop: 48,
                      }}
                    >
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={!pagination.hasPrevPage}
                        onClick={() => updateFilter('page', (pagination.page - 1).toString())}
                      >
                        Previous
                      </button>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <button
                        className="btn btn-secondary btn-sm"
                        disabled={!pagination.hasNextPage}
                        onClick={() => updateFilter('page', (pagination.page + 1).toString())}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .home-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default HomePage;
