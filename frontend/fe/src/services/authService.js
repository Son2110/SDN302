import apiClient from './api.js';

/**
 * Auth Service - Tất cả các API calls liên quan đến authentication
 */

/**
 * Đăng ký tài khoản mới
 * @param {Object} userData - { email, password, full_name, phone, id_card }
 * @returns {Promise} Response từ server
 */
export const register = async (userData) => {
  return apiClient('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

/**
 * Đăng nhập
 * @param {Object} credentials - { email, password }
 * @returns {Promise} Response từ server với token
 */
export const login = async (credentials) => {
  return apiClient('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

/**
 * Lấy thông tin user hiện tại (cần authentication)
 * @returns {Promise} User object
 */
export const getMe = async () => {
  return apiClient('/auth/me', {
    method: 'GET',
  });
};

/**
 * Đăng xuất (chỉ xóa token ở client)
 */
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};

/**
 * Lưu token vào localStorage
 * @param {string} token - JWT token
 */
export const saveToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Lấy token từ localStorage
 * @returns {string|null} Token hoặc null
 */
export const getToken = () => {
  return localStorage.getItem('token');
};

/**
 * Lưu user info vào localStorage
 * @param {Object} user - User object
 */
export const saveUser = (user) => {
  localStorage.setItem('user', JSON.stringify(user));
};

/**
 * Lấy user info từ localStorage
 * @returns {Object|null} User object hoặc null
 */
export const getUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};
