import { useState, useEffect } from "react";
import { getAllBookings, deleteBooking } from "../../services/bookingApi";
import BookingTable from "../../components/staff/BookingTable";
import { Loader2, ChevronDown } from "lucide-react";

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
      <ChevronDown className="h-4 w-4" />
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
    if (!window.confirm("Are you sure you want to delete this booking?")) return;
    try {
      await deleteBooking(id);
      fetchBookings();
    } catch (err) {
      alert("Error deleting booking: " + err.message);
    }
  };

  // Client-side filtering: rental type + driver status
  const filteredBookings = bookings.filter((b) => {
    if (rentalTypeFilter && b.rental_type !== rentalTypeFilter) return false;
    if (driverStatusFilter === "unassigned") {
      // Unassigned: with_driver and no driver yet
      return b.rental_type === "with_driver" && !b.driver;
    }
    if (driverStatusFilter === "assigned") {
      // Assigned: has driver
      return !!b.driver;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage all bookings</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Filter: Trạng thái đơn */}
          <SelectFilter
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in_progress">In Progress</option>
            <option value="vehicle_returned">Vehicle Returned</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </SelectFilter>

          {/* Filter: Loại hình thuê */}
          <SelectFilter
            value={rentalTypeFilter}
            onChange={(e) => setRentalTypeFilter(e.target.value)}
          >
            <option value="">All Services</option>
            <option value="self_drive">Self-drive</option>
            <option value="with_driver">With Driver</option>
          </SelectFilter>

          {/* Filter: Trạng thái tài xế */}
          <SelectFilter
            value={driverStatusFilter}
            onChange={(e) => setDriverStatusFilter(e.target.value)}
          >
            <option value="">Driver Assignment</option>
            <option value="unassigned">Unassigned</option>
            <option value="assigned">Assigned</option>
          </SelectFilter>
        </div>
      </div>

      {/* Filter Summary Badge */}
      {driverStatusFilter === "unassigned" && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span className="font-medium">
            {filteredBookings.length} bookings with drivers waiting for assignment
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
                Previous
              </button>
              <span className="text-sm text-gray-600 font-medium px-4">
                Page {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
