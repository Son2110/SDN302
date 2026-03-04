import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, CreditCard, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import * as bookingService from "../services/bookingService";

const CustomerDashboard = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings({ limit: 10 });
      const allBookings = response.bookings || [];
      setBookings(allBookings);

      // Calculate stats
      const now = new Date();
      const active = allBookings.filter(
        (b) => ["confirmed", "vehicle_delivered", "in_progress"].includes(b.status)
      ).length;
      const upcoming = allBookings.filter(
        (b) => b.status === "pending" && new Date(b.start_date) > now
      ).length;
      const completed = allBookings.filter((b) => b.status === "completed").length;

      setStats({
        total: allBookings.length,
        active,
        upcoming,
        completed,
      });
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700" },
      confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700" },
      in_progress: { label: "Đang thuê", color: "bg-green-100 text-green-700" },
      completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700" },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700" },
    };

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700" };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem dashboard</p>
          <Link to="/login" className="text-blue-600 hover:text-blue-700 underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Tổng bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <TrendingUp className="text-blue-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Đang thuê</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="text-green-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Sắp tới</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.upcoming}</p>
              </div>
              <Clock className="text-yellow-600" size={32} />
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Hoàn thành</p>
                <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
              </div>
              <CheckCircle className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">Bookings gần đây</h2>
            <Link
              to="/bookings"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Xem tất cả →
            </Link>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-500">Đang tải...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Bạn chưa có booking nào</p>
              <Link
                to="/fleet"
                className="text-blue-600 hover:text-blue-700 underline"
              >
                Xem danh sách xe
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.slice(0, 5).map((booking) => {
                const vehicle = booking.vehicle || {};
                return (
                  <Link
                    key={booking._id}
                    to={`/bookings/${booking._id}`}
                    className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={vehicle.image_urls?.[0] || "/cars/default.jpg"}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar size={14} />
                            {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                          </span>
                          <span className="flex items-center gap-1">
                            <CreditCard size={14} />
                            {formatPrice(booking.total_amount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 flex gap-4">
          <Link
            to="/bookings/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Đặt xe mới
          </Link>
          <Link
            to="/fleet"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Xem danh sách xe
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;
