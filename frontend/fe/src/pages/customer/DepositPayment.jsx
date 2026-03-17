import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle,
  Check,
  Shield,
  AlertCircle,
  Wallet,
  Building2,
  Smartphone,
  X,
} from "lucide-react";
import { getToken } from "../../services/api";
import { getBookingById } from "../../services/bookingApi";
import { createVnpayPayment } from "../../services/paymentService";
import QRPaymentModal from "../../components/payment/QRPaymentModal";

const DepositPayment = () => {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState("vnpay");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Payment methods - QR Code first
  const paymentMethods = [
    {
      id: "bank_transfer",
      name: "QR bank transfer",
      icon: Building2,
      description: "Scan QR code for quick payment",
      color: "blue",
    },
    {
      id: "vnpay",
      name: "VNPay",
      icon: Building2,
      description: "Payment via VNPay portal",
      color: "blue",
    },
    {
      id: "momo",
      name: "MoMo",
      icon: Wallet,
      description: "MoMo e-wallet",
      color: "pink",
    },
    {
      id: "zalopay",
      name: "ZaloPay",
      icon: Smartphone,
      description: "ZaloPay e-wallet",
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
          "This booking has already been processed for deposit payment or is invalid.",
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
      setError("Please select a payment method");
      return;
    }

    if (!acceptedTerms) {
      setError("Please agree to the terms and conditions before payment");
      return;
    }

    if (!booking) {
      setError("Booking information not found");
      return;
    }

    setError(null);

    if (selectedMethod === "vnpay") {
      try {
        setProcessing(true);
        const base = window.location.origin;
        const response = await createVnpayPayment(
          bookingId,
          "deposit",
          `${base}/payment/success`,
        );

        if (response?.paymentUrl) {
          window.location.href = response.paymentUrl;
          return;
        }

        setError("Failed to create VNPay payment URL");
        return;
      } catch (err) {
        setError(err.message || "Failed to create VNPay payment URL");
        return;
      } finally {
        setProcessing(false);
      }
    }

    // Non-VNPay methods currently use QR modal flow.
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
        <div className="text-gray-500 text-lg">Loading...</div>
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
            Back to booking list
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
    <div className="min-h-screen bg-[#F8FAFB] pt-32 pb-20">
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

      {showTermsModal && (
        <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-bold text-gray-900">Terms & services</h3>
              <button
                onClick={() => setShowTermsModal(false)}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Close terms"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 text-sm text-gray-700 max-h-[60vh] overflow-y-auto">
              <ul className="list-disc list-inside space-y-2">
                <li>
                  You must pay a <strong>30% deposit</strong> to confirm booking.
                </li>
                <li>
                  If you need to extend rental time, you must submit an extension request and wait for approval.
                </li>
                <li>
                  Approved extension requests are charged with an <strong>additional 10% per day</strong> on top of the normal daily rate.
                </li>
                <li>
                  In case of late return or vehicle scratches/damages, final fees will be discussed and confirmed during return handover.
                </li>
                <li>
                  The booking is confirmed only after successful payment.
                </li>
              </ul>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-4 py-2 rounded-lg bg-[#1556F5] text-white font-semibold hover:bg-[#0F3FCC]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-6 max-w-6xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#1556F5] text-white flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">
                Choose vehicle
              </span>
            </div>
            <div className="w-12 h-1 bg-[#1556F5]"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#1556F5] text-white flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">
                Information
              </span>
            </div>
            <div className="w-12 h-1 bg-[#1556F5]"></div>
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-[#1556F5] text-white flex items-center justify-center font-bold">
                3
              </div>
              <span className="ml-2 text-sm font-semibold text-gray-700">
                Payment
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Payment Method Selection */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#EEF4FF] flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-[#1556F5]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Deposit payment
                  </h2>
                  <p className="text-sm text-gray-600">
                    Choose an online payment method
                  </p>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Select payment method
                </h3>

                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  const isSelected = selectedMethod === method.id;
                  const colorClass = {
                    blue: "border-[#1556F5] bg-[#EEF4FF]",
                    pink: "border-[#1556F5] bg-[#EEF4FF]",
                    sky: "border-[#1556F5] bg-[#EEF4FF]",
                  };

                  const iconColorClass = isSelected
                    ? "bg-[#DCE8FF] text-[#1556F5]"
                    : "bg-gray-100 text-gray-600";

                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`w-full p-4 border-2 rounded-xl transition-all ${isSelected
                        ? colorClass[method.color]
                        : "border-gray-200 hover:border-gray-300"
                        }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClass}`}>
                          <Icon className="w-6 h-6" />
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
                          <CheckCircle className="w-6 h-6 text-[#1556F5]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mb-8">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <Shield className="w-4 h-4 text-[#1556F5] mt-0.5" />
                  <p>
                    Please read our{" "}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-[#1556F5] font-semibold underline hover:text-[#0F3FCC]"
                    >
                      Terms & services
                    </button>
                    {" "}before payment.
                  </p>
                </div>

                <label className="mt-3 flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => {
                      setAcceptedTerms(e.target.checked);
                      if (
                        e.target.checked &&
                        error === "Please agree to the terms and conditions before payment"
                      ) {
                        setError(null);
                      }
                    }}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1556F5] focus:ring-[#1556F5]"
                  />
                  <span className="text-sm text-gray-800">
                    I have read and agree to the terms and services.
                  </span>
                </label>
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
                disabled={!selectedMethod || processing || !acceptedTerms}
                className="w-full bg-[#1556F5] text-white py-4 rounded-xl font-bold text-lg hover:bg-[#0F3FCC] disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-600/30"
              >
                {processing ? (
                  "PROCESSING..."
                ) : selectedMethod === "bank_transfer" ? (
                  "SHOW PAYMENT QR CODE ->"
                ) : (
                  `PAY ${formatPrice(depositAmount)} VND`
                )}
              </button>

              {/* Security Notice */}
              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-gray-600">
                <Shield className="w-4 h-4" />
                <span>Transactions are secure and encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Column - Payment Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-32">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Payment summary
              </h3>

              {/* Booking Info */}
              <div className="space-y-3 border-b border-gray-200 pb-4 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Booking ID:</span>
                  <span className="font-mono font-semibold text-gray-900">
                    #{booking?._id.slice(-8).toUpperCase()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vehicle:</span>
                  <span className="font-semibold text-gray-900">
                    {booking?.vehicle?.brand} {booking?.vehicle?.model}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Time:</span>
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
                  <span className="text-gray-600">Booking total:</span>
                  <span className="font-semibold text-gray-900">
                    {formatPrice(booking?.total_amount || 0)} VND
                  </span>
                </div>

                <div className="flex justify-between text-base border-t border-gray-200 pt-3">
                  <span className="font-bold text-gray-900">
                    Deposit (30%):
                  </span>
                  <span className="font-bold text-2xl text-[#1556F5]">
                    {formatPrice(depositAmount)} VND
                  </span>
                </div>

                <div className="flex justify-between text-sm text-gray-600 pb-4 border-b border-gray-200">
                  <span>Pay later amount:</span>
                  <span className="font-semibold">
                    {formatPrice(remainingAmount)} VND
                  </span>
                </div>

                <div className="bg-[#EEF4FF] border border-[#DCE8FF] rounded-lg p-3 mt-4">
                  <div className="flex gap-2">
                    <CheckCircle className="w-5 h-5 text-[#1556F5] flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-[#101828]">
                      <p className="font-bold mb-1">
                        After successful payment:
                      </p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Booking is confirmed immediately</li>
                        <li>Receive a detailed confirmation email</li>
                        <li>Vehicle is reserved for you</li>
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
