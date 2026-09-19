import api from './axios';

export const productApi = {
  getProducts: (params) => api.get('/products', { params }),
  getProductByIdOrSlug: (idOrSlug) => api.get(`/products/${idOrSlug}`),
  // Admin
  getAdminProducts: (params) => api.get('/admin/products', { params }),
  createProduct: (formData) =>
    api.post('/admin/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  updateStock: (id, data) => api.patch(`/admin/products/${id}/stock`, data),
  updateStatus: (id, status) => api.patch(`/admin/products/${id}/status`, { status }),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  addImages: (id, formData) =>
    api.post(`/admin/products/${id}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  deleteImage: (productId, imageId) =>
    api.delete(`/admin/products/${productId}/images/${imageId}`),
};
