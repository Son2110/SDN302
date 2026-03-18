import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  AlertCircle,
  ChevronLeft,
  DollarSign,
} from "lucide-react";
import { getBookingById } from "../../services/bookingApi";
import { requestExtension } from "../../services/extensionApi";
import { getVehicleBookedDates } from "../../services/vehicleApi";
import { getToken } from "../../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";

const ExtendBooking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [newEndDate, setNewEndDate] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);

  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const getMinExtendDate = () => {
    if (!booking) return null;
    const min = normalizeDate(booking.end_date);
    min.setDate(min.getDate() + 1);
    return min;
  };

  const getMaxExtendDate = () => {
    if (!booking) return null;

    const currentEnd = normalizeDate(booking.end_date);
    const maxByPolicy = new Date(currentEnd);
    maxByPolicy.setDate(maxByPolicy.getDate() + 30);

    const nextBookedStart = bookedDates
      .map((range) => normalizeDate(range.start))
      .filter((startDate) => startDate > currentEnd)
      .sort((a, b) => a - b)[0];

    if (!nextBookedStart) return maxByPolicy;

    const maxByConflict = new Date(nextBookedStart);
    maxByConflict.setDate(maxByConflict.getDate() - 1);

    return maxByConflict < maxByPolicy ? maxByConflict : maxByPolicy;
  };

  const hasAvailableExtensionDate = () => {
    const minDate = getMinExtendDate();
    const maxDate = getMaxExtendDate();
    if (!minDate || !maxDate) return false;
    return maxDate >= minDate;
  };

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBookingData();
  }, [id]);

  const fetchBookingData = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getBookingById(id);
      setBooking(response.data);

      // Fetch booked dates for this vehicle
      try {
        const datesResponse = await getVehicleBookedDates(
          response.data.vehicle._id,
        );
        setBookedDates(datesResponse.data || []);
      } catch (err) {
        console.error("Failed to load booked dates:", err);
      }
    } catch (err) {
      setError(err.message || "Unable to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const isDateBooked = (date) => {
    const checkDate = normalizeDate(date);

    return bookedDates.some((range) => {
      const start = normalizeDate(range.start);
      const end = normalizeDate(range.end);

      return checkDate >= start && checkDate <= end;
    });
  };

  useEffect(() => {
    if (!newEndDate) return;
    const maxDate = getMaxExtendDate();
    const minDate = getMinExtendDate();
    const selected = normalizeDate(newEndDate);
    if (!maxDate || !minDate || selected < minDate || selected > maxDate) {
      setNewEndDate(null);
    }
  }, [booking, bookedDates]);

  const calculateExtensionDays = () => {
    if (!booking || !newEndDate) return 0;
    const currentEnd = new Date(booking.end_date);
    const newEnd = new Date(newEndDate);
    currentEnd.setHours(0, 0, 0, 0);
    newEnd.setHours(0, 0, 0, 0);
    const diffTime = newEnd - currentEnd;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const hasDriverService = () => {
    if (!booking) return false;

    if (booking.rental_type === "with_driver" || !!booking.driver) {
      return true;
    }

    const start = new Date(booking.start_date);
    const end = new Date(booking.end_date);
    const rentalDays = Math.max(
      1,
      Math.ceil((end - start) / (1000 * 60 * 60 * 24)),
    );
    const selfDriveTotal = rentalDays * (booking.vehicle?.daily_rate || 0);

    return booking.total_amount >= selfDriveTotal + rentalDays * 500000;
  };

  const calculateExtensionCost = () => {
    const days = calculateExtensionDays();
    if (days <= 0 || !booking) return 0;

    const dailyRate = booking.vehicle?.daily_rate || 0;
    const isDuringRental = booking.status === "in_progress";
    const extensionDailyRate = isDuringRental ? dailyRate * 1.1 : dailyRate;
    let cost = days * extensionDailyRate;

    // Add driver fee if this booking includes driver service
    if (hasDriverService()) {
      const DRIVER_FEE_PER_DAY = 500000;
      const extensionDriverDailyRate = isDuringRental
        ? DRIVER_FEE_PER_DAY * 1.1
        : DRIVER_FEE_PER_DAY;
      cost += days * extensionDriverDailyRate;
    }

    return cost;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!newEndDate) {
      setError("Please select a new end date");
      return;
    }

    const currentEnd = new Date(booking.end_date);
    const newEnd = new Date(newEndDate);
    currentEnd.setHours(0, 0, 0, 0);
    newEnd.setHours(0, 0, 0, 0);

    if (newEnd <= currentEnd) {
      setError("New end date must be after current end date");
      return;
    }

    const extensionDays = calculateExtensionDays();
    if (extensionDays > 30) {
      setError("You cannot extend more than 30 days at once");
      return;
    }

    try {
      setSubmitting(true);
      const year = newEndDate.getFullYear();
      const month = String(newEndDate.getMonth() + 1).padStart(2, "0");
      const day = String(newEndDate.getDate()).padStart(2, "0");
      const formattedDate = `${year}-${month}-${day}`;

      const response = await requestExtension(booking._id, formattedDate);

      toast.success("Extension request has been sent successfully!");
      navigate("/my-bookings");
    } catch (err) {
      setError(err.message || "Unable to submit extension request");
      toast.error(err.message || "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <div className="text-red-500 text-lg mb-4">{error}</div>
          <button
            onClick={() => navigate("/my-bookings")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to list for your booking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Go back
        </button>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Request booking extension
          </h1>

          {/* Current Booking Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Current booking information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Vehicle</p>
                <p className="font-bold text-gray-900">
                  {booking?.vehicle?.brand} {booking?.vehicle?.model}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">License plate</p>
                <p className="font-bold text-gray-900">
                  {booking?.vehicle?.license_plate}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Start date</p>
                <p className="font-bold text-gray-900">
                  {formatDate(booking?.start_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current end date</p>
                <p className="font-bold text-blue-600">
                  {formatDate(booking?.end_date)}
                </p>
              </div>
            </div>
          </div>

          {/* Extension Form */}
          <form onSubmit={handleSubmit}>
            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-3">
                <AlertCircle size={20} className="mt-0.5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Date Picker */}
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-3">
                Select new end date
              </label>
              <DatePicker
                selected={newEndDate}
                onChange={(date) => setNewEndDate(date)}
                minDate={getMinExtendDate()}
                maxDate={getMaxExtendDate()}
                filterDate={(date) => {
                  if (!hasAvailableExtensionDate()) return false;
                  const checkDate = normalizeDate(date);
                  const minDate = getMinExtendDate();
                  const maxDate = getMaxExtendDate();
                  if (!minDate || !maxDate) return false;
                  if (checkDate < minDate || checkDate > maxDate) return false;
                  return !isDateBooked(checkDate);
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="Select date..."
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                calendarClassName="shadow-xl"
                disabled={!hasAvailableExtensionDate()}
              />
              {hasAvailableExtensionDate() ? (
                <p className="text-xs text-gray-500 mt-2">
                  * You can extend up to 30 days. Dates after the nearest booking are blocked.
                </p>
              ) : (
                <p className="text-xs text-red-600 mt-2">
                  * This vehicle is already booked immediately after your current end date, so extension is not available.
                </p>
              )}
            </div>

            {/* Extension Summary */}
            {newEndDate && calculateExtensionDays() > 0 && (
              <div className="bg-gradient-to-br from-blue-50 to-gray-100 border-2 border-blue-200 rounded-2xl p-6 mb-6">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Clock size={20} className="text-blue-600" />
                  Extension summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Extension days</span>
                    <span className="font-bold text-gray-900">
                      {calculateExtensionDays()} days
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current end date</span>
                    <span className="text-gray-900">
                      {formatDate(booking.end_date)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">New end date</span>
                    <span className="font-bold text-blue-600">
                      {formatDate(newEndDate)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-blue-200 flex justify-between items-center">
                    <span className="text-gray-900 font-bold flex items-center gap-2">
                      <DollarSign size={18} />
                      Estimated extension cost
                    </span>
                    <span className="text-2xl font-bold text-blue-600">
                      {formatCurrency(calculateExtensionCost())}
                    </span>
                  </div>
                  {booking.status === "in_progress" ? (
                    <p className="text-xs text-gray-600 italic">
                      * Surcharge is applied (+10%/day) because the booking is currently in progress.
                    </p>
                  ) : (
                    <p className="text-xs text-gray-600 italic">
                      * Standard daily rate is applied because the trip has not started yet.
                    </p>
                  )}
                  {hasDriverService() && (
                    <p className="text-xs text-gray-600 italic">
                      * Includes driver fee (500,000 VND/day).
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={submitting}
                className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  submitting || !newEndDate || calculateExtensionDays() <= 0
                }
                className="flex-1 bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Submitting..." : "Submitting an extension request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ExtendBooking;
