import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { CreditCard, AlertCircle, CheckCircle, Clock, Shield, Lock, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import * as paymentService from "../services/paymentService";
import * as bookingService from "../services/bookingService";

const Payment = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const bookingId = searchParams.get("booking");
  const paymentType = searchParams.get("type") || "rental_fee"; // rental_fee (full payment), extension_fee, penalty

  const [booking, setBooking] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/payments" + (bookingId ? `?booking=${bookingId}` : ""));
      return;
    }

    if (bookingId) {
      loadBookingData();
    } else {
      setError("Booking ID is required");
      setLoading(false);
    }
  }, [bookingId, isAuthenticated, navigate]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      const [bookingResponse, summaryResponse] = await Promise.all([
        bookingService.getBookingById(bookingId),
        paymentService.getPaymentSummary(bookingId),
      ]);
      setBooking(bookingResponse.booking);
      setPaymentSummary(summaryResponse.summary);
    } catch (err) {
      setError(err.message || "Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async (paymentMethod) => {
    if (!paymentSummary) return;

    try {
      setProcessing(true);
      setError(null);

      // Calculate amount based on payment type (B2C - Full Payment)
      let amount = 0;
      if (paymentType === "rental_fee") {
        // B2C: Full payment = 100% total_amount
        amount = paymentSummary.total_amount - paymentSummary.breakdown.rental_fee.paid;
      } else if (paymentType === "extension_fee") {
        amount = paymentSummary.extension_fee - paymentSummary.breakdown.extension_fee.paid;
      } else if (paymentType === "penalty") {
        amount = paymentSummary.penalty - paymentSummary.breakdown.penalty.paid;
      }

      if (amount <= 0) {
        setError("Số tiền thanh toán không hợp lệ");
        setProcessing(false);
        return;
      }

      // Create payment
      const response = await paymentService.createPayment({
        booking: bookingId,
        payment_type: paymentType,
        amount,
        payment_method: paymentMethod,
      });

      // If online payment, redirect to gateway
      if (response.payment_url) {
        // Check if payment URL is valid (not containing placeholder values)
        if (response.payment_url.includes("YOUR_TMN_CODE")) {
          setError("VNPay chưa được cấu hình. Vui lòng thêm VNPAY_TMN_CODE và VNPAY_SECRET_KEY vào backend/.env");
          setProcessing(false);
          return;
        }
        window.location.href = response.payment_url;
      } else {
        // Cash payment - show success message
        alert("Payment created. Staff will process cash payment.");
        navigate(`/bookings/${bookingId}`);
      }
    } catch (err) {
      console.error("❌ [Payment] Error:", err);
      setError(err.message || "Failed to create payment");
      setProcessing(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Đang tải...</div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <Link to="/bookings" className="text-blue-600 hover:text-blue-700 underline">
            Quay lại danh sách bookings
          </Link>
        </div>
      </div>
    );
  }

  if (!paymentSummary) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Không tìm thấy thông tin thanh toán</div>
      </div>
    );
  }

  const vehicle = booking?.vehicle || {};
  let amountToPay = 0;
  if (paymentType === "rental_fee") {
    amountToPay = paymentSummary.total_amount - paymentSummary.breakdown.rental_fee.paid;
  } else if (paymentType === "extension_fee") {
    amountToPay = paymentSummary.extension_fee - paymentSummary.breakdown.extension_fee.paid;
  } else if (paymentType === "penalty") {
    amountToPay = paymentSummary.penalty - paymentSummary.breakdown.penalty.paid;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          to={`/bookings/${bookingId}`}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition"
        >
          ← Quay lại booking
        </Link>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                1
              </div>
              <span className="text-sm font-medium text-gray-700">Xem lại booking</span>
            </div>
            <ArrowRight className="text-gray-400" size={20} />
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                2
              </div>
              <span className="text-sm font-medium text-gray-700">Thanh toán</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <CreditCard size={32} />
              Thanh Toán
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
              <Shield size={16} />
              <span>Bảo mật SSL</span>
            </div>
          </div>

          {/* Booking Info */}
          {booking && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <h2 className="font-bold text-lg mb-4">Thông tin Booking</h2>
              <div className="flex items-center gap-4">
                <img
                  src={vehicle.image_urls?.[0] || "/cars/default.jpg"}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-bold">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-gray-600 text-sm">Mã booking: {booking._id.slice(-8).toUpperCase()}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 mb-6 border border-blue-100">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <CreditCard size={20} />
              Tóm tắt thanh toán
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-700">Tổng tiền booking:</span>
                <span className="font-semibold text-gray-900">{formatPrice(paymentSummary.total_amount)}</span>
              </div>
              {paymentType === "rental_fee" && (
                <>
                  <div className="flex justify-between items-center py-2 border-t border-blue-200">
                    <span className="text-gray-700">Tiền thuê (100% - B2C):</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(paymentSummary.total_amount)}
                    </span>
                  </div>
                  {paymentSummary.breakdown.rental_fee.paid > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Đã thanh toán:</span>
                      <span className="text-green-600 font-semibold">
                        - {formatPrice(paymentSummary.breakdown.rental_fee.paid)}
                      </span>
                    </div>
                  )}
                </>
              )}
              {paymentType === "extension_fee" && (
                <>
                  <div className="flex justify-between items-center py-2 border-t border-blue-200">
                    <span className="text-gray-700">Phí gia hạn:</span>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(paymentSummary.extension_fee)}
                    </span>
                  </div>
                  {paymentSummary.breakdown.extension_fee.paid > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Đã thanh toán:</span>
                      <span className="text-green-600 font-semibold">
                        - {formatPrice(paymentSummary.breakdown.extension_fee.paid)}
                      </span>
                    </div>
                  )}
                </>
              )}
              {paymentType === "penalty" && (
                <>
                  <div className="flex justify-between items-center py-2 border-t border-blue-200">
                    <span className="text-red-700 font-medium">Phí phạt:</span>
                    <span className="font-semibold text-red-600">{formatPrice(paymentSummary.penalty)}</span>
                  </div>
                  {paymentSummary.breakdown.penalty.paid > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Đã thanh toán:</span>
                      <span className="text-green-600 font-semibold">
                        - {formatPrice(paymentSummary.breakdown.penalty.paid)}
                      </span>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between items-center text-xl font-bold pt-4 mt-4 border-t-2 border-blue-300 bg-white rounded-lg px-4 py-3">
                <span className="text-gray-900">Số tiền cần thanh toán:</span>
                <span className="text-blue-600 text-2xl">{formatPrice(amountToPay)}</span>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {/* Payment Methods */}
          <div className="mb-6">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Lock size={20} />
              Chọn phương thức thanh toán
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handlePayment("vnpay")}
                disabled={processing || amountToPay <= 0}
                className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                <div className="text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition">
                      <CreditCard size={32} className="text-blue-600" />
                    </div>
                  </div>
                  <p className="font-semibold text-lg mb-1">VNPay</p>
                  <p className="text-sm text-gray-500 mb-2">Thẻ ATM/Credit Card</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <Shield size={12} />
                    <span>Bảo mật cao</span>
                  </div>
                </div>
                {!processing && amountToPay > 0 && (
                  <div className="absolute top-2 right-2">
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-blue-600 transition" />
                  </div>
                )}
              </button>

              <button
                onClick={() => handlePayment("cash")}
                disabled={processing || amountToPay <= 0}
                className="group relative p-6 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                <div className="text-center">
                  <div className="mb-3 flex justify-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition">
                      <CreditCard size={32} className="text-green-600" />
                    </div>
                  </div>
                  <p className="font-semibold text-lg mb-1">Tiền mặt</p>
                  <p className="text-sm text-gray-500 mb-2">Thanh toán tại cửa hàng</p>
                  <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>Cần xác nhận</span>
                  </div>
                </div>
                {!processing && amountToPay > 0 && (
                  <div className="absolute top-2 right-2">
                    <ArrowRight size={16} className="text-gray-400 group-hover:text-green-600 transition" />
                  </div>
                )}
              </button>
            </div>
          </div>

          {processing && (
            <div className="bg-blue-50 border-2 border-blue-200 text-blue-700 px-6 py-4 rounded-xl flex items-center gap-3 mb-6">
              <Clock size={24} className="animate-spin" />
              <div>
                <p className="font-semibold">Đang xử lý thanh toán...</p>
                <p className="text-sm text-blue-600">Vui lòng đợi trong giây lát</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-5 border border-gray-200">
            <div className="flex items-start gap-3 mb-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertCircle size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 mb-2">Thông tin quan trọng</p>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Thanh toán online (VNPay) sẽ được xử lý ngay lập tức và booking sẽ được xác nhận tự động</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Thanh toán tiền mặt cần được xác nhận bởi nhân viên tại cửa hàng</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Mô hình B2C: Thanh toán 100% tổng tiền booking để xác nhận đặt xe</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
