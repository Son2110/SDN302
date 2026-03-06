import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, Download, AlertCircle, Clock, XCircle, ArrowRight, Calendar, MapPin, CreditCard, FileText } from "lucide-react";
import * as paymentService from "../services/paymentService";
import * as bookingService from "../services/bookingService";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("payment");
  const error = searchParams.get("error");
  
  // Check if VNPay params are in URL (direct redirect from VNPay)
  const vnpResponseCode = searchParams.get("vnp_ResponseCode");
  const vnpTxnRef = searchParams.get("vnp_TxnRef");
  const vnpTransactionStatus = searchParams.get("vnp_TransactionStatus");
  const vnpSecureHash = searchParams.get("vnp_SecureHash");
  
  const [payment, setPayment] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If VNPay params exist, verify payment first
    if (vnpTxnRef && vnpResponseCode) {
      verifyVNPayPayment();
    } else if (paymentId) {
      loadPayment();
    } else {
      setLoading(false);
    }
  }, [paymentId, vnpTxnRef, vnpResponseCode]);
  
  const verifyVNPayPayment = async () => {
    try {
      // Collect ALL VNPay params from URL (needed for signature verification)
      const allVnpayParams = {};
      searchParams.forEach((value, key) => {
        // Only include VNPay params (start with vnp_)
        if (key.startsWith('vnp_')) {
          allVnpayParams[key] = value;
        }
      });
      
      // Call backend to verify and update payment with ALL params
      await paymentService.verifyPayment(vnpTxnRef, allVnpayParams);
      
      // Reload payment after verification
      if (vnpTxnRef) {
        await loadPaymentById(vnpTxnRef);
      }
    } catch (err) {
      console.error("❌ [PaymentSuccess] Error verifying payment:", err);
      // Still try to load payment
      if (vnpTxnRef) {
        await loadPaymentById(vnpTxnRef);
      }
    }
  };
  
  const loadPaymentById = async (id) => {
    try {
      const paymentData = await paymentService.getPaymentById(id);
      setPayment(paymentData.payment);
      
      // Load booking info
      if (paymentData.payment.booking) {
        const bookingId = typeof paymentData.payment.booking === 'string' 
          ? paymentData.payment.booking 
          : paymentData.payment.booking._id || paymentData.payment.booking.toString();
        await loadBooking(bookingId);
      }
      
      setLoading(false);

      // Nếu payment vẫn pending, poll một vài lần để đợi webhook/return handler update
      if (paymentData.payment.status === "pending" && !error) {
        pollPaymentStatus(id);
      }
    } catch (err) {
      console.error("❌ [PaymentSuccess] Error loading payment:", err);
      setLoading(false);
    }
  };

  const loadPayment = async () => {
    try {
      const paymentData = await paymentService.getPaymentById(paymentId);
      setPayment(paymentData.payment);
      
      // Load booking info
      // Handle both cases: booking can be ObjectId string or populated object
      if (paymentData.payment.booking) {
        const bookingId = typeof paymentData.payment.booking === 'string' 
          ? paymentData.payment.booking 
          : paymentData.payment.booking._id || paymentData.payment.booking.toString();
        await loadBooking(bookingId);
      }
      
      setLoading(false);

      // Nếu payment vẫn pending, poll một vài lần để đợi webhook/return handler update
      if (paymentData.payment.status === "pending" && !error) {
        pollPaymentStatus();
      }
    } catch (err) {
      console.error("❌ [PaymentSuccess] Error loading payment:", err);
      setLoading(false);
    }
  };

  const loadBooking = async (bookingId) => {
    try {
      // Ensure bookingId is a string, not an object
      const id = typeof bookingId === 'string' ? bookingId : (bookingId?._id || bookingId?.toString() || bookingId);
      if (!id) {
        console.error("❌ [PaymentSuccess] Invalid booking ID:", bookingId);
        return;
      }
      const bookingData = await bookingService.getBookingById(id);
      setBooking(bookingData.booking);
    } catch (err) {
      console.error("❌ [PaymentSuccess] Error loading booking:", err);
    }
  };

  const pollPaymentStatus = async (id = paymentId) => {
    // Poll payment status tối đa 5 lần (10 giây)
    let attempts = 0;
    const maxAttempts = 5;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await paymentService.checkPaymentStatus(id);
        
        if (response.status === "completed" || response.status === "failed") {
          const paymentData = await paymentService.getPaymentById(id);
          setPayment(paymentData.payment);
          
          // Reload booking để lấy status mới nhất
          // Handle both cases: booking can be ObjectId string or populated object
          if (paymentData.payment.booking) {
            const bookingId = typeof paymentData.payment.booking === 'string' 
              ? paymentData.payment.booking 
              : paymentData.payment.booking._id || paymentData.payment.booking.toString();
            await loadBooking(bookingId);
          }
          
          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          // Sau 5 lần vẫn pending → có thể webhook chưa được gọi
          // Giữ nguyên status pending để user biết
          clearInterval(interval);
        }
      } catch (err) {
        console.error("❌ [PaymentSuccess] Error polling payment status:", err);
        clearInterval(interval);
      }
    }, 2000);
  };

  const getBookingStatusBadge = (status) => {
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

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  // Helper: Get booking ID as string (handle both object and string)
  const getBookingId = (booking) => {
    if (!booking) return null;
    if (typeof booking === 'string') return booking;
    return booking._id || booking.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">Đang xác nhận thanh toán...</div>
          <div className="text-sm text-gray-400">Vui lòng đợi trong giây lát</div>
        </div>
      </div>
    );
  }

  const isSuccess = payment?.status === "completed" && !error;
  const isFailed = payment?.status === "failed" || error;
  const isPending = payment?.status === "pending" && !error;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Success State */}
        {isSuccess && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Success Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-8 text-center">
              <div className="mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle size={48} className="text-green-500" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Thanh toán thành công!</h1>
              <p className="text-green-50 text-lg">
                {booking?.status === "confirmed" || booking?.status === "vehicle_delivered" || booking?.status === "in_progress"
                  ? "Booking của bạn đã được xác nhận"
                  : "Đang xử lý booking của bạn..."}
              </p>
            </div>

            <div className="p-8">
              {/* Timeline */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiến trình</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-semibold">
                        <CheckCircle size={20} />
                      </div>
                      <div className="w-0.5 h-8 bg-green-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900">Thanh toán hoàn tất</p>
                      <p className="text-sm text-gray-600">Giao dịch đã được xử lý thành công</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        booking?.status === "confirmed" || booking?.status === "vehicle_delivered" || booking?.status === "in_progress"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        {booking?.status === "confirmed" || booking?.status === "vehicle_delivered" || booking?.status === "in_progress" ? (
                          <CheckCircle size={20} />
                        ) : (
                          <Clock size={20} />
                        )}
                      </div>
                      <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900">Xác nhận booking</p>
                      <p className="text-sm text-gray-600">
                        {booking?.status === "confirmed" || booking?.status === "vehicle_delivered" || booking?.status === "in_progress"
                          ? "Booking đã được xác nhận"
                          : "Đang chờ xác nhận..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                        booking?.status === "vehicle_delivered" || booking?.status === "in_progress"
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}>
                        {booking?.status === "vehicle_delivered" || booking?.status === "in_progress" ? (
                          <CheckCircle size={20} />
                        ) : (
                          <Clock size={20} />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-gray-900">Nhận xe</p>
                      <p className="text-sm text-gray-600">
                        {booking?.status === "vehicle_delivered" || booking?.status === "in_progress"
                          ? "Đã bàn giao xe"
                          : "Chờ đến ngày nhận xe"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Booking Info Card */}
              {booking && (
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Calendar size={20} />
                      Thông tin booking
                    </h3>
                    {getBookingStatusBadge(booking.status)}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Mã booking</p>
                      <p className="font-semibold text-gray-900">{booking._id.slice(-8).toUpperCase()}</p>
                    </div>
                    {booking.vehicle && (
                      <div>
                        <p className="text-gray-600 mb-1">Xe thuê</p>
                        <p className="font-semibold text-gray-900">
                          {booking.vehicle.brand} {booking.vehicle.model}
                        </p>
                      </div>
                    )}
                    {booking.start_date && (
                      <div>
                        <p className="text-gray-600 mb-1">Ngày nhận</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(booking.start_date).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    )}
                    {booking.end_date && (
                      <div>
                        <p className="text-gray-600 mb-1">Ngày trả</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(booking.end_date).toLocaleDateString("vi-VN")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {payment && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <CreditCard size={20} />
                    Chi tiết thanh toán
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Mã giao dịch</p>
                      <p className="font-semibold text-gray-900 font-mono">
                        {payment.transaction_id || payment._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Số tiền</p>
                      <p className="font-semibold text-blue-600 text-lg">{formatPrice(payment.amount)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Phương thức</p>
                      <p className="font-semibold text-gray-900 capitalize">{payment.payment_method}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Loại thanh toán</p>
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
                    </div>
                    {payment.payment_date && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600 mb-1">Thời gian thanh toán</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(payment.payment_date).toLocaleString("vi-VN")}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Next Steps */}
              <div className="bg-blue-50 rounded-xl p-6 mb-6 border border-blue-100">
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <ArrowRight size={20} />
                  Bước tiếp theo
                </h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Bạn sẽ nhận được email xác nhận booking trong vài phút</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Vui lòng đến đúng thời gian và địa điểm đã đặt để nhận xe</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Mang theo CMND/CCCD và bằng lái xe khi đến nhận xe</span>
                  </li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {getBookingId(payment?.booking) && (
                  <Link
                    to={`/bookings/${getBookingId(payment?.booking)}`}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <FileText size={20} />
                    Xem chi tiết booking
                  </Link>
                )}
                <button
                  onClick={() => window.print()}
                  className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                >
                  <Download size={20} />
                  In hóa đơn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pending State */}
        {isPending && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <Clock size={64} className="mx-auto text-yellow-500 animate-pulse" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Đang xử lý thanh toán
            </h1>
            <p className="text-gray-600 mb-6">
              Vui lòng đợi trong giây lát, chúng tôi đang xác nhận giao dịch của bạn...
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
              <p>Nếu thanh toán đã hoàn tất, trang này sẽ tự động cập nhật.</p>
            </div>
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 text-white p-8 text-center">
              <div className="mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <XCircle size={48} className="text-red-500" />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">Thanh toán thất bại</h1>
              <p className="text-red-50 text-lg">
                {payment?.status === "failed"
                  ? "Giao dịch không thành công. Vui lòng thử lại."
                  : "Không thể xác nhận trạng thái thanh toán."}
              </p>
            </div>

            <div className="p-8">
              {payment && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h2 className="font-bold text-lg mb-4">Thông tin giao dịch</h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mã giao dịch:</span>
                      <span className="font-semibold font-mono">
                        {payment.transaction_id || payment._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Số tiền:</span>
                      <span className="font-semibold">{formatPrice(payment.amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức:</span>
                      <span className="font-semibold capitalize">{payment.payment_method}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Lý do có thể:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                  <li>Số dư tài khoản không đủ</li>
                  <li>Thông tin thẻ không chính xác</li>
                  <li>Giao dịch bị từ chối bởi ngân hàng</li>
                  <li>Kết nối mạng không ổn định</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {getBookingId(payment?.booking) && (
                  <>
                    <Link
                      to={`/payments?booking=${getBookingId(payment?.booking)}&type=${payment?.payment_type || 'rental_fee'}`}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <CreditCard size={20} />
                      Thử lại thanh toán
                    </Link>
                    <Link
                      to={`/bookings/${getBookingId(payment?.booking)}`}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      Quay lại booking
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
