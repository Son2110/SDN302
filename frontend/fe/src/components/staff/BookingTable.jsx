import { Eye, Trash2, UserPlus } from "lucide-react";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { Link, useNavigate } from "react-router-dom";

const STATUS_BADGES = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  vehicle_returned: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  vehicle_delivered: "bg-cyan-100 text-cyan-800",
};

const STATUS_LABELS = {
  pending: "Pending",
  confirmed: "Confirmed",
  in_progress: "In Progress",
  vehicle_returned: "Vehicle Returned",
  vehicle_delivered: "Vehicle Delivered",
  completed: "Completed",
  cancelled: "Cancelled",
};

const RENTAL_TYPES = {
  self_drive: "Self-drive",
  with_driver: "With Driver",
};

export default function BookingTable({ bookings, onDelete }) {
  const navigate = useNavigate();

  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        No bookings found.
      </div>
    );
  }

  // Booking cần phân công: with_driver + confirmed + chưa có driver
  const needsAssignment = (b) =>
    b.rental_type === "with_driver" && b.status === "confirmed" && !b.driver;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-5 py-4 border-b">ID / Customer</th>
              <th className="px-5 py-4 border-b">Vehicle & Type</th>
              <th className="px-5 py-4 border-b">Duration</th>
              <th className="px-5 py-4 border-b">Total Amount</th>
              <th className="px-5 py-4 border-b">Driver</th>
              <th className="px-5 py-4 border-b">Status</th>
              <th className="px-5 py-4 border-b text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                {/* Mã / Khách hàng */}
                <td className="px-5 py-4">
                  <div
                    className="font-semibold text-gray-900 truncate w-32"
                    title={b._id}
                  >
                    #{b._id.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-sm mt-1">
                    {b.customer?.user?.full_name || "Guest"}
                  </div>
                  <div className="text-xs text-gray-400">
                    {b.customer?.user?.phone}
                  </div>
                </td>

                {/* Xe & Loại */}
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-800">
                    {b.vehicle?.brand} {b.vehicle?.model}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">
                    {b.vehicle?.license_plate}
                  </div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                      b.rental_type === "with_driver"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {RENTAL_TYPES[b.rental_type] || b.rental_type}
                  </span>
                </td>

                {/* Thời gian */}
                <td className="px-5 py-4">
                  <div className="text-sm">
                    From:{" "}
                    <span className="font-medium">
                      {formatDate(b.start_date)}
                    </span>
                  </div>
                  <div className="text-sm mt-1">
                    To:{" "}
                    <span className="font-medium">
                      {formatDate(b.end_date)}
                    </span>
                  </div>
                </td>

                {/* Tổng tiền */}
                <td className="px-5 py-4">
                  <div className="font-semibold text-blue-600">
                    {formatCurrency(b.total_amount)}
                  </div>
                  {b.deposit_amount > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Deposit: {formatCurrency(b.deposit_amount)}
                    </div>
                  )}
                </td>

                {/* Tài xế */}
                <td className="px-5 py-4">
                  {b.rental_type === "self_drive" ? (
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                      Self-drive
                    </span>
                  ) : b.driver ? (
                    <div>
                      <span className="inline-block mt-1 px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                        Assigned
                      </span>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                      Unassigned
                    </span>
                  )}
                </td>

                {/* Trạng thái */}
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_BADGES[b.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                </td>

                {/* Thao tác */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2 flex-wrap">
                    <Link
                      to={`/staff/bookings/${b._id}`}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Nút phân công tài xế */}
                    {needsAssignment(b) && (
                      <button
                        onClick={() =>
                          navigate(`/staff/bookings/${b._id}/assign-driver`)
                        }
                        className="p-1.5 text-indigo-600 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors"
                        title="Assign Driver"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    )}

                    {(b.status === "pending" || b.status === "cancelled") && (
                      <button
                        onClick={() => onDelete(b._id)}
                        className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                        title="Delete Booking"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
