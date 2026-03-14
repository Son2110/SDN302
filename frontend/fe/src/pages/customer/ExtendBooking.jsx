import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  DollarSign,
} from "lucide-react";
import { getBookingById } from "../../services/bookingApi";
import { requestExtension } from "../../services/extensionApi";
import { getVehicleBookedDates } from "../../services/vehicleApi";
import { getToken } from "../../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

const ExtendBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newEndDate, setNewEndDate] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBookingData();
  }, [id]);

  const fetchBookingData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getBookingById(id);
      setBooking(response.data);

      // Fetch booked dates for this vehicle
      try {
        const datesResponse = await getVehicleBookedDates(
          response.data.vehicle._id,
        );
        setBookedDates(datesResponse.data || []);
      } catch (err) {
        console.error("Failed to load booked dates:", err);
      }
    } catch (err) {
      setError(err.message || "Không thể tải thông tin đơn đặt xe");
    } finally {
      setLoading(false);
    }
  };

  const isDateBooked = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return bookedDates.some((range) => {
      const start = new Date(range.start);
      const end = new Date(range.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      // Exclude current booking's dates
      if (booking && range.booking_id === booking._id) {
        return false;
      }

      return checkDate >= start && checkDate <= end;
    });
  };

  const calculateExtensionDays = () => {
    if (!booking || !newEndDate) return 0;
    const currentEnd = new Date(booking.end_date);
    const newEnd = new Date(newEndDate);
    currentEnd.setHours(0, 0, 0, 0);
    newEnd.setHours(0, 0, 0, 0);
    const diffTime = newEnd - currentEnd;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateExtensionCost = () => {
    const days = calculateExtensionDays();
    if (days <= 0 || !booking) return 0;
    const dailyRate = booking.vehicle?.daily_rate || 0;
    let cost = days * dailyRate;

    // Add driver fee if with_driver
    if (booking.rental_type === "with_driver") {
      const DRIVER_FEE_PER_DAY = 500000;
      cost += days * DRIVER_FEE_PER_DAY;
    }

    return cost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newEndDate) {
      setError("Vui lòng chọn ngày kết thúc mới");
      return;
    }

    const currentEnd = new Date(booking.end_date);
    const newEnd = new Date(newEndDate);
    currentEnd.setHours(0, 0, 0, 0);
    newEnd.setHours(0, 0, 0, 0);

    if (newEnd <= currentEnd) {
      setError("Ngày kết thúc mới phải sau ngày kết thúc hiện tại");
      return;
    }

    const extensionDays = calculateExtensionDays();
    if (extensionDays > 30) {
      setError("Không thể gia hạn quá 30 ngày một lần");
      return;
    }

    try {
      setSubmitting(true);
      const formattedDate = newEndDate.toISOString().split("T")[0];

      const response = await requestExtension(booking._id, formattedDate);

      toast.success("Yêu cầu gia hạn đã được gửi thành công!");
      navigate("/my-extensions");
    } catch (err) {
      setError(err.message || "Không thể gửi yêu cầu gia hạn");
      toast.error(err.message || "Gửi yêu cầu thất bại");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => navigate("/my-bookings")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Quay lại danh sách đơn hàng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Quay lại
        </button>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Yêu cầu gia hạn thuê xe
          </h1>

          {/* Current Booking Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Thông tin đơn hiện tại
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Xe</p>
                <p className="font-bold text-gray-900">
                  {booking?.vehicle?.brand} {booking?.vehicle?.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Biển số</p>
                <p className="font-bold text-gray-900">
                  {booking?.vehicle?.license_plate}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày bắt đầu</p>
                <p className="font-bold text-gray-900">
                  {formatDate(booking?.start_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Ngày kết thúc hiện tại</p>
                <p className="font-bold text-blue-600">
                  {formatDate(booking?.end_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Extension Form */}
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Chọn ngày kết thúc mới
              </label>
              <DatePicker
                selected={newEndDate}
                onChange={(date) => setNewEndDate(date)}
                minDate={
                  new Date(new Date(booking.end_date).getTime() + 86400000)
                } // Next day after current end
                maxDate={
                  new Date(new Date(booking.end_date).getTime() + 30 * 86400000)
                } // Max 30 days
                filterDate={(date) => !isDateBooked(date)}
                dateFormat="dd/MM/yyyy"
                placeholderText="Chọn ngày..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                calendarClassName="shadow-xl"
              />
              <p className="text-xs text-gray-500 mt-2">
                * Có thể gia hạn tối đa 30 ngày. Những ngày bị chặn là ngày xe
                đã được đặt bởi khách khác.
              </p>
            </div>

            {/* Extension Summary */}
            {newEndDate && calculateExtensionDays() > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-purple-600" />
                  Tóm tắt gia hạn
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Số ngày gia hạn</span>
                    <span className="font-bold text-gray-900">
                      {calculateExtensionDays()} ngày
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ngày kết thúc cũ</span>
                    <span className="text-gray-900">
                      {formatDate(booking.end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Ngày kết thúc mới</span>
                    <span className="font-bold text-purple-600">
                      {formatDate(newEndDate)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-purple-200 flex justify-between items-center">
                    <span className="text-gray-900 font-bold flex items-center gap-2">
                      <DollarSign size={18} />
                      Chi phí gia hạn (ước tính)
                    </span>
                    <span className="text-2xl font-bold text-purple-600">
                      {formatCurrency(calculateExtensionCost())}
                    </span>
                  </div>
                  {booking.rental_type === "with_driver" && (
                    <p className="text-xs text-gray-600 italic">
                      * Bao gồm phí tài xế (500k/ngày)
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={submitting}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={
                  submitting || !newEndDate || calculateExtensionDays() <= 0
                }
                className="flex-1 bg-purple-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Đang gửi..." : "Gửi yêu cầu gia hạn"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExtendBooking;
