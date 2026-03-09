import { formatDate } from "../../utils/formatters";

const TYPE_BADGES = {
  delivery: "bg-blue-100 text-blue-800",
  return: "bg-green-100 text-green-800",
};

const TYPE_LABELS = {
  delivery: "Giao xe (Delivery)",
  return: "Trả xe (Return)",
};

export default function HandoverTable({ handovers }) {
  if (!handovers || handovers.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 bg-white rounded-xl shadow-sm border border-gray-100">
        Không tìm thấy biên bản nào.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-5 py-4 border-b">Loại Biên Bản</th>
              <th className="px-5 py-4 border-b">Thời gian</th>
              <th className="px-5 py-4 border-b">Booking & Khách</th>
              <th className="px-5 py-4 border-b">Xe</th>
              <th className="px-5 py-4 border-b">Tình trạng (Km / Pin)</th>
              <th className="px-5 py-4 border-b">Nhân viên</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {handovers.map((h) => (
              <tr key={h._id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      TYPE_BADGES[h.handover_type] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {TYPE_LABELS[h.handover_type] || h.handover_type}
                  </span>
                </td>
                <td className="px-5 py-4 font-medium text-gray-800">
                  {formatDate(h.handover_time, true)}
                </td>
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-900 truncate w-24">
                    #{h.booking?._id?.slice(-6).toUpperCase()}
                  </div>
                  <div className="text-sm mt-1">{h.booking?.customer?.user?.full_name || "N/A"}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-800">
                    {h.vehicle?.brand} {h.vehicle?.model}
                  </div>
                  <div className="text-xs text-gray-500 mt-1 uppercase border border-gray-200 inline-block px-1 rounded bg-gray-50">
                    {h.vehicle?.license_plate}
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div>
                    <span className="text-gray-500">ODO:</span> <span className="font-medium text-gray-900">{h.mileage?.toLocaleString("vi-VN")} km</span>
                  </div>
                  {h.battery_level_percentage !== undefined && h.battery_level_percentage !== null && (
                    <div className="mt-1">
                      <span className="text-gray-500">Pin:</span> <span className="font-medium text-gray-900">{h.battery_level_percentage}%</span>
                    </div>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="text-sm font-medium text-gray-800">
                    {h.staff?.user?.full_name || "N/A"}
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
