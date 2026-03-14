import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Hourglass,
  User,
  Phone,
  MapPin,
  Car,
  DollarSign,
} from "lucide-react";
import { getExtensionById } from "../../services/extensionApi";
import { getToken } from "../../services/api";
import toast from "react-hot-toast";

const ExtensionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [extension, setExtension] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchExtensionDetail();
  }, [id]);

  const fetchExtensionDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getExtensionById(id);
      setExtension(response.data);
    } catch (err) {
      setError(err.message || "Không thể tải thông tin yêu cầu gia hạn");
      toast.error("Không thể tải thông tin yêu cầu gia hạn");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-2 px-6 py-3 bg-yellow-100 text-yellow-800 text-base font-bold rounded-full">
            <Hourglass size={20} />
            Đang chờ xử lý
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-2 px-6 py-3 bg-green-100 text-green-800 text-base font-bold rounded-full">
            <CheckCircle size={20} />
            Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-2 px-6 py-3 bg-red-100 text-red-800 text-base font-bold rounded-full">
            <XCircle size={20} />
            Đã từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const calculateExtensionDays = () => {
    if (!extension) return 0;
    const current = new Date(extension.original_end_date);
    const newDate = new Date(extension.new_end_date);
    current.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    const diffTime = newDate - current;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateEstimatedCost = () => {
    if (!extension || !extension.booking) return 0;
    const days = calculateExtensionDays();
    const dailyRate = extension.booking.vehicle?.daily_rate || 0;
    let cost = days * dailyRate;

    if (extension.booking.rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000;
      cost += days * DRIVER_FEE_PER_DAY;
    }

    return cost;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !extension) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-500 text-lg mb-4">
            {error || "Không tìm thấy yêu cầu gia hạn"}
          </div>
          <button
            onClick={() => navigate("/my-extensions")}
            className="text-blue-600 hover:text-blue-700 underline font-bold"
          >
            Quay lại danh sách yêu cầu
          </button>
        </div>
      </div>
    );
  }

  const booking = extension.booking;
  const vehicle = booking?.vehicle;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/my-extensions")}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Quay lại danh sách
        </button>

        <div className="bg-white rounded-3xl shadow-xl p-8 mb-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8 pb-6 border-b border-gray-200">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Chi tiết yêu cầu gia hạn
              </h1>
              <p className="text-gray-600">
                Mã yêu cầu: #{extension._id?.slice(-8).toUpperCase()}
              </p>
            </div>
            {getStatusBadge(extension.status)}
          </div>

          {/* Vehicle Info */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Car size={22} />
              Thông tin xe
            </h2>
            <div className="flex flex-col md:flex-row gap-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-6">
              <img
                src={vehicle?.images?.[0] || "/placeholder-car.jpg"}
                alt={`${vehicle?.brand} ${vehicle?.model}`}
                className="w-full md:w-48 h-48 object-cover rounded-xl shadow-lg"
                onError={(e) => {
                  e.target.src = "/placeholder-car.jpg";
                }}
              />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {vehicle?.brand} {vehicle?.model}
                </h3>
                <p className="text-gray-600 mb-4">
                  Biển số: {vehicle?.license_plate}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Giá thuê/ngày</p>
                    <p className="font-bold text-blue-600">
                      {formatCurrency(vehicle?.daily_rate)}
                    </p>
                  </div>
                  <div className="bg-white rounded-xl p-3">
                    <p className="text-xs text-gray-500 mb-1">Loại thuê</p>
                    <p className="font-bold text-gray-900">
                      {booking?.rental_type === "with_driver"
                        ? "Có tài xế"
                        : "Tự lái"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Extension Details */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock size={22} />
              Chi tiết gia hạn
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-2xl p-5">
                <p className="text-sm text-gray-600 mb-2">Ngày kết thúc cũ</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatDate(extension.original_end_date)}
                </p>
              </div>
              <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-5">
                <p className="text-sm text-blue-700 mb-2 font-bold">
                  Ngày kết thúc mới
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatDate(extension.new_end_date)}
                </p>
              </div>
              <div className="bg-purple-50 border-2 border-purple-200 rounded-2xl p-5">
                <p className="text-sm text-purple-700 mb-2 font-bold">
                  Số ngày gia hạn
                </p>
                <p className="text-2xl font-bold text-purple-600">
                  {calculateExtensionDays()} ngày
                </p>
              </div>
              <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-5">
                <p className="text-sm text-green-700 mb-2 font-bold">
                  Chi phí ước tính
                </p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateEstimatedCost())}
                </p>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={22} />
              Lịch sử xử lý
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Hourglass size={20} className="text-blue-600" />
                </div>
                <div className="flex-1 bg-blue-50 rounded-2xl p-4">
                  <p className="font-bold text-gray-900 mb-1">
                    Yêu cầu đã được gửi
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDateTime(extension.requested_at)}
                  </p>
                </div>
              </div>

              {extension.status === "approved" && (
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1 bg-green-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-1">
                      Yêu cầu đã được duyệt
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDateTime(extension.processed_at)}
                    </p>
                    {extension.reject_reason && (
                      <>
                        <p className="text-sm font-bold text-green-800 mb-1">
                          Ghi chú từ nhân viên:
                        </p>
                        <p className="text-sm text-green-700">
                          {extension.reject_reason}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}

              {extension.status === "rejected" && (
                <div className="flex gap-4">
                  <div className="shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle size={20} className="text-red-600" />
                  </div>
                  <div className="flex-1 bg-red-50 rounded-2xl p-4">
                    <p className="font-bold text-gray-900 mb-1">
                      Yêu cầu đã bị từ chối
                    </p>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDateTime(extension.processed_at)}
                    </p>
                    {extension.reject_reason && (
                      <>
                        <p className="text-sm font-bold text-red-800 mb-1">
                          Lý do từ chối:
                        </p>
                        <p className="text-sm text-red-700">
                          {extension.reject_reason}
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Reference */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-3">
              Đơn đặt xe liên quan
            </h3>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Mã đơn</p>
                <p className="font-bold text-gray-900">
                  #{booking?._id?.slice(-8).toUpperCase()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Ngày bắt đầu thuê</p>
                <p className="font-bold text-gray-900">
                  {formatDate(booking?.start_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Trạng thái đơn</p>
                <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm font-bold rounded-full">
                  {booking?.status}
                </span>
              </div>
              <Link
                to={`/bookings/${booking?._id}`}
                className="bg-gray-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-900 transition-all text-center"
              >
                Xem đơn đặt xe
              </Link>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate("/my-extensions")}
            className="flex-1 bg-white text-gray-700 py-4 rounded-2xl font-bold shadow-md hover:shadow-lg transition-all"
          >
            Quay lại danh sách
          </button>
          {extension.status === "approved" && (
            <Link
              to={`/bookings/${booking._id}`}
              className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-200 hover:shadow-xl transition-all text-center"
            >
              Xem đơn đặt xe
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExtensionDetail;
