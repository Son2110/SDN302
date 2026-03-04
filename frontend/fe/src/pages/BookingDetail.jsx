import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, CreditCard, AlertCircle, CheckCircle, XCircle, Clock, History, ArrowRight } from "lucide-react";
import * as bookingService from "../services/bookingService";
import * as paymentService from "../services/paymentService";

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [paymentHistory, setPaymentHistory] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      setLoading(true);
      // Ensure id is a valid string (not object)
      const bookingId = typeof id === 'string' ? id : (id?._id || id?.toString() || id);
      if (!bookingId) {
        setError("Invalid booking ID");
        setLoading(false);
        return;
      }
      
      // Load booking, payment history, and payment summary in parallel
      const [bookingResponse, paymentHistoryResponse, paymentSummaryResponse] = await Promise.all([
        bookingService.getBookingById(bookingId),
        paymentService.getBookingPayments(bookingId).catch(() => ({ success: true, payments: [], summary: { totalPaid: 0, totalRefunded: 0, netAmount: 0 } })),
        paymentService.getPaymentSummary(bookingId).catch(() => null),
      ]);
      
      setBooking(bookingResponse.booking);
      setPaymentHistory(paymentHistoryResponse);
      setPaymentSummary(paymentSummaryResponse?.summary || null);
    } catch (err) {
      setError(err.message || "Không tìm thấy booking");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn hủy booking này?")) {
      return;
    }

    try {
      await bookingService.cancelBooking(id);
      loadBooking(); // Reload to get updated status
    } catch (err) {
      alert(err.message || "Hủy booking thất bại");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: "Chờ xác nhận", color: "bg-yellow-100 text-yellow-700", icon: Clock },
      confirmed: { label: "Đã xác nhận", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
      vehicle_delivered: { label: "Đã bàn giao", color: "bg-green-100 text-green-700", icon: CheckCircle },
      in_progress: { label: "Đang thuê", color: "bg-green-100 text-green-700", icon: CheckCircle },
      vehicle_returned: { label: "Đã trả xe", color: "bg-gray-100 text-gray-700", icon: CheckCircle },
      completed: { label: "Hoàn thành", color: "bg-green-100 text-green-700", icon: CheckCircle },
      cancelled: { label: "Đã hủy", color: "bg-red-100 text-red-700", icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, color: "bg-gray-100 text-gray-700", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${config.color}`}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Đang tải...</div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error || "Không tìm thấy booking"}</div>
          <Link to="/bookings" className="text-blue-600 hover:text-blue-700 underline">
            Quay lại danh sách bookings
          </Link>
        </div>
      </div>
    );
  }

  const vehicle = booking.vehicle || {};
  const canCancel = ["pending", "confirmed"].includes(booking.status);

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link to="/bookings" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
          ← Quay lại danh sách
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Chi tiết Booking</h1>
              <p className="text-gray-500 mt-1">Mã booking: {booking._id.slice(-8).toUpperCase()}</p>
            </div>
            {getStatusBadge(booking.status)}
          </div>

          {/* Vehicle Info */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h2 className="font-bold text-lg mb-4">Thông tin xe</h2>
            <div className="flex items-center gap-4">
              <img
                src={vehicle.image_urls?.[0] || "/cars/default.jpg"}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-32 h-32 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-bold text-xl">
                  {vehicle.brand} {vehicle.model}
                </h3>
                <p className="text-gray-600">{vehicle.year}</p>
                <p className="text-gray-600">Biển số: {vehicle.license_plate}</p>
                <p className="text-blue-600 font-semibold mt-2">
                  {formatPrice(vehicle.daily_rate)}/ngày
                </p>
              </div>
            </div>
          </div>

          {/* Booking Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Calendar size={20} />
                Thời gian
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Ngày nhận:</span>
                  <p className="font-semibold">{formatDate(booking.start_date)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Ngày trả:</span>
                  <p className="font-semibold">{formatDate(booking.end_date)}</p>
                </div>
                {booking.actual_return_date && (
                  <div>
                    <span className="text-gray-600">Ngày trả thực tế:</span>
                    <p className="font-semibold">{formatDate(booking.actual_return_date)}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <MapPin size={20} />
                Địa điểm
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-600">Nhận xe:</span>
                  <p className="font-semibold">{booking.pickup_location || "N/A"}</p>
                </div>
                <div>
                  <span className="text-gray-600">Trả xe:</span>
                  <p className="font-semibold">{booking.return_location || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Rental Type */}
          <div className="bg-gray-50 rounded-xl p-6 mb-6">
            <h3 className="font-bold mb-2">Loại thuê</h3>
            <p className="text-lg">
              {booking.rental_type === "self_drive" ? "Tự lái" : "Có tài xế"}
            </p>
            {booking.driver && (
              <p className="text-sm text-gray-600 mt-2">
                Tài xế: {booking.driver.full_name || "N/A"}
              </p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Tóm tắt thanh toán
            </h3>
            {paymentSummary ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2">
                  <span className="text-gray-700">Tổng tiền booking:</span>
                  <span className="font-semibold text-gray-900">{formatPrice(paymentSummary.total_amount)}</span>
                </div>
                {paymentSummary.breakdown && (
                  <>
                    <div className="flex justify-between items-center py-2 border-t border-blue-200">
                      <span className="text-gray-600">Tiền thuê đã thanh toán:</span>
                      <span className="text-green-600 font-semibold">
                        {formatPrice(paymentSummary.breakdown.rental_fee.paid)}
                      </span>
                    </div>
                    {paymentSummary.extension_fee > 0 && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600">Phí gia hạn:</span>
                        <span className="font-semibold text-gray-900">
                          {formatPrice(paymentSummary.extension_fee)}
                        </span>
                      </div>
                    )}
                    {paymentSummary.penalty > 0 && (
                      <div className="flex justify-between items-center py-2 text-red-600">
                        <span>Phí phạt:</span>
                        <span className="font-semibold">{formatPrice(paymentSummary.penalty)}</span>
                      </div>
                    )}
                  </>
                )}
                {paymentHistory?.summary && (
                  <div className="flex justify-between items-center py-2 border-t border-blue-200">
                    <span className="text-gray-600">Tổng đã thanh toán:</span>
                    <span className="text-green-600 font-semibold">
                      {formatPrice(paymentHistory.summary.totalPaid)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold pt-4 mt-4 border-t-2 border-blue-300 bg-white rounded-lg px-4 py-3">
                  <span className="text-gray-900">Còn lại:</span>
                  <span className={`text-xl ${
                    (paymentSummary.total_amount - (paymentHistory?.summary?.totalPaid || 0)) > 0
                      ? "text-red-600"
                      : "text-green-600"
                  }`}>
                    {formatPrice(Math.max(0, paymentSummary.total_amount - (paymentHistory?.summary?.totalPaid || 0)))}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="font-semibold">{formatPrice(booking.total_amount)}</span>
                </div>
                {booking.final_amount && (
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
                    <span>Số tiền cuối cùng:</span>
                    <span className="text-blue-600">{formatPrice(booking.final_amount)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment History */}
          {paymentHistory && paymentHistory.payments && paymentHistory.payments.length > 0 && (
            <div className="bg-white rounded-xl p-6 mb-6 border border-gray-200">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <History size={20} />
                Lịch sử thanh toán
              </h3>
              <div className="space-y-3">
                {paymentHistory.payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {payment.status === "completed" ? (
                          <CheckCircle size={20} className="text-green-600" />
                        ) : payment.status === "failed" ? (
                          <XCircle size={20} className="text-red-600" />
                        ) : (
                          <Clock size={20} className="text-yellow-600" />
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">
                            {payment.payment_type === "deposit"
                              ? "Tiền cọc"
                              : payment.payment_type === "rental_fee"
                              ? "Tiền thuê"
                              : payment.payment_type === "extension_fee"
                              ? "Phí gia hạn"
                              : payment.payment_type === "penalty"
                              ? "Phí phạt"
                              : payment.payment_type}
                          </p>
                          <p className="text-xs text-gray-500">
                            {payment.payment_date
                              ? new Date(payment.payment_date).toLocaleString("vi-VN")
                              : "Chưa có thời gian"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">{formatPrice(payment.amount)}</p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            payment.status === "completed"
                              ? "bg-green-100 text-green-700"
                              : payment.status === "failed"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {payment.status === "completed"
                            ? "Hoàn thành"
                            : payment.status === "failed"
                            ? "Thất bại"
                            : "Đang xử lý"}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <span>Phương thức: {payment.payment_method.toUpperCase()}</span>
                      {payment.transaction_id && (
                        <span className="font-mono">Mã GD: {payment.transaction_id.slice(-8)}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4">
            {canCancel && (
              <button
                onClick={handleCancel}
                className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition flex items-center justify-center gap-2"
              >
                <XCircle size={20} />
                Hủy booking
              </button>
            )}
            {booking.status !== "cancelled" && booking.status !== "completed" && (
              <Link
                to={`/payments?booking=${id}&type=rental_fee`}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
              >
                <CreditCard size={20} />
                {booking.status === "pending"
                  ? "Thanh toán ngay"
                  : paymentSummary && (paymentSummary.total_amount - (paymentHistory?.summary?.totalPaid || 0)) > 0
                  ? "Thanh toán số tiền còn lại"
                  : "Xem thanh toán"}
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingDetail;
