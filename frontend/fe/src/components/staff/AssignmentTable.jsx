import { Edit, Trash2 } from "lucide-react";
import { formatDate } from "../../utils/formatters";

const STATUS_BADGES = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS = {
  pending: "Chờ phản hồi",
  accepted: "Đã nhận",
  rejected: "Từ chối",
};

export default function AssignmentTable({ assignments, onEdit, onDelete }) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        Không tìm thấy phân công nào.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-5 py-4 border-b w-[28%]">Đơn (Booking)</th>
              <th className="px-5 py-4 border-b w-[18%]">Xe</th>
              <th className="px-5 py-4 border-b w-[18%]">Tài xế</th>
              <th className="px-5 py-4 border-b w-[16%]">Trạng thái</th>
              <th className="px-5 py-4 border-b w-[20%]">Thời gian</th>
              {/* <th className="px-5 py-4 border-b text-center">Thao tác</th> */}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map((a) => (
              <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-900 truncate">
                    #{a.booking?._id?.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-sm mt-1">
                    {a.booking?.customer?.user?.full_name}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {formatDate(a.booking?.start_date)} -{" "}
                    {formatDate(a.booking?.end_date)}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-800">
                    {a.booking?.vehicle?.brand} {a.booking?.vehicle?.model}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900">
                    {a.driver?.user?.full_name || "N/A"}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {a.driver?.user?.phone}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      STATUS_BADGES[a.status] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="text-xs text-gray-500">
                    {formatDate(a.assigned_at, true)}
                  </div>
                  <div
                    className="text-xs text-blue-600 mt-1 w-25 truncate"
                    title={a.assigned_by?.user?.full_name}
                  >
                    Bởi: {a.assigned_by?.user?.full_name || "Staff"}
                  </div>
                </td>
                {/* <td className="px-5 py-4 flex items-center justify-center space-x-3">
                  {(a.status === "pending" || a.status === "rejected") && (
                    <button
                      onClick={() => onEdit(a)}
                      className="p-1.5 text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                      title="Đổi tài xế"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(a._id)}
                    className="p-1.5 text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                    title="Huỷ phân công"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td> */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
