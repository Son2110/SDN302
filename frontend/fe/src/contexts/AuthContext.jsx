import { createContext, useContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Kiểm tra token khi component mount
  useEffect(() => {
    const initAuth = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          const userData = await authService.getMe();
          setUser(userData);
        } catch (err) {
          // Token không hợp lệ, xóa token
          authService.logout();
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  /**
   * Đăng ký
   */
  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      
      // Lưu token và user info
      authService.saveToken(response.token);
      authService.saveUser({ _id: response._id, email: response.email });
      
      // Lấy thông tin đầy đủ của user
      const fullUserData = await authService.getMe();
      setUser(fullUserData);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Đăng nhập
   */
  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      
      // Lưu token và user info
      authService.saveToken(response.token);
      authService.saveUser({
        _id: response._id,
        email: response.email,
        full_name: response.full_name,
      });
      
      // Lấy thông tin đầy đủ của user
      const userData = await authService.getMe();
      setUser(userData);
      
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  /**
   * Đăng xuất
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    register,
    login,
    logout,
    clearError: () => setError(null),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
