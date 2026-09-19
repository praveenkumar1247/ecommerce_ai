import api from './axios';

export const paymentApi = {
  processPayment: (data) => api.post('/payments/process', data),
};
