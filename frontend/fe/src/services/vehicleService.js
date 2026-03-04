import apiClient from './api.js';

/**
 * Vehicle Service - Tất cả các API calls liên quan đến vehicles
 */

/**
 * Lấy danh sách vehicles với pagination và filters
 * @param {Object} params - { page, limit, status, vehicle_type, category, min_price, max_price, brand, search }
 * @returns {Promise} Response với vehicles và pagination
 */
export const getVehicles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `/vehicles?${queryString}` : '/vehicles';
  
  return apiClient(url, {
    method: 'GET',
  });
};

/**
 * Lấy chi tiết 1 vehicle
 * @param {string} id - Vehicle ID
 * @returns {Promise} Vehicle object
 */
export const getVehicleById = async (id) => {
  return apiClient(`/vehicles/${id}`, {
    method: 'GET',
  });
};

/**
 * Lấy danh sách vehicle types
 * @param {Object} params - { category }
 * @returns {Promise} Array of vehicle types
 */
export const getVehicleTypes = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  if (params.category) {
    queryParams.append('category', params.category);
  }

  const queryString = queryParams.toString();
  const url = queryString ? `/vehicles/types?${queryString}` : '/vehicles/types';
  
  return apiClient(url, {
    method: 'GET',
  });
};

/**
 * Tìm kiếm vehicles với advanced filters
 * @param {Object} params - { start_date, end_date, vehicle_type, category, min_price, max_price, seats, transmission, fuel_type, page, limit }
 * @returns {Promise} Response với vehicles và pagination
 */
export const searchVehicles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `/vehicles/search?${queryString}` : '/vehicles/search';
  
  return apiClient(url, {
    method: 'GET',
  });
};

/**
 * Lấy danh sách vehicles có sẵn trong khoảng thời gian
 * @param {Object} params - { start_date, end_date, vehicle_type, category, min_price, max_price }
 * @returns {Promise} Response với available vehicles
 */
export const getAvailableVehicles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  
  Object.keys(params).forEach(key => {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      queryParams.append(key, params[key]);
    }
  });

  const queryString = queryParams.toString();
  const url = queryString ? `/vehicles/available?${queryString}` : '/vehicles/available';
  
  return apiClient(url, {
    method: 'GET',
  });
};
