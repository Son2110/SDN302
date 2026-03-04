// API Base Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * API Client - Wrapper cho fetch với error handling
 */
const apiClient = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Lấy token từ localStorage nếu có
  const token = localStorage.getItem('token');
  
  // Default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  // Thêm Authorization header nếu có token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    // Nếu response không OK, throw error
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    // Xử lý lỗi network hoặc parsing
    throw new Error(error.message || 'Network error occurred');
  }
};

export default apiClient;
