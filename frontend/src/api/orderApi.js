import api from './axios';

export const orderApi = {
  checkoutPreview: (data) => api.post('/orders/checkout-preview', data),
  createOrder: (data) => api.post('/orders', data),
  getUserOrders: () => api.get('/orders'),
  getOrderById: (id) => api.get(`/orders/${id}`),
  cancelOrder: (id) => api.post(`/orders/${id}/cancel`),
};
