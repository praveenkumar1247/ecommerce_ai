import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Layers } from 'lucide-react';
import { categoryApi } from '../../api/categoryApi';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const AdminCategoriesPage = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const { success, error: toastError } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [saving, setSaving] = useState(false);

  const [deleteConfirmCat, setDeleteConfirmCat] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await categoryApi.getAllCategories();
      if (res.success) setCategories(res.data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const openAddModal = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setStatus('ACTIVE');
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setStatus(cat.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, { name, description, status });
        success('Category updated.');
      } else {
        await categoryApi.createCategory({ name, description, status });
        success('Category created.');
      }
      setIsModalOpen(false);
      loadCategories();
    } catch (err) {
      toastError(err.message || 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (cat) => {
    try {
      await categoryApi.toggleStatus(cat.id);
      success('Category status updated.');
      loadCategories();
    } catch (err) {
      toastError(err.message || 'Failed to toggle status.');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmCat) return;
    setDeleting(true);
    try {
      await categoryApi.deleteCategory(deleteConfirmCat.id);
      success('Category deleted.');
      setDeleteConfirmCat(null);
      loadCategories();
    } catch (err) {
      toastError(err.message || 'Failed to delete category.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Categories Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Organize catalog hierarchy and product taxonomy
          </p>
        </div>

        <button type="button" className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add Category</span>
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Category Name</th>
              <th>Slug</th>
              <th>Description</th>
              <th>Products Linked</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40 }}>
                  <div className="spinner" style={{ margin: '0 auto' }} />
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((cat) => (
                <tr key={cat.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{cat.name}</td>
                  <td>
                    <code style={{ fontSize: '0.8rem', color: 'var(--secondary)' }}>{cat.slug}</code>
                  </td>
                  <td style={{ maxWidth: 300, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {cat.description || '—'}
                  </td>
                  <td>
                    <span className="badge badge-primary">{cat._count?.products || 0} products</span>
                  </td>
                  <td>
                    <Badge variant={cat.status === 'ACTIVE' ? 'success' : 'warning'}>
                      {cat.status}
                    </Badge>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleToggleStatus(cat)}
                      >
                        {cat.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => openEditModal(cat)}
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setDeleteConfirmCat(cat)}
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Create Category'}
      >
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Category Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acoustics & Audio"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief overview of items in this category..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : editingCategory ? 'Update Category' : 'Create Category'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteConfirmCat)}
        onClose={() => setDeleteConfirmCat(null)}
        onConfirm={handleDelete}
        title="Delete Category?"
        message={`Are you sure you want to delete category "${deleteConfirmCat?.name}"? The server will reject deletion if any products currently depend on this category.`}
        confirmText="Delete Category"
        loading={deleting}
      />
    </div>
  );
};

export default AdminCategoriesPage;
