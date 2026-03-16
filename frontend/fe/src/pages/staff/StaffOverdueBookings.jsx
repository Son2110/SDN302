import { useState, useEffect } from "react";
import { getAllBookings, deleteBooking } from "../../services/bookingApi";
import BookingTable from "../../components/staff/BookingTable";
import { Loader2 } from "lucide-react";

export default function StaffOverdueBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Fetch only overdue bookings
      const res = await getAllBookings({ page, limit: 10, is_overdue: "true" });
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
  }, [page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá đơn đặt xe này?")) return;
    try {
      await deleteBooking(id);
      fetchBookings();
    } catch (err) {
      alert("Lỗi khi xoá: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-red-600">Đơn quá hạn</h1>
          <p className="text-gray-500 text-sm mt-1">Danh sách các đơn đặt xe chưa trả đúng hạn</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-red-600" />
        </div>
      ) : (
        <>
          <BookingTable
            bookings={bookings}
            onDelete={handleDelete}
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
