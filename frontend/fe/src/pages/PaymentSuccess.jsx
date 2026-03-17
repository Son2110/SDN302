import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CheckCircle,
  Download,
  AlertCircle,
  Clock,
  XCircle,
  ArrowRight,
  Calendar,
  MapPin,
  CreditCard,
  FileText,
  Lightbulb,
} from "lucide-react";
import * as paymentService from "../services/paymentService";
import { getBookingById } from "../services/bookingApi";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get("payment");
  const bookingId =
    searchParams.get("booking_id") || searchParams.get("booking"); // Support both params
  const paymentType = searchParams.get("type");
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
    } else if (bookingId) {
      fetchBookingData();
    } else {
      setLoading(false);
    }
  }, [paymentId, bookingId, vnpTxnRef, vnpResponseCode]);

  const fetchBookingData = async () => {
    try {
      const response = await getBookingById(bookingId);
      setBooking(response.data);

      // If booking is confirmed from QR payment, create a temporary payment object.
      if (response.data.status === "confirmed" && paymentType === "deposit") {
        setPayment({
          _id: response.data._id, // Use booking ID as a temporary payment ID
          status: "completed",
          payment_type: "deposit",
          amount: response.data.deposit_amount,
          payment_method: "bank_transfer",
          transaction_id: `QR_DEPOSIT_${response.data._id.slice(-8).toUpperCase()}`,
          booking: response.data._id,
          payment_date: new Date().toISOString(),
        });
      } else if (
        response.data.status === "completed" &&
        paymentType === "final"
      ) {
        setPayment({
          _id: response.data._id, // Use booking ID as a temporary payment ID
          status: "completed",
          payment_type: "rental_fee",
          amount: response.data.final_amount,
          payment_method: "bank_transfer",
          transaction_id: `QR_FINAL_${response.data._id.slice(-8).toUpperCase()}`,
          booking: response.data._id,
          payment_date: new Date().toISOString(),
        });
      }

      setLoading(false);
    } catch (err) {
      console.error("[PaymentSuccess] Error loading booking:", err);
      setLoading(false);
    }
  };

  const verifyVNPayPayment = async () => {
    try {
      // Collect ALL VNPay params from URL (needed for signature verification)
      const allVnpayParams = {};
      searchParams.forEach((value, key) => {
        // Only include VNPay params (start with vnp_)
        if (key.startsWith("vnp_")) {
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
      console.error("[PaymentSuccess] Error verifying payment:", err);
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
        const bookingId =
          typeof paymentData.payment.booking === "string"
            ? paymentData.payment.booking
            : paymentData.payment.booking._id ||
            paymentData.payment.booking.toString();
        const response = await getBookingById(bookingId);
        setBooking(response.data);
      }

      setLoading(false);

      // If payment is still pending, poll briefly for webhook/handler updates.
      if (paymentData.payment.status === "pending" && !error) {
        pollPaymentStatus(id);
      }
    } catch (err) {
      console.error("[PaymentSuccess] Error loading payment:", err);
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
        const bookingId =
          typeof paymentData.payment.booking === "string"
            ? paymentData.payment.booking
            : paymentData.payment.booking._id ||
            paymentData.payment.booking.toString();
        const response = await getBookingById(bookingId);
        setBooking(response.data);
      }

      setLoading(false);

      // If payment is still pending, poll briefly for webhook/handler updates.
      if (paymentData.payment.status === "pending" && !error) {
        pollPaymentStatus();
      }
    } catch (err) {
      console.error("[PaymentSuccess] Error loading payment:", err);
      setLoading(false);
    }
  };

  const loadBooking = async (bookingId) => {
    try {
      // Ensure bookingId is a string, not an object
      const id =
        typeof bookingId === "string"
          ? bookingId
          : bookingId?._id || bookingId?.toString() || bookingId;
      if (!id) {
        console.error("[PaymentSuccess] Invalid booking ID:", bookingId);
        return;
      }
      const response = await getBookingById(id);
      setBooking(response.data);
    } catch (err) {
      console.error("[PaymentSuccess] Error loading booking:", err);
    }
  };

  const pollPaymentStatus = async (id = paymentId) => {
    // Poll payment status up to 5 times (10 seconds).
    let attempts = 0;
    const maxAttempts = 5;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const response = await paymentService.checkPaymentStatus(id);

        if (response.status === "completed" || response.status === "failed") {
          const paymentData = await paymentService.getPaymentById(id);
          setPayment(paymentData.payment);

          // Reload booking to get the latest status
          // Handle both cases: booking can be ObjectId string or populated object
          if (paymentData.payment.booking) {
            const bookingId =
              typeof paymentData.payment.booking === "string"
                ? paymentData.payment.booking
                : paymentData.payment.booking._id ||
                paymentData.payment.booking.toString();
            await loadBooking(bookingId);
          }

          clearInterval(interval);
        } else if (attempts >= maxAttempts) {
          // Still pending after 5 attempts, webhook may be delayed.
          // Keep pending status for user awareness.
          clearInterval(interval);
        }
      } catch (err) {
        console.error("[PaymentSuccess] Error polling payment status:", err);
        clearInterval(interval);
      }
    }, 2000);
  };

  const getBookingStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "Pending",
        color: "bg-red-100 text-red-700",
        icon: Clock,
      },
      confirmed: {
        label: "Confirmed",
        color: "bg-blue-100 text-blue-700",
        icon: CheckCircle,
      },
      vehicle_delivered: {
        label: "Delivered",
        color: "bg-blue-100 text-blue-700",
        icon: CheckCircle,
      },
      in_progress: {
        label: "In progress",
        color: "bg-blue-100 text-blue-700",
        icon: CheckCircle,
      },
      vehicle_returned: {
        label: "Vehicle returned",
        color: "bg-gray-100 text-gray-700",
        icon: CheckCircle,
      },
      completed: {
        label: "Completed",
        color: "bg-blue-100 text-blue-700",
        icon: CheckCircle,
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-100 text-red-700",
        icon: XCircle,
      },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-700",
      icon: AlertCircle,
    };
    const Icon = config.icon;

    return (
      <span
        className={`px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 ${config.color}`}
      >
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
    if (typeof booking === "string") return booking;
    return booking._id || booking.toString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-lg mb-2">
            Verifying payment...
          </div>
          <div className="text-sm text-gray-400">
            Please wait a moment
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = payment?.status === "completed" && !error;
  const isFailed = payment?.status === "failed" || error;
  const isPending = payment?.status === "pending" && !error;

  // Determine payment type
  const isDepositPayment =
    payment?.payment_type === "deposit" || paymentType === "deposit";
  const isFinalPayment =
    payment?.payment_type === "rental_fee" || paymentType === "final";

  return (
    <div className="min-h-screen bg-[#F8FAFB] pt-32 pb-20">
      <div className="max-w-3xl mx-auto px-6">
        {/* Success State */}
        {isSuccess && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* Success Header */}
            <div
              className={`text-white p-8 text-center ${isFinalPayment
                ? "bg-gradient-to-r from-[#101828] to-[#1556F5]"
                : "bg-gradient-to-r from-[#101828] to-[#1556F5]"
                }`}
            >
              <div className="mb-4">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg">
                  <CheckCircle
                    size={48}
                    className="text-[#1556F5]"
                  />
                </div>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {isFinalPayment
                  ? "Payment completed!"
                  : "Payment deposit successful!"}
              </h1>
              <p className="text-white/90 text-lg">
                {isFinalPayment
                  ? "Your booking has been completed"
                  : booking?.status === "confirmed"
                    ? "Your booking has been confirmed"
                    : "Processing your booking..."}
              </p>
            </div>

            <div className="p-8">
              {/* Timeline - Different for Deposit vs Final */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Progress
                </h2>

                {isDepositPayment ? (
                  // Deposit Payment Timeline
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-[#1556F5] text-white flex items-center justify-center font-semibold">
                          <CheckCircle size={20} />
                        </div>
                        <div className="w-0.5 h-8 bg-[#DCE8FF] mt-2"></div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-900">
                          Deposit payment completed
                        </p>
                        <p className="text-sm text-gray-600">
                          30% deposit has been paid
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${booking?.status === "confirmed" ||
                            booking?.status === "vehicle_delivered" ||
                            booking?.status === "in_progress"
                            ? "bg-[#1556F5] text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                        >
                          {booking?.status === "confirmed" ||
                            booking?.status === "vehicle_delivered" ||
                            booking?.status === "in_progress" ? (
                            <CheckCircle size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </div>
                        <div className="w-0.5 h-8 bg-gray-200 mt-2"></div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-900">
                          Booking confirmation
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking?.status === "confirmed" ||
                            booking?.status === "vehicle_delivered" ||
                            booking?.status === "in_progress"
                            ? "Booking has been confirmed"
                            : "Awaiting confirmation..."}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${booking?.status === "vehicle_delivered" ||
                            booking?.status === "in_progress"
                            ? "bg-[#1556F5] text-white"
                            : "bg-gray-200 text-gray-500"
                            }`}
                        >
                          {booking?.status === "vehicle_delivered" ||
                            booking?.status === "in_progress" ? (
                            <CheckCircle size={20} />
                          ) : (
                            <Clock size={20} />
                          )}
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-900">Vehicle pickup</p>
                        <p className="text-sm text-gray-600">
                          {booking?.status === "vehicle_delivered" ||
                            booking?.status === "in_progress"
                            ? "Vehicle delivered"
                            : "Waiting for pickup date"}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Final Payment Timeline
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-[#1556F5] text-white flex items-center justify-center font-semibold">
                          <CheckCircle size={20} />
                        </div>
                        <div className="w-0.5 h-8 bg-[#DCE8FF] mt-2"></div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-900">Vehicle returned</p>
                        <p className="text-sm text-gray-600">
                          Vehicle has been returned and inspected
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-[#1556F5] text-white flex items-center justify-center font-semibold">
                          <CheckCircle size={20} />
                        </div>
                        <div className="w-0.5 h-8 bg-[#DCE8FF] mt-2"></div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-900">
                          Final payment completed
                        </p>
                        <p className="text-sm text-gray-600">
                          Remaining balance has been paid in full
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-[#1556F5] text-white flex items-center justify-center font-semibold">
                          <CheckCircle size={20} />
                        </div>
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="font-semibold text-gray-900">
                          Booking completed
                        </p>
                        <p className="text-sm text-gray-600">
                          Your trip has ended
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Booking Info Card */}
              {booking && (
                <div className="bg-[#EEF4FF] rounded-xl p-6 mb-6 border border-[#DCE8FF]">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                      <Calendar size={20} />
                      Booking information
                    </h3>
                    {getBookingStatusBadge(booking.status)}
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Booking ID</p>
                      <p className="font-semibold text-gray-900">
                        {booking._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    {booking.vehicle && (
                      <div>
                        <p className="text-gray-600 mb-1">Vehicle</p>
                        <p className="font-semibold text-gray-900">
                          {booking.vehicle.brand} {booking.vehicle.model}
                        </p>
                      </div>
                    )}
                    {booking.start_date && (
                      <div>
                        <p className="text-gray-600 mb-1">Pickup date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(booking.start_date).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    )}
                    {booking.end_date && (
                      <div>
                        <p className="text-gray-600 mb-1">Return date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(booking.end_date).toLocaleDateString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Final Payment Breakdown - Only show for final payment */}
              {isFinalPayment && booking && (
                <div className="bg-[#EEF4FF] rounded-xl p-6 mb-6 border border-[#DCE8FF]">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-[#101828]">
                    <FileText size={20} />
                    Payment summary
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-[#DCE8FF]">
                      <span className="text-gray-700">Total rental amount</span>
                      <span className="font-semibold text-gray-900">
                        {formatPrice(booking.total_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-[#DCE8FF]">
                      <span className="text-gray-700">Deposit paid</span>
                      <span className="font-semibold text-[#1556F5]">
                        -{formatPrice(booking.deposit_amount)}
                      </span>
                    </div>
                    {booking.final_amount &&
                      booking.final_amount !==
                      booking.total_amount - booking.deposit_amount && (
                        <div className="flex justify-between py-2 border-b border-[#DCE8FF]">
                          <span className="text-gray-700">
                            Additional fees (charging, penalties, extension)
                          </span>
                          <span className="font-semibold text-red-600">
                            +
                            {formatPrice(
                              booking.final_amount -
                              (booking.total_amount - booking.deposit_amount),
                            )}
                          </span>
                        </div>
                      )}
                    <div className="flex justify-between pt-3 border-t-2 border-[#DCE8FF]">
                      <span className="font-bold text-lg text-[#101828]">
                        Paid at return
                      </span>
                      <span className="font-bold text-2xl text-[#1556F5]">
                        {formatPrice(payment?.amount || booking.final_amount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {payment && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <CreditCard size={20} />
                    Payment details
                  </h2>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600 mb-1">Transaction ID</p>
                      <p className="font-semibold text-gray-900 font-mono">
                        {payment.transaction_id ||
                          payment._id.slice(-8).toUpperCase()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Amount</p>
                      <p className="font-semibold text-blue-600 text-lg">
                        {formatPrice(payment.amount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Method</p>
                      <p className="font-semibold text-gray-900 capitalize">
                        {payment.payment_method}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 mb-1">Payment type</p>
                      <p className="font-semibold text-gray-900">
                        {payment.payment_type === "deposit"
                          ? "Deposit (30%)"
                          : payment.payment_type === "rental_fee"
                            ? "Final Payment"
                            : payment.payment_type === "extension_fee"
                              ? "Extension fee"
                              : payment.payment_type === "penalty"
                                ? "Penalty fee"
                                : payment.payment_type}
                      </p>
                    </div>
                    {payment.payment_date && (
                      <div className="md:col-span-2">
                        <p className="text-gray-600 mb-1">
                          Payment time
                        </p>
                        <p className="font-semibold text-gray-900">
                          {new Date(payment.payment_date).toLocaleString(
                            "vi-VN",
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Remaining amount for deposit payment */}
                  {isDepositPayment && booking && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm font-semibold text-red-900 mb-2 flex items-center gap-2">
                          <Lightbulb size={16} />
                          Remaining amount to pay at return:
                        </p>
                        <p className="text-2xl font-bold text-red-700">
                          {formatPrice(
                            booking.total_amount - booking.deposit_amount,
                          )}
                        </p>
                        <p className="text-xs text-red-700 mt-2">
                          * Additional charging, penalty, or extension fees may apply.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Next Steps */}
              <div
                className={`rounded-xl p-6 mb-6 border ${isFinalPayment
                  ? "bg-[#EEF4FF] border-[#DCE8FF]"
                  : "bg-[#EEF4FF] border-[#DCE8FF]"
                  }`}
              >
                <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <ArrowRight size={20} />
                  {isFinalPayment
                    ? "Thank you for using our service"
                    : "Next steps"}
                </h3>

                {isFinalPayment ? (
                  // Final Payment Next Steps
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        Your booking has been completed and saved in history
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        A detailed invoice has been sent to your email
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        Thank you for choosing our car rental service
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        We look forward to serving you again
                      </span>
                    </li>
                  </ul>
                ) : (
                  // Deposit Payment Next Steps
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        You will receive a booking confirmation email shortly
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        Please arrive at your scheduled time and location for pickup
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        Bring your ID card and driver license for pickup
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle
                        size={16}
                        className="text-[#1556F5] shrink-0 mt-0.5"
                      />
                      <span>
                        The remaining amount is paid at return or at trip end
                      </span>
                    </li>
                  </ul>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {isFinalPayment ? (
                  // Final Payment Actions
                  <>
                    <Link
                      to="/fleet"
                      className="px-6 py-3 bg-[#1556F5] text-white rounded-lg font-semibold hover:bg-[#0F3FCC] transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <ArrowRight size={20} />
                      Book again
                    </Link>
                    {getBookingId(payment?.booking) && (
                      <Link
                        to={`/bookings/${getBookingId(payment?.booking)}`}
                        className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                      >
                        <FileText size={20} />
                        View booking details
                      </Link>
                    )}
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Print invoice
                    </button>
                  </>
                ) : (
                  // Deposit Payment Actions
                  <>
                    {getBookingId(payment?.booking) && (
                      <Link
                        to={`/bookings/${getBookingId(payment?.booking)}`}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                      >
                        <FileText size={20} />
                        View booking details
                      </Link>
                    )}
                    <Link
                      to="/my-bookings"
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      My bookings
                    </Link>
                    <button
                      onClick={() => window.print()}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      <Download size={20} />
                      Print invoice
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pending State */}
        {isPending && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <Clock
                size={64}
                className="mx-auto text-[#1556F5] animate-pulse"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Payment is being processed
            </h1>
            <p className="text-gray-600 mb-6">
              Please wait while we verify your transaction...
            </p>
            <div className="bg-[#EEF4FF] border border-[#DCE8FF] rounded-lg p-4 text-sm text-[#101828]">
              <p>If payment is complete, this page will update automatically.</p>
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
              <h1 className="text-3xl font-bold mb-2">Payment failed</h1>
              <p className="text-red-50 text-lg">
                {payment?.status === "failed"
                  ? "Transaction failed. Please try again."
                  : "Unable to verify payment status."}
              </p>
            </div>

            <div className="p-8">
              {payment && (
                <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                  <h2 className="font-bold text-lg mb-4">
                    Transaction information
                  </h2>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID:</span>
                      <span className="font-semibold font-mono">
                        {payment.transaction_id ||
                          payment._id.slice(-8).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-semibold">
                        {formatPrice(payment.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Method:</span>
                      <span className="font-semibold capitalize">
                        {payment.payment_method}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800">
                  <strong>Possible reasons:</strong>
                </p>
                <ul className="list-disc list-inside text-sm text-red-700 mt-2 space-y-1">
                  <li>Insufficient account balance</li>
                  <li>Incorrect card information</li>
                  <li>Transaction rejected by bank</li>
                  <li>Unstable network connection</li>
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {getBookingId(payment?.booking) && (
                  <>
                    <Link
                      to={`/payments?booking=${getBookingId(payment?.booking)}&type=${payment?.payment_type || "rental_fee"}`}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                    >
                      <CreditCard size={20} />
                      Try payment again
                    </Link>
                    <Link
                      to={`/bookings/${getBookingId(payment?.booking)}`}
                      className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition flex items-center justify-center gap-2"
                    >
                      Back to booking
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
