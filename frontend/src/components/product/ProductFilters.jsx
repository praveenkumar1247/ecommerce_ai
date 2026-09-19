import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';

const ProductFilters = ({
  categories = [],
  selectedCategory,
  onCategoryChange,
  minPrice,
  maxPrice,
  onPriceChange,
  inStockOnly,
  onInStockChange,
  sort,
  onSortChange,
  onResetFilters,
}) => {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '1rem' }}>
          <Filter size={18} color="var(--primary)" />
          <span>Filters</span>
        </div>
        <button
          type="button"
          onClick={onResetFilters}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            cursor: 'pointer',
          }}
          title="Reset filters"
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>
      </div>

      {/* Sorting */}
      <div className="form-group" style={{ marginBottom: 24 }}>
        <label className="form-label">Sort Products By</label>
        <select value={sort} onChange={(e) => onSortChange(e.target.value)} id="filter-sort-select">
          <option value="newest">Newest Arrivals</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="discount">Highest Discount</option>
          <option value="name_asc">Name: A to Z</option>
        </select>
      </div>

      {/* Category List */}
      <div className="form-group" style={{ marginBottom: 24 }}>
        <label className="form-label">Category</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <button
            type="button"
            onClick={() => onCategoryChange('')}
            style={{
              textAlign: 'left',
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.88rem',
              fontWeight: selectedCategory === '' ? 700 : 500,
              backgroundColor: selectedCategory === '' ? 'var(--primary-light)' : 'transparent',
              color: selectedCategory === '' ? 'var(--primary)' : 'var(--text-secondary)',
              border: selectedCategory === '' ? '1px solid var(--border-focus)' : '1px solid transparent',
              transition: 'all var(--transition-fast)',
            }}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onCategoryChange(cat.slug)}
              style={{
                textAlign: 'left',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.88rem',
                fontWeight: selectedCategory === cat.slug ? 700 : 500,
                backgroundColor: selectedCategory === cat.slug ? 'var(--primary-light)' : 'transparent',
                color: selectedCategory === cat.slug ? 'var(--primary)' : 'var(--text-secondary)',
                border: selectedCategory === cat.slug ? '1px solid var(--border-focus)' : '1px solid transparent',
                transition: 'all var(--transition-fast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span>{cat.name}</span>
              {cat._count?.products !== undefined && (
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({cat._count.products})
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="form-group" style={{ marginBottom: 24 }}>
        <label className="form-label">Price Range (₹)</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onPriceChange('min', e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem' }}
            id="filter-min-price"
          />
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onPriceChange('max', e.target.value)}
            style={{ width: '100%', fontSize: '0.85rem' }}
            id="filter-max-price"
          />
        </div>
      </div>

      {/* In Stock Only */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="checkbox"
          id="inStockOnly"
          checked={inStockOnly}
          onChange={(e) => onInStockChange(e.target.checked)}
          style={{ width: 18, height: 18, accentColor: 'var(--primary)', cursor: 'pointer' }}
        />
        <label htmlFor="inStockOnly" style={{ fontSize: '0.9rem', cursor: 'pointer', userSelect: 'none' }}>
          In Stock Items Only
        </label>
      </div>
    </div>
  );
};

export default ProductFilters;
