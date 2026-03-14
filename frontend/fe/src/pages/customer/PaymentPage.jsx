import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  Wallet,
  Building2,
  CheckCircle,
  ChevronLeft,
  AlertCircle,
} from "lucide-react";
import { getBookingById } from "../../services/bookingApi";
import {
  processDepositPayment,
  processFinalPayment,
} from "../../services/paymentService";
import { getToken } from "../../services/api";
import QRPaymentModal from "../../components/payment/QRPaymentModal";

const PaymentPage = ({ type = "deposit" }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("bank_transfer");

  const paymentMethods = [
    {
      id: "bank_transfer",
      label: "Chuyển khoản QR",
      icon: Building2,
      description: "Quét mã QR để thanh toán nhanh",
    },
    {
      id: "cash",
      label: "Tiền mặt",
      icon: Wallet,
      description: "Thanh toán trực tiếp tại cửa hàng",
    },
    {
      id: "card",
      label: "Thẻ tín dụng",
      icon: CreditCard,
      description: "Visa, MasterCard, JCB",
    },
    {
      id: "momo",
      label: "Ví MoMo",
      icon: Wallet,
      description: "Thanh toán qua ứng dụng MoMo",
    },
    {
      id: "zalopay",
      label: "ZaloPay",
      icon: Wallet,
      description: "Thanh toán qua ứng dụng ZaloPay",
    },
    {
      id: "vnpay",
      label: "VNPay",
      icon: Building2,
      description: "Cổng thanh toán VNPay",
    },
  ];

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBookingDetail();
  }, [id]);

  const fetchBookingDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getBookingById(id);
      setBooking(response.data);

      // Validate booking status
      if (type === "deposit" && response.data.status !== "pending") {
        setError("Đơn này không cần thanh toán cọc");
      }
      if (type === "final" && response.data.status !== "vehicle_returned") {
        setError("Chưa thể thanh toán đơn này");
      }
    } catch (err) {
      setError(err.message || "Không thể tải thông tin đơn đặt xe");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    setError("");

    // TẤT CẢ phương thức đều mở QR modal (đơn giản hóa cho demo)
    // Trong production, có thể tích hợp thật với VNPay, MoMo, etc.
    setShowQRModal(true);
  };

  const handlePaymentSuccess = (data) => {
    navigate(`/payment/success?booking_id=${id}&type=${type}`);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getPaymentAmount = () => {
    if (!booking) return 0;
    if (type === "deposit") {
      return booking.deposit_amount;
    }
    // Final payment: use final_amount from backend (includes charging_fee, penalty, extensions)
    return booking.final_amount || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="max-w-2xl mx-auto px-6">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
            {error}
          </div>
          <button
            onClick={() => navigate("/my-bookings")}
            className="inline-flex items-center gap-2 mt-6 text-blue-600 font-semibold hover:gap-3 transition-all"
          >
            <ChevronLeft size={20} />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      {/* QR Payment Modal */}
      <QRPaymentModal
        isOpen={showQRModal}
        onClose={() => setShowQRModal(false)}
        bookingId={id}
        amount={getPaymentAmount()}
        type={type}
        paymentMethod={selectedMethod}
        onSuccess={handlePaymentSuccess}
      />

      <div className="max-w-2xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(`/bookings/${id}`)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Quay lại chi tiết đơn
        </button>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {type === "deposit" ? "Thanh toán tiền cọc" : "Thanh toán còn lại"}
          </h1>
          <p className="text-gray-500">
            Mã đơn: <span className="font-mono font-bold">{booking._id}</span>
          </p>
        </div>

        {/* Booking Summary */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Thông tin đơn
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Xe</span>
              <span className="font-bold text-gray-900">
                {booking.vehicle?.brand} {booking.vehicle?.model}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tổng tiền</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(booking.total_amount)}
              </span>
            </div>
            {type === "final" && (
              <div className="flex justify-between">
                <span className="text-gray-500">Đã cọc</span>
                <span className="font-bold text-green-600">
                  -{formatCurrency(booking.deposit_amount)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-lg font-bold text-gray-900">
                {type === "deposit" ? "Tiền cọc (30%)" : "Còn lại"}
              </span>
              <span className="text-2xl font-black text-blue-600">
                {formatCurrency(getPaymentAmount())}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Chọn phương thức thanh toán
          </h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                    selectedMethod === method.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      selectedMethod === method.id
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon size={24} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-gray-900">{method.label}</h3>
                    <p className="text-sm text-gray-500">
                      {method.description}
                    </p>
                  </div>
                  {selectedMethod === method.id && (
                    <CheckCircle
                      className="text-blue-600 flex-shrink-0"
                      size={24}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl mb-6 flex items-center gap-3">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={handlePayment}
          disabled={!selectedMethod}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-bold text-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedMethod === "bank_transfer"
            ? "HIỂN THỊ MÃ QR THANH TOÁN"
            : `Thanh toán ${formatCurrency(getPaymentAmount())}`}
        </button>

        {/* Note */}
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <p className="text-sm text-yellow-800">
            <strong>Lưu ý:</strong> Sau khi thanh toán thành công, bạn sẽ nhận
            được email xác nhận và có thể xem chi tiết giao dịch trong lịch sử
            thanh toán.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
