import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Layers,
  Upload,
  Search,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getImageUrl } from '../../utils/formatters';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, totalCount: 0 });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const { success, error: toastError } = useToast();

  // Add / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    brand: '',
    sku: '',
    price: '',
    discountPercent: '0',
    stockQuantity: '10',
    categoryId: '',
    status: 'ACTIVE',
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [saving, setSaving] = useState(false);

  // Stock Adjustment Modal
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [stockAction, setStockAction] = useState('SET');
  const [stockQty, setStockQty] = useState('');
  const [savingStock, setSavingStock] = useState(false);

  // Delete Confirm Modal
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Fetch Categories
  useEffect(() => {
    categoryApi
      .getAllCategories()
      .then((res) => {
        if (res.success) setCategories(res.data);
      })
      .catch((err) => console.error('Failed to load categories:', err));
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, limit: 15 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.categoryId = categoryFilter;

      const res = await productApi.getAdminProducts(params);
      if (res.success) {
        setProducts(res.data);
        if (res.meta) setPagination(res.meta);
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, search, statusFilter, categoryFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openAddModal = () => {
    setEditingProductId(null);
    setSelectedFiles([]);
    setFormData({
      name: '',
      description: '',
      brand: '',
      sku: `SKU-${Date.now().toString().slice(-6)}`,
      price: '',
      discountPercent: '0',
      stockQuantity: '10',
      categoryId: categories[0]?.id || '',
      status: 'ACTIVE',
    });
    setIsProductModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProductId(product.id);
    setSelectedFiles([]);
    setFormData({
      name: product.name,
      description: product.description,
      brand: product.brand || '',
      sku: product.sku,
      price: product.price.toString(),
      discountPercent: product.discountPercent.toString(),
      stockQuantity: product.stockQuantity.toString(),
      categoryId: product.categoryId.toString(),
      status: product.status,
    });
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingProductId) {
        // Update product metadata
        await productApi.updateProduct(editingProductId, formData);

        // If new files were selected during edit, upload them
        if (selectedFiles.length > 0) {
          const filesData = new FormData();
          Array.from(selectedFiles).forEach((f) => filesData.append('images', f));
          await productApi.addImages(editingProductId, filesData);
        }

        success('Product updated successfully.');
      } else {
        // Create new product with multipart upload
        const data = new FormData();
        Object.entries(formData).forEach(([k, v]) => data.append(k, v));
        Array.from(selectedFiles).forEach((f) => data.append('images', f));

        await productApi.createProduct(data);
        success('Product created successfully.');
      }

      setIsProductModalOpen(false);
      loadProducts();
    } catch (err) {
      toastError(err.message || 'Failed to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleStockUpdate = async (e) => {
    e.preventDefault();
    if (!stockModalProduct) return;

    setSavingStock(true);
    try {
      await productApi.updateStock(stockModalProduct.id, {
        quantity: stockQty,
        action: stockAction,
      });
      success('Inventory updated.');
      setStockModalProduct(null);
      loadProducts();
    } catch (err) {
      toastError(err.message || 'Failed to update stock.');
    } finally {
      setSavingStock(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await productApi.updateStatus(product.id, nextStatus);
      success(`Product marked as ${nextStatus}.`);
      loadProducts();
    } catch (err) {
      toastError(err.message || 'Failed to change product status.');
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirmProduct) return;
    setDeleting(true);
    try {
      const res = await productApi.deleteProduct(deleteConfirmProduct.id);
      success(res.message || 'Product deleted.');
      setDeleteConfirmProduct(null);
      loadProducts();
    } catch (err) {
      toastError(err.message || 'Failed to delete product.');
    } finally {
      setDeleting(false);
    }
  };

  // Preview calculated offer price in modal
  const previewOfferPrice = () => {
    const p = parseFloat(formData.price) || 0;
    const d = parseFloat(formData.discountPercent) || 0;
    return Math.round(p * (1 - d / 100) * 100) / 100;
  };

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Product Catalog Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Add, update pricing, upload images, manage stock, and monitor product statuses
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openAddModal} id="admin-add-product-btn">
          <Plus size={18} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: 16, marginBottom: 24, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search by title, SKU, or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', paddingLeft: 38 }}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{ minWidth: 160 }}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ minWidth: 140 }}
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="INACTIVE">INACTIVE</option>
          <option value="OUT_OF_STOCK">OUT_OF_STOCK</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Price</th>
              <th>Discount</th>
              <th>Offer Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No products found matching criteria.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const img = p.images?.[0]?.imageUrl;
                return (
                  <tr key={p.id}>
                    <td>
                      <img
                        src={getImageUrl(img)}
                        alt=""
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 6,
                          objectFit: 'contain',
                          backgroundColor: '#0d131f',
                        }}
                      />
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        SKU: {p.sku} {p.brand && `• ${p.brand}`}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>{p.category?.name}</span>
                    </td>
                    <td>{formatCurrency(p.price)}</td>
                    <td>{p.discountPercent > 0 ? `${Math.round(p.discountPercent)}%` : '0%'}</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>
                      {formatCurrency(p.offerPrice)}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setStockModalProduct(p);
                          setStockQty(p.stockQuantity.toString());
                          setStockAction('SET');
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: 'var(--radius-sm)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        }}
                        title="Click to adjust stock"
                      >
                        <span style={{ fontWeight: 700 }}>{p.stockQuantity}</span>
                        <RefreshCw size={12} color="var(--text-muted)" />
                      </button>
                    </td>
                    <td>
                      <Badge
                        variant={
                          p.status === 'ACTIVE'
                            ? 'success'
                            : p.status === 'OUT_OF_STOCK'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleToggleStatus(p)}
                          title="Toggle Active/Inactive"
                        >
                          {p.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-secondary"
                          onClick={() => openEditModal(p)}
                          title="Edit product"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline"
                          onClick={() => setDeleteConfirmProduct(p)}
                          style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProductId ? 'Edit Product' : 'Add New Product'}
        maxWidth="680px"
      >
        <form onSubmit={handleSaveProduct}>
          <div className="form-group">
            <label className="form-label">Product Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Apex Pro Wireless ANC Headphones"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Brand</label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. AcoustiMax"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">SKU (Unique Code) *</label>
              <input
                type="text"
                required
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="e.g. ELEC-001"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Initial Stock Quantity *</label>
              <input
                type="number"
                min="0"
                required
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: e.target.value })}
              />
            </div>
          </div>

          {/* Pricing Row */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Retail Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="1000.00"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Discount Percentage (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
              />
            </div>
          </div>

          {/* Price Preview Banner */}
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: 'var(--primary-light)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 16,
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ color: 'var(--text-secondary)' }}>Calculated Customer Offer Price:</span>
            <strong style={{ color: 'var(--primary)', fontSize: '1.05rem' }}>
              {formatCurrency(previewOfferPrice())}
            </strong>
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed technical specifications, materials, warranty, and features..."
            />
          </div>

          {/* Local Image Upload */}
          <div className="form-group">
            <label className="form-label">Upload Product Images (Max 5, 5MB each)</label>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={(e) => setSelectedFiles(e.target.files)}
              style={{ padding: 8 }}
            />
            <span className="form-hint">
              Images will be securely saved into local <code>backend/uploads/products/</code> storage
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsProductModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingProductId ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Stock Adjustment Modal */}
      <Modal
        isOpen={Boolean(stockModalProduct)}
        onClose={() => setStockModalProduct(null)}
        title={`Adjust Stock: ${stockModalProduct?.name}`}
        maxWidth="460px"
      >
        <form onSubmit={handleStockUpdate}>
          <div style={{ marginBottom: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Current Database Stock: <strong style={{ color: 'var(--text-primary)' }}>{stockModalProduct?.stockQuantity}</strong>
          </div>

          <div className="form-group">
            <label className="form-label">Action</label>
            <select value={stockAction} onChange={(e) => setStockAction(e.target.value)}>
              <option value="SET">Set Exact Stock</option>
              <option value="INCREASE">Increase Stock (+)</option>
              <option value="DECREASE">Decrease Stock (-)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              min="0"
              required
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStockModalProduct(null)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={savingStock}>
              {savingStock ? 'Updating...' : 'Update Inventory'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmProduct)}
        onClose={() => setDeleteConfirmProduct(null)}
        onConfirm={handleDeleteProduct}
        title="Delete Product?"
        message={`Are you sure you want to delete "${deleteConfirmProduct?.name}"? If past orders reference this product, it will be safely archived (soft-deleted).`}
        confirmText="Confirm Delete"
        loading={deleting}
      />
    </div>
  );
};

export default AdminProductsPage;
