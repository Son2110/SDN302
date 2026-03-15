import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle,
  Shield,
  AlertCircle,
  Wallet,
  Building2,
  Smartphone,
} from "lucide-react";
import { getToken } from "../../services/api";
import { getBookingById } from "../../services/bookingApi";
import { processDepositPayment } from "../../services/paymentService";
import QRPaymentModal from "../../components/payment/QRPaymentModal";

const DepositPayment = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("bank_transfer");

  // Payment methods - QR Code first
  const paymentMethods = [
    {
      id: "bank_transfer",
      name: "Chuyển khoản QR",
      icon: Building2,
      description: "Quét mã QR để thanh toán nhanh",
      color: "blue",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: Building2,
      description: "Thanh toán qua cổng VNPay",
      color: "blue",
    },
    {
      id: "momo",
      name: "MoMo",
      icon: Wallet,
      description: "Ví điện tử MoMo",
      color: "pink",
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      icon: Smartphone,
      description: "Ví điện tử ZaloPay",
      color: "sky",
    },
  ];

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login?redirect=/booking/deposit/" + bookingId);
      return;
    }

    if (bookingId) {
      loadBookingData();
    } else {
      setError("Booking ID is required");
      setLoading(false);
    }
  }, [bookingId, navigate]);

  const loadBookingData = async () => {
    try {
      setLoading(true);
      const response = await getBookingById(bookingId);
      setBooking(response.data);

      // Check if booking is in pending status
      if (response.data.status !== "pending") {
        setError(
          "Đơn hàng này đã được xử lý thanh toán cọc hoặc không hợp lệ.",
        );
      }
    } catch (err) {
      setError(err.message || "Failed to load booking data");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      setError("Vui lòng chọn phương thức thanh toán");
      return;
    }

    if (!booking) {
      setError("Không tìm thấy thông tin đơn hàng");
      return;
    }

    setError(null);

    // TẤT CẢ phương thức đều mở QR modal (đơn giản hóa cho demo)
    // Trong production, có thể tích hợp thật với VNPay, MoMo, etc.
    setShowQRModal(true);
  };

  const handlePaymentSuccess = (data) => {
    // Navigate to success page after QR payment confirmation
    navigate(`/payment/success?booking=${bookingId}&type=deposit`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN").format(price);
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

  // Use deposit_amount from backend instead of calculating 30% in frontend
  const depositAmount = booking?.deposit_amount || 0;
  const remainingAmount = booking
    ? booking.total_amount - booking.deposit_amount
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      {/* QR Payment Modal */}
      <QRPaymentModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        bookingId={bookingId}
        amount={depositAmount}
        type="deposit"
        paymentMethod={selectedMethod}
        onSuccess={handlePaymentSuccess}
      />

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">
                Chọn xe
              </span>
            </div>
            <div className="w-12 h-1 bg-green-500"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">
                Thông tin
              </span>
            </div>
            <div className="w-12 h-1 bg-blue-500"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">
                Thanh toán
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Method Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Thanh toán cọc
                  </h2>
                  <p className="text-sm text-gray-600">
                    Chọn phương thức thanh toán online
                  </p>
                </div>
              </div>

              {/* Important Notice */}
              <div className="mb-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-xl">
                <div className="flex gap-3">
                  <Shield className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-bold mb-1">Lưu ý quan trọng:</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        Bạn cần thanh toán cọc <strong>30%</strong> để xác nhận
                        đơn hàng
                      </li>
                      <li>
                        Số tiền còn lại sẽ thanh toán khi nhận xe hoặc khi kết
                        thúc chuyến đi
                      </li>
                      <li>
                        Tiền cọc chỉ được thanh toán qua phương thức online
                      </li>
                      <li>
                        Đơn hàng sẽ được xác nhận sau khi thanh toán thành công
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Chọn phương thức thanh toán
                </h3>

                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  const colorClass = {
                    blue: "border-blue-500 bg-blue-50",
                    pink: "border-pink-500 bg-pink-50",
                    sky: "border-sky-500 bg-sky-50",
                  };

                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-4 border-2 rounded-xl transition-all ${
                        isSelected
                          ? colorClass[method.color]
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-lg ${
                            isSelected
                              ? `bg-${method.color}-100`
                              : "bg-gray-100"
                          } flex items-center justify-center`}
                        >
                          <Icon
                            className={`w-6 h-6 ${
                              isSelected
                                ? `text-${method.color}-600`
                                : "text-gray-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-bold text-gray-900">
                            {method.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {method.description}
                          </p>
                        </div>
                        {isSelected && (
                          <CheckCircle
                            className={`w-6 h-6 text-${method.color}-600`}
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                onClick={handlePayment}
                disabled={!selectedMethod || processing}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/30"
              >
                {processing ? (
                  "ĐANG XỬ LÝ..."
                ) : selectedMethod === "bank_transfer" ? (
                  "HIỂN THỊ MÃ QR THANH TOÁN →"
                ) : (
                  <>THANH TOÁN {formatPrice(depositAmount)}đ →</>
                )}
              </button>

              {/* Security Notice */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Giao dịch được bảo mật và mã hóa</span>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Tóm tắt thanh toán
              </h3>

              {/* Booking Info */}
              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Mã đơn hàng:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    #{booking?._id.slice(-8).toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Xe:</span>
                  <span className="font-semibold text-gray-900">
                    {booking?.vehicle?.brand} {booking?.vehicle?.model}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Thời gian:</span>
                  <span className="font-semibold text-gray-900">
                    {booking &&
                      new Date(booking.start_date).toLocaleDateString(
                        "vi-VN",
                      )}{" "}
                    -{" "}
                    {booking &&
                      new Date(booking.end_date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng giá trị đơn:</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(booking?.total_amount || 0)}đ
                  </span>
                </div>

                <div className="flex justify-between text-base border-t border-gray-200 pt-3">
                  <span className="font-bold text-gray-900">
                    Tiền cọc (30%):
                  </span>
                  <span className="font-bold text-2xl text-blue-600">
                    {formatPrice(depositAmount)}đ
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600 pb-4 border-b border-gray-200">
                  <span>Còn lại thanh toán sau:</span>
                  <span className="font-semibold">
                    {formatPrice(remainingAmount)}đ
                  </span>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-4">
                  <div className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-green-800">
                      <p className="font-bold mb-1">
                        Sau khi thanh toán thành công:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Đơn hàng được xác nhận ngay lập tức</li>
                        <li>Nhận email xác nhận chi tiết</li>
                        <li>Xe được giữ chỗ cho bạn</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositPayment;
