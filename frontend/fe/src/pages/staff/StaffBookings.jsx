import { useState, useEffect } from "react";
import { getAllBookings, deleteBooking } from "../../services/bookingApi";
import BookingTable from "../../components/staff/BookingTable";
import { Loader2, ChevronDown, AlertCircle } from "lucide-react";
import { toast } from "react-hot-toast";

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

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    id: null,
    title: "",
    message: "",
  });

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await getAllBookings({
        page,
        limit: 10,
        status: statusFilter,
        rental_type: rentalTypeFilter,
        driver_status: driverStatusFilter,
      });
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
  }, [page, statusFilter, rentalTypeFilter, driverStatusFilter]);

  const handleDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      id,
      title: "Delete Booking",
      message: "Are you sure you want to delete this booking? This action cannot be undone.",
    });
  };

  const confirmDelete = async () => {
    const id = confirmModal.id;
    setConfirmModal({ ...confirmModal, isOpen: false });
    try {
      await deleteBooking(id);
      toast.success("Booking deleted successfully");
      fetchBookings();
    } catch (err) {
      toast.error("Error deleting booking: " + err.message);
    }
  };

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
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
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
            onChange={(e) => {
              setRentalTypeFilter(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Services</option>
            <option value="self_drive">Self-drive</option>
            <option value="with_driver">With Driver</option>
          </SelectFilter>

          {/* Filter: Trạng thái tài xế */}
          <SelectFilter
            value={driverStatusFilter}
            onChange={(e) => {
              setDriverStatusFilter(e.target.value);
              setPage(1);
            }}
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
            {bookings.length} bookings with drivers waiting for assignment
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
            bookings={bookings}
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

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {confirmModal.title}
              </h3>
              <p className="text-sm text-gray-500">{confirmModal.message}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
