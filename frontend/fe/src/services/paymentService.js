import apiClient from './api.js';

/**
 * Payment Service - Tất cả các API calls liên quan đến payments
 */

/**
 * Tạo payment
 * @param {Object} paymentData - { booking, payment_type, amount, payment_method, promotion_code? }
 * @returns {Promise} Payment object với payment_url nếu online
 */
export const createPayment = async (paymentData) => {
  return apiClient('/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  });
};

/**
 * Lấy chi tiết payment
 * @param {string} id - Payment ID
 * @returns {Promise} Payment object
 */
export const getPaymentById = async (id) => {
  return apiClient(`/payments/${id}`, {
    method: 'GET',
  });
};

/**
 * Lấy danh sách payments
 * @param {Object} params - { page, limit, booking, customer, status, payment_type }
 * @returns {Promise} Response với payments và pagination
 */
export const getPayments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `/payments?${queryString}` : '/payments';
  
  return apiClient(url, {
    method: 'GET',
  });
};

/**
 * Lấy payments của 1 booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Array of payments với summary
 */
export const getBookingPayments = async (bookingId) => {
  return apiClient(`/payments/booking/${bookingId}`, {
    method: 'GET',
  });
};

/**
 * Lấy payment summary của booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Payment summary
 */
export const getPaymentSummary = async (bookingId) => {
  return apiClient(`/payments/booking/${bookingId}/summary`, {
    method: 'GET',
  });
};

/**
 * Xử lý cash payment (staff only)
 * @param {string} id - Payment ID
 * @param {string} transactionId - Transaction ID (optional)
 * @returns {Promise} Updated payment
 */
export const processPayment = async (id, transactionId) => {
  return apiClient(`/payments/${id}/process`, {
    method: 'POST',
    body: JSON.stringify({ transaction_id: transactionId }),
  });
};

/**
 * Verify payment
 * @param {string} id - Payment ID
 * @param {Object} vnpayParams - VNPay callback params (optional)
 * @returns {Promise} Payment status
 */
export const verifyPayment = async (id, vnpayParams = null) => {
  return apiClient(`/payments/${id}/verify`, {
    method: 'POST',
    body: JSON.stringify(vnpayParams || {}),
  });
};

/**
 * Hủy payment
 * @param {string} id - Payment ID
 * @returns {Promise} Updated payment
 */
export const cancelPayment = async (id) => {
  return apiClient(`/payments/${id}/cancel`, {
    method: 'POST',
  });
};

/**
 * Tạo payment URL (cho online payment)
 * @param {string} id - Payment ID
 * @param {string} returnUrl - Return URL sau khi thanh toán
 * @returns {Promise} Payment URL
 */
export const createPaymentUrl = async (id, returnUrl) => {
  return apiClient(`/payments/${id}/create-payment-url`, {
    method: 'POST',
    body: JSON.stringify({ return_url: returnUrl }),
  });
};

/**
 * Kiểm tra trạng thái payment (polling)
 * @param {string} id - Payment ID
 * @returns {Promise} Payment status
 */
export const checkPaymentStatus = async (id) => {
  return apiClient(`/payments/${id}/check-status`, {
    method: 'GET',
  });
};

/**
 * Tạo refund
 * @param {string} id - Payment ID
 * @param {Object} data - { amount, reason }
 * @returns {Promise} Refund payment
 */
export const createRefund = async (id, data) => {
  return apiClient(`/payments/${id}/refund`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Lấy refunds của 1 payment
 * @param {string} id - Payment ID
 * @returns {Promise} Array of refunds
 */
export const getRefunds = async (id) => {
  return apiClient(`/payments/${id}/refunds`, {
    method: 'GET',
  });
};
