import { X, CreditCard, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { Link } from "react-router-dom";

const STATUS_LABELS = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

const TYPE_LABELS = {
  deposit: "Deposit",
  rental_fee: "Rental Fee",
  extension_fee: "Extension Fee",
  penalty: "Penalty",
  refund: "Refund",
};

const METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  momo: "MoMo",
  zalopay: "ZaloPay",
  vnpay: "VNPay",
};

export default function PaymentDetailModal({ payment, onClose }) {
  if (!payment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
            Transaction Details
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">Transaction ID (Txn ID)</p>
            <p className="font-mono text-xs bg-gray-100 inline-block px-3 py-1 rounded text-gray-700 font-semibold mb-3">{payment.transaction_id || "N/A"}</p>
            <h2 className="text-4xl font-bold text-gray-900">{formatCurrency(payment.amount)}</h2>
            <div className="flex items-center justify-center mt-3 space-x-2">
              {payment.status === "completed" && <CheckCircle className="w-5 h-5 text-green-500" />}
              {payment.status === "pending" && <Clock className="w-5 h-5 text-yellow-500" />}
              {(payment.status === "failed" || payment.status === "refunded") && <AlertCircle className="w-5 h-5 text-red-500" />}
              <span className="font-medium text-gray-700">{STATUS_LABELS[payment.status] || payment.status}</span>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Date & Time</span>
              <span className="font-medium text-gray-900">{formatDate(payment.payment_date, true)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Method</span>
              <span className="font-medium text-gray-900 uppercase">{METHOD_LABELS[payment.payment_method] || payment.payment_method}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Payment Type</span>
              <span className="font-medium text-gray-900">{TYPE_LABELS[payment.payment_type] || payment.payment_type}</span>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-xl mt-4">
              <p className="font-semibold text-gray-900 mb-2 border-b border-gray-200 pb-2">Related Information</p>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-sm">Customer:</span>
                  <span className="font-medium text-sm text-gray-900">{payment.customer?.user?.full_name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 text-sm">Booking:</span>
                  <Link to={`/staff/bookings/${payment.booking?._id}`} className="font-medium text-sm text-blue-600 hover:underline inline-flex items-center" onClick={onClose}>
                    #{payment.booking?._id?.slice(-6).toUpperCase()}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
