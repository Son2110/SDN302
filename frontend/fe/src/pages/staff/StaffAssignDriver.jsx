import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingDetail } from "../../services/bookingApi";
import { getAllDrivers } from "../../services/userApi";
import { assignDriver } from "../../services/driverAssignmentApi";
import {
  ArrowLeft,
  Loader2,
  UserCheck,
  Phone,
  AlertCircle,
  CheckCircle2,
  Users,
  Search,
  Car,
  Calendar,
  User,
} from "lucide-react";

const STATUS_BADGE = {
  available: "bg-green-100 text-green-700",
  busy: "bg-orange-100 text-orange-700",
};

export default function StaffAssignDriver() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [drivers, setDrivers] = useState([]);
  const [loadingBooking, setLoadingBooking] = useState(true);
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Fetch booking info
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const res = await getBookingDetail(bookingId);
        setBooking(res.data);
      } catch (err) {
        setError("Không thể tải thông tin đơn: " + err.message);
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  // Fetch available drivers (no limit so page can grow)
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        setLoadingDrivers(true);
        const res = await getAllDrivers({ status: "available", limit: 200 });
        setDrivers(res.data || []);
      } catch (err) {
        setError("Không thể tải danh sách tài xế: " + err.message);
      } finally {
        setLoadingDrivers(false);
      }
    };
    fetchDrivers();
  }, []);

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    try {
      setAssigning(true);
      setError(null);
      await assignDriver({ booking_id: bookingId, driver_id: selectedDriverId });
      setSuccess(true);
      setTimeout(() => navigate(`/staff/bookings/${bookingId}`), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Filter drivers by search
  const filteredDrivers = drivers.filter((d) => {
    const name = d.user?.full_name?.toLowerCase() || "";
    const phone = d.user?.phone || "";
    const q = search.toLowerCase();
    return name.includes(q) || phone.includes(q);
  });

  const selectedDriver = drivers.find((d) => d._id === selectedDriverId);

  if (loadingBooking) {
    return (
      <div className="flex justify-center items-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân công tài xế</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Chọn tài xế phù hợp cho đơn đặt xe bên dưới
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Booking info card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4 sticky top-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Thông tin đơn
            </h2>

            {booking ? (
              <>
                {/* Booking ID */}
                <div>
                  <p className="text-xs text-gray-500">Mã đơn</p>
                  <p className="font-bold text-gray-900 text-lg">
                    #{booking._id.slice(-6).toUpperCase()}
                  </p>
                </div>

                {/* Vehicle */}
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
                  <Car className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {booking.vehicle?.brand} {booking.vehicle?.model}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 uppercase">
                      {booking.vehicle?.license_plate}
                    </p>
                  </div>
                </div>

                {/* Customer */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <User className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">
                      {booking.customer?.user?.full_name}
                    </p>
                    <p className="text-xs text-gray-500">{booking.customer?.user?.phone}</p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-gray-500 text-xs">Thời gian thuê</p>
                    <p className="font-medium text-gray-800 mt-1">
                      {new Date(booking.start_date).toLocaleDateString("vi-VN")}
                    </p>
                    <p className="text-gray-400 text-xs">đến</p>
                    <p className="font-medium text-gray-800">
                      {new Date(booking.end_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="text-xs text-gray-500">
                  Trạng thái:{" "}
                  <span className="font-semibold text-blue-600 uppercase">
                    {booking.status}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Không tìm thấy thông tin đơn</p>
            )}

            {/* Selected driver preview */}
            {selectedDriver && (
              <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-xs font-bold text-indigo-700 mb-1">Tài xế đã chọn</p>
                <p className="font-semibold text-indigo-900 text-sm">
                  {selectedDriver.user?.full_name}
                </p>
                <p className="text-xs text-indigo-600">{selectedDriver.user?.phone}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-xl">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <p className="text-xs text-green-700 font-medium">
                  Phân công thành công! Đang chuyển hướng...
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleAssign}
                disabled={!selectedDriverId || assigning || success}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <button
                onClick={() => navigate(-1)}
                className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: Driver list */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {/* List header + search */}
            <div className="px-6 py-5 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <h2 className="text-base font-bold text-gray-900">
                    Tài xế đang rảnh
                  </h2>
                  {!loadingDrivers && (
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                      {filteredDrivers.length}
                    </span>
                  )}
                </div>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên hoặc số điện thoại..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>
            </div>

            {/* Driver grid */}
            <div className="p-6">
              {loadingDrivers ? (
                <div className="flex justify-center items-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <Users className="w-14 h-14 mx-auto mb-4 text-gray-200" />
                  <p className="font-medium text-gray-500">
                    {search ? "Không tìm thấy tài xế phù hợp" : "Không có tài xế nào sẵn sàng"}
                  </p>
                  <p className="text-sm mt-1">
                    {search
                      ? "Thử tìm với từ khoá khác"
                      : "Tất cả tài xế đang bận hoặc chưa được duyệt"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDrivers.map((driver) => {
                    const isSelected = selectedDriverId === driver._id;
                    const initials = (driver.user?.full_name || "?")[0].toUpperCase();

                    return (
                      <button
                        key={driver._id}
                        onClick={() => setSelectedDriverId(driver._id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all w-full ${isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                            : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                          }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-sm truncate ${isSelected ? "text-blue-900" : "text-gray-800"
                              }`}
                          >
                            {driver.user?.full_name || "Không rõ tên"}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{driver.user?.phone || "—"}</span>
                          </div>
                          {driver.experience_years != null && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {driver.experience_years} năm kinh nghiệm
                            </p>
                          )}
                        </div>

                        {/* Status + check */}
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Sẵn sàng
                          </span>
                          {isSelected && (
                            <UserCheck className="w-5 h-5 text-blue-600" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
