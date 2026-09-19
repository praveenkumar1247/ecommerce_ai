import api from './axios';

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getAllOrders: (params) => api.get('/admin/orders', { params }),
  getOrderDetails: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, data) => api.patch(`/admin/orders/${id}/status`, data),
  getAllUsers: (params) => api.get('/admin/users', { params }),
};
