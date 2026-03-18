import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingDetail } from "../../services/bookingApi";
import { getAllDrivers } from "../../services/userApi";
import {
  assignDriver,
  getAssignments,
} from "../../services/driverAssignmentApi";
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
  X,
} from "lucide-react";
import { toast } from "react-hot-toast";

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
        setError("Cannot load booking info: " + err.message);
      } finally {
        setLoadingBooking(false);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const fetchDrivers = async () => {
    try {
      setLoadingDrivers(true);
      const [res, assignmentsRes] = await Promise.all([
        getAllDrivers({ status: "available", limit: 200 }),
        getAssignments({ booking_id: bookingId }).catch(() => ({ data: [] })),
      ]);

      const allAssignments = assignmentsRes.data || [];
      const pendingAssign = allAssignments.find(
        (a) => a.status === "pending",
      );

      if (pendingAssign) {
        const pDriverId = pendingAssign.driver?._id || pendingAssign.driver;
        let pDriver =
          res.data?.find((d) => d._id === pDriverId) || pendingAssign.driver;

        if (pDriver && pDriver.user) {
          setDrivers([{ ...pDriver, isPendingAssignment: true, assignmentId: pendingAssign._id }]);
          setSelectedDriverId(pDriverId);
        } else {
          setDrivers([]);
        }
      } else {
        const rejectedDriverIds = new Set(
          allAssignments
            .filter((a) => a.status === "rejected")
            .map((a) => a.driver?._id || a.driver),
        );

        const availableDrivers = (res.data || []).filter(
          (d) => !rejectedDriverIds.has(d._id),
        );
        setDrivers(availableDrivers);
        
        // If an assignment was just accepted, show success and redirect
        const acceptedAssign = allAssignments.find(a => a.status === "accepted");
        if (acceptedAssign) {
          toast.success("Driver accepted the assignment!");
          setTimeout(() => navigate(`/staff/bookings/${bookingId}`), 2000);
        }
      }
    } catch (err) {
      setError("Cannot load driver list: " + err.message);
    } finally {
      setLoadingDrivers(false);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    fetchDrivers();
    
    // Check status every 5 seconds
    const interval = setInterval(() => {
      // Only poll if we have a pending assignment
      if (drivers.some(d => d.isPendingAssignment)) {
        fetchDrivers();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [bookingId, drivers.some(d => d.isPendingAssignment)]);

  const handleAssign = async () => {
    if (!selectedDriverId) return;
    try {
      setAssigning(true);
      setError(null);
      await assignDriver({
        booking_id: bookingId,
        driver_id: selectedDriverId,
      });
      toast.success("Assignment request sent to driver!");
      // Re-fetch to enter "waiting" state
      fetchDrivers();
    } catch (err) {
      toast.error(err.message);
      setError(err.message);
    } finally {
      setAssigning(false);
    }
  };

  const handleCancelAssignment = async (assignmentId) => {
    if (!window.confirm("Are you sure you want to cancel this assignment request?")) return;
    try {
      setAssigning(true);
      await fetch(`${import.meta.env.VITE_API_URL}/driver-assignment/${assignmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Assignment cancelled");
      setSelectedDriverId(null);
      fetchDrivers();
    } catch (err) {
      toast.error("Failed to cancel: " + err.message);
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
          <h1 className="text-2xl font-bold text-gray-900">Assign Driver</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Choose a suitable driver for the booking below
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Booking info card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4 sticky top-6">
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Booking Information
            </h2>

            {booking ? (
              <>
                {/* Booking ID */}
                <div>
                  <p className="text-xs text-gray-500">Booking ID</p>
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
                    <p className="text-xs text-gray-500">
                      {booking.customer?.user?.phone}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="text-gray-500 text-xs">Rental Period</p>
                    <p className="font-medium text-gray-800 mt-1">
                      {new Date(booking.start_date).toLocaleDateString("en-US")}
                    </p>
                    <p className="text-gray-400 text-xs">to</p>
                    <p className="font-medium text-gray-800">
                      {new Date(booking.end_date).toLocaleDateString("en-US")}
                    </p>
                  </div>
                </div>

                {/* Status */}
                <div className="text-xs text-gray-500">
                  Status:{" "}
                  <span className="font-semibold text-blue-600 uppercase">
                    {booking.status}
                  </span>
                </div>
              </>
            ) : (
              <p className="text-gray-500 text-sm">Booking info not found</p>
            )}

            {/* Selected driver preview */}
            {selectedDriver && (
              <div className="mt-2 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                <p className="text-xs font-bold text-indigo-700 mb-1">
                  Selected Driver
                </p>
                <p className="font-semibold text-indigo-900 text-sm">
                  {selectedDriver.user?.full_name}
                </p>
                <p className="text-xs text-indigo-600">
                  {selectedDriver.user?.phone}
                </p>
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
                  Assignment successful! Redirecting...
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-2">
              {selectedDriver?.isPendingAssignment ? (
                <>
                  <button
                    disabled
                    className="w-full py-2.5 bg-yellow-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 opacity-80 cursor-not-allowed text-sm"
                  >
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Waiting Response...
                  </button>
                  <button
                    onClick={() => handleCancelAssignment(selectedDriver.assignmentId)}
                    disabled={assigning}
                    className="w-full py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-xl font-medium hover:bg-red-100 transition-colors text-sm flex items-center justify-center gap-2"
                  >
                    {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                    Cancel Assignment
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAssign}
                  disabled={!selectedDriverId || assigning || success}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {assigning ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Confirm Assignment
                    </>
                  )}
                </button>
              )}
              
              {!selectedDriver?.isPendingAssignment && (
                <button
                  onClick={() => navigate(-1)}
                  className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  Cancel
                </button>
              )}
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
                    Available Drivers
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
                  placeholder="Search by name or phone number..."
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
                    {search
                      ? "No matching drivers found"
                      : "No drivers available"}
                  </p>
                  <p className="text-sm mt-1">
                    {search
                      ? "Try searching with a different keyword"
                      : "All drivers are busy or not yet approved"}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredDrivers.map((driver) => {
                    const isSelected = selectedDriverId === driver._id;
                    const initials = (driver.user?.full_name ||
                      "?")[0].toUpperCase();

                    return (
                      <button
                        key={driver._id}
                        onClick={() => setSelectedDriverId(driver._id)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all w-full ${
                          isSelected
                            ? "border-blue-500 bg-blue-50 shadow-md shadow-blue-100"
                            : "border-gray-100 hover:border-gray-300 hover:shadow-sm"
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 transition-colors ${
                            isSelected
                              ? "bg-blue-600 text-white"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {initials}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p
                            className={`font-semibold text-sm truncate ${
                              isSelected ? "text-blue-900" : "text-gray-800"
                            }`}
                          >
                            {driver.user?.full_name || "Unknown name"}
                          </p>
                          <div className="flex items-center gap-1 mt-1 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{driver.user?.phone || "—"}</span>
                          </div>
                          {driver.experience_years != null && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {driver.experience_years} years of experience
                            </p>
                          )}
                        </div>

                        {/* Status + check */}
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          {driver.isPendingAssignment ? (
                            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              Waiting Response
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              Available
                            </span>
                          )}
                          {isSelected && !driver.isPendingAssignment && (
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
