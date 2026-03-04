import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import * as bookingService from "../services/bookingService";

const BookingsList = () => {
  const { isAuthenticated } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    status: "",
  });
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadBookings();
    }
  }, [isAuthenticated, filters]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const response = await bookingService.getBookings(filters);
      setBookings(response.bookings || []);
      setPagination(response.pagination);
    } catch (err) {
      setError(err.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: 1, // Reset to first page
    }));
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
          <p className="text-gray-600 mb-4">Vui lòng đăng nhập để xem bookings</p>
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
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách Bookings</h1>
          <Link
            to="/bookings/new"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Đặt xe mới
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-4 mb-6 flex gap-4">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="in_progress">Đang thuê</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã hủy</option>
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500 text-lg">Đang tải...</div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500 text-lg mb-4">Bạn chưa có booking nào</p>
            <Link
              to="/fleet"
              className="text-blue-600 hover:text-blue-700 underline"
            >
              Xem danh sách xe
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {bookings.map((booking) => {
                const vehicle = booking.vehicle || {};
                return (
                  <Link
                    key={booking._id}
                    to={`/bookings/${booking._id}`}
                    className="block bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition"
                  >
                    <div className="flex items-start gap-6">
                      <img
                        src={vehicle.image_urls?.[0] || "/cars/default.jpg"}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                        className="w-32 h-32 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-bold text-xl">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          {getStatusBadge(booking.status)}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={16} />
                            <span>
                              {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>{booking.pickup_location || "N/A"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CreditCard size={16} />
                            <span className="font-semibold text-gray-900">
                              {formatPrice(booking.total_amount)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Loại: </span>
                            <span>
                              {booking.rental_type === "self_drive" ? "Tự lái" : "Có tài xế"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-8">
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Trang {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => setFilters((prev) => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default BookingsList;
