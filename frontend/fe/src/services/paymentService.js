import { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL;

/**
 * Payment Service - Tất cả các API calls liên quan đến payments
 */

/**
 * Tạo payment
 * @param {Object} paymentData - { booking, payment_type, amount, payment_method, promotion_code? }
 * @returns {Promise} Payment object với payment_url nếu online
 */
export const createPayment = async (paymentData) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy chi tiết payment
 * @param {string} id - Payment ID
 * @returns {Promise} Payment object
 */
export const getPaymentById = async (id) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payment');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách payments
 * @param {Object} params - { page, limit, booking, customer, status, payment_type }
 * @returns {Promise} Response với payments và pagination
 */
export const getPayments = async (params = {}) => {
  const token = getToken();
  try {
    const queryParams = new URLSearchParams();

    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key]);
      }
    });

    const url = `${API_URL}/payments${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payments');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Thanh toán cọc (deposit)
 * @param {Object} paymentData - { booking_id, payment_method }
 * @returns {Promise} Payment response
 */
export const processDepositPayment = async (paymentData) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process deposit payment');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Thanh toán cuối (final payment)
 * @param {Object} paymentData - { booking_id, payment_method }
 * @returns {Promise} Payment response
 */
export const processFinalPayment = async (paymentData) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/final`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(paymentData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process final payment');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy payments của 1 booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Array of payments với summary
 */
export const getBookingPayments = async (bookingId) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/booking/${bookingId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch booking payments');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy payment summary của booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Payment summary
 */
export const getPaymentSummary = async (bookingId) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/booking/${bookingId}/summary`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch payment summary');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Xử lý cash payment (staff only)
 * @param {string} id - Payment ID
 * @param {string} transactionId - Transaction ID (optional)
 * @returns {Promise} Updated payment
 */
export const processPayment = async (id, transactionId) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transaction_id: transactionId }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to process payment');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Verify payment (legacy / other gateways)
 * @param {string} id - Payment ID
 * @param {Object} vnpayParams - VNPay callback params (optional)
 * @returns {Promise} Payment status
 */
export const verifyPayment = async (id, vnpayParams = null) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(vnpayParams || {}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to verify payment');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo thanh toán VNPay (sandbox) – trả về URL để redirect
 * @param {string} bookingId - Booking ID
 * @param {string} paymentType - 'deposit' | 'rental_fee'
 * @param {string} [returnUrl] - Optional frontend return URL (backend sẽ redirect về đây sau xử lý)
 * @returns {Promise<{ paymentUrl, payment_id, txn_ref }>}
 */
export const createVnpayPayment = async (bookingId, paymentType, returnUrl) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/payments/vnpay/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      booking_id: bookingId,
      payment_type: paymentType,
      ...(returnUrl && { return_url: returnUrl }),
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Tạo URL VNPay thất bại');
  return data;
};

/**
 * Lấy payment theo mã giao dịch VNPay (vnp_TxnRef)
 * @param {string} txnRef - vnp_TxnRef (payment._id)
 * @returns {Promise<{ payment }>}
 */
export const getPaymentByTxnRef = async (txnRef) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/payments/by-txn/${encodeURIComponent(txnRef)}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Không tìm thấy giao dịch');
  return data;
};

/**
 * Xác thực callback VNPay từ frontend (sau khi redirect về /payment/success)
 * @param {string} txnRef - vnp_TxnRef
 * @param {Object} vnpayParams - Toàn bộ query params từ VNPay (object key-value)
 * @returns {Promise<{ payment }>}
 */
export const verifyVnpayPayment = async (txnRef, vnpayParams) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/payments/vnpay/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ txnRef, vnpayParams }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'Xác thực thất bại');
  return data;
};

/**
 * Hủy payment
 * @param {string} id - Payment ID
 * @returns {Promise} Updated payment
 */
export const cancelPayment = async (id) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}/cancel`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to cancel payment');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo payment URL (cho online payment)
 * @param {string} id - Payment ID
 * @param {string} returnUrl - Return URL sau khi thanh toán
 * @returns {Promise} Payment URL
 */
export const createPaymentUrl = async (id, returnUrl) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}/create-payment-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ return_url: returnUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create payment URL');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm tra trạng thái payment (polling)
 * @param {string} id - Payment ID
 * @returns {Promise} Payment status
 */
export const checkPaymentStatus = async (id) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}/check-status`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to check payment status');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo refund
 * @param {string} id - Payment ID
 * @param {Object} data - { amount, reason }
 * @returns {Promise} Refund payment
 */
export const createRefund = async (id, data) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to create refund');
    }

    return responseData;
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy refunds của 1 payment
 * @param {string} id - Payment ID
 * @returns {Promise} Array of refunds
 */
export const getRefunds = async (id) => {
  const token = getToken();
  try {
    const response = await fetch(`${API_URL}/payments/${id}/refunds`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch refunds');
    }

    return data;
  } catch (error) {
    throw error;
  }
};
