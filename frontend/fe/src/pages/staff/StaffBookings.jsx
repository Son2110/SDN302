import { useState, useEffect } from "react";
import { getAllBookings, deleteBooking } from "../../services/bookingApi";
import BookingTable from "../../components/staff/BookingTable";
import { Loader2 } from "lucide-react";

const SelectFilter = ({ value, onChange, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow font-medium text-sm"
    >
      {children}
    </select>
    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
      <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
        <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
      </svg>
    </div>
  </div>
);

export default function StaffBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [rentalTypeFilter, setRentalTypeFilter] = useState("");
  const [driverStatusFilter, setDriverStatusFilter] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getAllBookings({ page, limit: 10, status: statusFilter });
      setBookings(res.data || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá đơn đặt xe này?")) return;
    try {
      await deleteBooking(id);
      fetchBookings();
    } catch (err) {
      alert("Lỗi khi xoá: " + err.message);
    }
  };

  // Lọc phía client: loại thuê + trạng thái tài xế
  const filteredBookings = bookings.filter((b) => {
    if (rentalTypeFilter && b.rental_type !== rentalTypeFilter) return false;
    if (driverStatusFilter === "unassigned") {
      // Chưa phân công: with_driver và chưa có driver
      return b.rental_type === "with_driver" && !b.driver;
    }
    if (driverStatusFilter === "assigned") {
      // Đã phân công: có driver
      return !!b.driver;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý Đơn đặt xe</h1>
          <p className="text-gray-500 text-sm mt-1">Xem và quản lý tất cả đơn hàng</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter: Trạng thái đơn */}
          <SelectFilter
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xác nhận</option>
            <option value="confirmed">Đã xác nhận</option>
            <option value="in_progress">Đang thuê</option>
            <option value="vehicle_returned">Đã trả xe</option>
            <option value="completed">Hoàn thành</option>
            <option value="cancelled">Đã huỷ</option>
          </SelectFilter>

          {/* Filter: Loại hình thuê */}
          <SelectFilter
            value={rentalTypeFilter}
            onChange={(e) => setRentalTypeFilter(e.target.value)}
          >
            <option value="">Tất cả dịch vụ</option>
            <option value="self_drive">Thuê xe tự lái</option>
            <option value="with_driver">Thuê xe kèm tài xế</option>
          </SelectFilter>

          {/* Filter: Trạng thái tài xế */}
          <SelectFilter
            value={driverStatusFilter}
            onChange={(e) => setDriverStatusFilter(e.target.value)}
          >
            <option value="">Phân công tài xế</option>
            <option value="unassigned">Chưa phân công</option>
            <option value="assigned">Đã phân công</option>
          </SelectFilter>
        </div>
      </div>

      {/* Badge tóm tắt filter */}
      {driverStatusFilter === "unassigned" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-medium">
            {filteredBookings.length} đơn thuê có tài xế đang chờ phân công
          </span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <BookingTable
            bookings={filteredBookings}
            onDelete={handleDelete}
            onAssignSuccess={fetchBookings}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600 font-medium px-4">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
