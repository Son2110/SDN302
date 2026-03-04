import apiClient from './api.js';

/**
 * Booking Service - Tất cả các API calls liên quan đến bookings
 */

/**
 * Tạo booking mới
 * @param {Object} bookingData - { vehicle, rental_type, start_date, end_date, pickup_location, return_location, promotion_code? }
 * @returns {Promise} Booking object với priceInfo
 */
export const createBooking = async (bookingData) => {
  return apiClient('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });
};

/**
 * Lấy danh sách bookings
 * @param {Object} params - { page, limit, status, customer, vehicle, start_date, end_date }
 * @returns {Promise} Response với bookings và pagination
 */
export const getBookings = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `/bookings?${queryString}` : '/bookings';
  
  return apiClient(url, {
    method: 'GET',
  });
};

/**
 * Lấy chi tiết booking
 * @param {string} id - Booking ID
 * @returns {Promise} Booking object với handovers, extensionRequests, driverAssignment
 */
export const getBookingById = async (id) => {
  return apiClient(`/bookings/${id}`, {
    method: 'GET',
  });
};

/**
 * Update booking
 * @param {string} id - Booking ID
 * @param {Object} data - { pickup_location?, return_location? }
 * @returns {Promise} Updated booking
 */
export const updateBooking = async (id, data) => {
  return apiClient(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Xóa booking (chỉ khi pending)
 * @param {string} id - Booking ID
 * @returns {Promise} Success message
 */
export const deleteBooking = async (id) => {
  return apiClient(`/bookings/${id}`, {
    method: 'DELETE',
  });
};

/**
 * Xác nhận booking (staff only)
 * @param {string} id - Booking ID
 * @returns {Promise} Updated booking
 */
export const confirmBooking = async (id) => {
  return apiClient(`/bookings/${id}/confirm`, {
    method: 'POST',
  });
};

/**
 * Hủy booking
 * @param {string} id - Booking ID
 * @param {string} reason - Lý do hủy (optional)
 * @returns {Promise} Updated booking với refund info
 */
export const cancelBooking = async (id, reason) => {
  return apiClient(`/bookings/${id}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
};

/**
 * Bàn giao xe (staff only)
 * @param {string} id - Booking ID
 * @param {Object} data - { mileage, fuel_level_percentage, notes, customer_signature? }
 * @returns {Promise} Updated booking với handover
 */
export const deliverVehicle = async (id, data) => {
  return apiClient(`/bookings/${id}/deliver`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Trả xe (staff only)
 * @param {string} id - Booking ID
 * @param {Object} data - { actual_return_date, mileage, fuel_level_percentage, notes, damages? }
 * @returns {Promise} Updated booking với final amount và penalties
 */
export const returnVehicle = async (id, data) => {
  return apiClient(`/bookings/${id}/return`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Tính giá booking
 * @param {Object} data - { vehicle, start_date, end_date, rental_type, promotion_code? }
 * @returns {Promise} Price info { baseAmount, discountAmount, totalAmount, depositAmount, days, dailyRate }
 */
export const calculatePrice = async (data) => {
  return apiClient('/bookings/calculate-price', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Kiểm tra availability
 * @param {Object} params - { vehicle, start_date, end_date }
 * @returns {Promise} { available, conflictingBookings? }
 */
export const checkAvailability = async (params) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null) {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  const url = `/bookings/check-availability?${queryString}`;
  
  return apiClient(url, {
    method: 'GET',
  });
};

/**
 * Yêu cầu gia hạn
 * @param {string} bookingId - Booking ID
 * @param {Object} data - { new_end_date, reason? }
 * @returns {Promise} Extension request với additional amount
 */
export const requestExtension = async (bookingId, data) => {
  return apiClient(`/bookings/${bookingId}/extend`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Lấy extension requests của booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Array of extension requests
 */
export const getExtensionRequests = async (bookingId) => {
  return apiClient(`/bookings/${bookingId}/extension-requests`, {
    method: 'GET',
  });
};

/**
 * Phân công tài xế (staff only)
 * @param {string} bookingId - Booking ID
 * @param {string} driverId - Driver ID
 * @returns {Promise} Driver assignment
 */
export const assignDriver = async (bookingId, driverId) => {
  return apiClient(`/bookings/${bookingId}/assign-driver`, {
    method: 'POST',
    body: JSON.stringify({ driver_id: driverId }),
  });
};

/**
 * Lấy driver assignment của booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Driver assignment
 */
export const getDriverAssignment = async (bookingId) => {
  return apiClient(`/bookings/${bookingId}/driver-assignment`, {
    method: 'GET',
  });
};

/**
 * Chấp nhận driver assignment (driver only)
 * @param {string} assignmentId - Driver Assignment ID
 * @returns {Promise} Updated assignment
 */
export const acceptDriverAssignment = async (assignmentId) => {
  return apiClient(`/bookings/driver-assignments/${assignmentId}/accept`, {
    method: 'PUT',
  });
};

/**
 * Từ chối driver assignment (driver only)
 * @param {string} assignmentId - Driver Assignment ID
 * @param {string} responseNote - Lý do từ chối
 * @returns {Promise} Updated assignment
 */
export const rejectDriverAssignment = async (assignmentId, responseNote) => {
  return apiClient(`/bookings/driver-assignments/${assignmentId}/reject`, {
    method: 'PUT',
    body: JSON.stringify({ response_note: responseNote }),
  });
};

/**
 * Lấy handovers của booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Array of handovers
 */
export const getHandovers = async (bookingId) => {
  return apiClient(`/bookings/${bookingId}/handovers`, {
    method: 'GET',
  });
};

/**
 * Xác nhận handover (customer)
 * @param {string} handoverId - Handover ID
 * @param {Object} signature - Customer signature
 * @returns {Promise} Updated handover
 */
export const confirmHandover = async (handoverId, signature) => {
  return apiClient(`/bookings/handovers/${handoverId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ customer_signature: signature }),
  });
};

/**
 * Lấy payment summary của booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise} Payment summary
 */
export const getPaymentSummary = async (bookingId) => {
  return apiClient(`/bookings/${bookingId}/payment-summary`, {
    method: 'GET',
  });
};
