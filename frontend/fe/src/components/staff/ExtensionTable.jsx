import { CheckCircle, XCircle } from "lucide-react";
import { formatDate, formatCurrency } from "../../utils/formatters";

const STATUS_BADGES = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  alternative_offered: "bg-purple-100 text-purple-800",
};

const STATUS_LABELS = {
  pending: "Pending Review",
  approved: "Approved",
  rejected: "Rejected",
  alternative_offered: "Alternative Offered",
};

export default function ExtensionTable({ extensions, onApprove, onReject }) {
  if (!extensions || extensions.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        No extension requests found.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-5 py-4 border-b">Customer / Booking</th>
              <th className="px-5 py-4 border-b">Vehicle</th>
              <th className="px-5 py-4 border-b">Extension Period</th>
              <th className="px-5 py-4 border-b">Extension Fee</th>
              <th className="px-5 py-4 border-b">Status</th>
              <th className="px-5 py-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {extensions.map((ext) => (
              <tr key={ext._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-900">{ext.customer?.user?.full_name || "N/A"}</div>
                  <div className="text-xs text-gray-500 mt-1">{ext.customer?.user?.phone}</div>
                  <div className="text-xs text-gray-400 mt-1 truncate w-24" title={ext.booking?._id}>
                    Booking: #{ext.booking?._id?.slice(-6).toUpperCase()}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-800">
                    {ext.booking?.vehicle?.brand} {ext.booking?.vehicle?.model}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">
                    {ext.booking?.vehicle?.license_plate}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-xs text-gray-500 line-through">Old: {formatDate(ext.original_end_date)}</span>
                    <span className="text-sm font-medium text-blue-700">New: {formatDate(ext.new_end_date)}</span>
                    <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded inline-block w-fit">
                      +{ext.days_extended} days
                    </span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-bold text-gray-900">{formatCurrency(ext.additional_amount)}</div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_BADGES[ext.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[ext.status] || ext.status}
                  </span>
                  {ext.has_conflict && ext.status === "pending" && (
                    <div className="text-xs text-red-600 font-semibold mt-1">⚠️ Schedule Conflict!</div>
                  )}
                </td>
                <td className="px-5 py-4 flex items-center justify-center space-x-3">
                  {ext.status === "pending" && (
                    <>
                      <button
                        onClick={() => onApprove(ext._id)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors font-medium text-xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> <span>Approve</span>
                      </button>
                      <button
                        onClick={() => onReject(ext)}
                        className="flex items-center space-x-1 px-3 py-1.5 text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-medium text-xs"
                      >
                        <XCircle className="w-3.5 h-3.5" /> <span>Reject</span>
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
