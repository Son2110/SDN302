import { useState, useEffect } from "react";
import { getAllDrivers } from "../../services/userApi";
import { assignDriver } from "../../services/driverAssignmentApi";
import { Loader2, X, UserCheck, Phone, AlertCircle, CheckCircle2, Users } from "lucide-react";

export default function AssignDriverModal({ booking, onClose, onSuccess }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchAvailableDrivers = async () => {
      try {
        setLoading(true);
        const res = await getAllDrivers({ status: "available", limit: 100 });
        setDrivers(res.data || []);
      } catch (err) {
        setError("Không thể tải danh sách tài xế: " + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAvailableDrivers();
  }, []);

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    try {
      setAssigning(true);
      setError(null);
      await assignDriver({ booking_id: booking._id, driver_id: selectedDriverId });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Phân công tài xế</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Đơn #{booking._id.slice(-6).toUpperCase()} ·{" "}
                {booking.vehicle?.brand} {booking.vehicle?.model}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/80 transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Booking Info Strip */}
          <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl mb-5 text-sm">
            <div>
              <span className="text-gray-500">Khách:</span>{" "}
              <span className="font-semibold text-gray-800">
                {booking.customer?.user?.full_name || "—"}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300" />
            <div>
              <span className="text-gray-500">Thời gian:</span>{" "}
              <span className="font-semibold text-gray-800">
                {new Date(booking.start_date).toLocaleDateString("vi-VN")} →{" "}
                {new Date(booking.end_date).toLocaleDateString("vi-VN")}
              </span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl mb-4">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <p className="text-sm text-green-700 font-medium">
                Đã gửi yêu cầu phân công thành công! Đang chờ tài xế xác nhận.
              </p>
            </div>
          )}

          {/* Driver List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : drivers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="font-medium">Không có tài xế nào sẵn sàng</p>
              <p className="text-xs mt-1 text-gray-400">
                Tất cả tài xế đang bận hoặc chưa được duyệt
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                {drivers.length} tài xế đang rảnh
              </p>
              {drivers.map((driver) => {
                const isSelected = selectedDriverId === driver._id;
                return (
                  <button
                    key={driver._id}
                    onClick={() => setSelectedDriverId(driver._id)}
                    className={`w-full flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all text-left ${isSelected
                        ? "border-blue-500 bg-blue-50 shadow-sm"
                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${isSelected
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-600"
                        }`}
                    >
                      {(driver.user?.full_name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold text-sm ${isSelected ? "text-blue-800" : "text-gray-800"
                          }`}
                      >
                        {driver.user?.full_name || "Không rõ tên"}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5 text-xs text-gray-500">
                        <Phone className="w-3 h-3" />
                        <span>{driver.user?.phone || "—"}</span>
                      </div>
                    </div>
                    {/* Available badge */}
                    <span className="shrink-0 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Sẵn sàng
                    </span>
                    {isSelected && (
                      <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors text-sm"
          >
            Huỷ
          </button>
          <button
            onClick={handleAssign}
            disabled={!selectedDriverId || assigning || success}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {assigning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang phân công...
              </>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                Xác nhận phân công
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
