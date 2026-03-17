import { Eye } from "lucide-react";
import { formatDate, formatCurrency } from "../../utils/formatters";

const STATUS_BADGES = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

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

export default function PaymentTable({ payments, onView }) {
  if (!payments || payments.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        No transactions found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-5 py-4 border-b">Transaction Date</th>
              <th className="px-5 py-4 border-b">Type & Booking</th>
              <th className="px-5 py-4 border-b">Customer</th>
              <th className="px-5 py-4 border-b">Amount</th>
              <th className="px-5 py-4 border-b">Method</th>
              <th className="px-5 py-4 border-b">Status</th>
              <th className="px-5 py-4 border-b text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4 font-medium text-gray-800">
                  {formatDate(p.payment_date, true)}
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-900">{TYPE_LABELS[p.payment_type] || p.payment_type}</div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">Booking: #{p.booking?._id?.slice(-6)}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-800">{p.customer?.user?.full_name || "N/A"}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{p.customer?.user?.phone}</div>
                </td>
                <td className="px-5 py-4 font-bold text-gray-900">
                  {formatCurrency(p.amount)}
                </td>
                <td className="px-5 py-4 uppercase text-xs font-semibold text-gray-600">
                  <span className="bg-gray-100 px-2 py-1 rounded inline-block">{METHOD_LABELS[p.payment_method] || p.payment_method}</span>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_BADGES[p.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[p.status] || p.status}
                  </span>
                </td>
                <td className="px-5 py-4 flex justify-center">
                  <button
                    onClick={() => onView(p)}
                    className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    title="View Details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
