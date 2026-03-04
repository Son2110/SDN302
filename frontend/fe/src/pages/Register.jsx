import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    phone: '',
    id_card: '',
  });
  const [localError, setLocalError] = useState('');

  const { register, error, isAuthenticated, clearError } = useAuth();
  const navigate = useNavigate();

  // Nếu đã đăng nhập, redirect về home
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Clear error khi component unmount
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setLocalError('');
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    // Validation
    if (
      !formData.email ||
      !formData.password ||
      !formData.full_name ||
      !formData.phone
    ) {
      setLocalError('Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError('Mật khẩu xác nhận không khớp');
      return;
    }

    if (formData.password.length < 6) {
      setLocalError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    try {
      const { confirmPassword, ...registerData } = formData;
      await register(registerData);
      navigate('/', { replace: true });
    } catch (err) {
      setLocalError(err.message || 'Đăng ký thất bại');
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            Đăng Ký
          </h2>
          <p className="mt-2 text-center text-sm text-gray-300">
            Đã có tài khoản?{' '}
            <Link
              to="/login"
              className="font-medium text-blue-400 hover:text-blue-300"
            >
              Đăng nhập
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {displayError && (
            <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg text-sm">
              {displayError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="full_name"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Họ và tên *
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Nguyễn Văn A"
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Số điện thoại *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={formData.phone}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="0123456789"
              />
            </div>

            <div>
              <label
                htmlFor="id_card"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                CMND/CCCD
              </label>
              <input
                id="id_card"
                name="id_card"
                type="text"
                value={formData.id_card}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="123456789"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Mật khẩu *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Xác nhận mật khẩu *
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                value={formData.confirmPassword}
                onChange={handleChange}
                className="appearance-none relative block w-full px-4 py-3 border border-white/20 bg-white/5 rounded-lg placeholder-gray-400 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              Đăng Ký
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
