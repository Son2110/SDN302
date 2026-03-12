import { Eye, Edit, Trash2 } from "lucide-react";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { Link } from "react-router-dom";

const STATUS_BADGES = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  in_progress: "bg-purple-100 text-purple-800",
  vehicle_returned: "bg-orange-100 text-orange-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  in_progress: "Đang thuê",
  vehicle_returned: "Đã trả xe",
  completed: "Hoàn thành",
  cancelled: "Đã huỷ",
};

const RENTAL_TYPES = {
  self_drive: "Tự lái",
  with_driver: "Có tài xế",
};

export default function BookingTable({ bookings, onDelete }) {
  if (!bookings || bookings.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        Không tìm thấy đơn đặt xe nào.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-5 py-4 border-b">Mã/Khách hàng</th>
              <th className="px-5 py-4 border-b">Xe & Loại</th>
              <th className="px-5 py-4 border-b">Thời gian</th>
              <th className="px-5 py-4 border-b">Tổng tiền</th>
              <th className="px-5 py-4 border-b">Trạng thái</th>
              <th className="px-5 py-4 border-b text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.map((b) => (
              <tr key={b._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-900 truncate w-32" title={b._id}>
                    #{b._id.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-sm mt-1">{b.customer?.user?.full_name || "Khách"}</div>
                  <div className="text-xs text-gray-400">{b.customer?.user?.phone}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-800">
                    {b.vehicle?.brand} {b.vehicle?.model}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 uppercase">
                    {b.vehicle?.license_plate}
                  </div>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                    {RENTAL_TYPES[b.rental_type] || b.rental_type}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm">Từ: <span className="font-medium">{formatDate(b.start_date)}</span></div>
                  <div className="text-sm mt-1">Đến: <span className="font-medium">{formatDate(b.end_date)}</span></div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-blue-600">{formatCurrency(b.total_amount)}</div>
                  {b.deposit_amount > 0 && (
                    <div className="text-xs text-gray-500 mt-1">Cọc: {formatCurrency(b.deposit_amount)}</div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_BADGES[b.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[b.status] || b.status}
                  </span>
                </td>
                <td className="px-5 py-4 flex items-center justify-center space-x-3">
                  <Link
                    to={`/staff/bookings/${b._id}`}
                    className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                    title="Xem chi tiết & Sửa"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>
                  {(b.status === "pending" || b.status === "cancelled") && (
                    <button
                      onClick={() => onDelete(b._id)}
                      className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                      title="Xoá đơn"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
