import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Car,
  User,
  Phone,
  Mail,
  CreditCard,
  ChevronLeft,
  AlertCircle,
  CheckCircle,
  Star,
  Edit2,
  Send,
  ClipboardCheck,
} from "lucide-react";
import { getBookingById, cancelBooking } from "../../services/bookingApi";
import { getToken } from "../../services/api";
import {
  createReview,
  getReviewsByBooking,
  updateReview,
} from "../../services/reviewApi";

// ===== Module-level components — defined outside BookingDetail so React never re-mounts them on re-render =====

const StarPicker = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        onClick={() => onChange(s)}
        className="focus:outline-none"
      >
        <Star
          size={28}
          className={
            s <= value ? "text-blue-500 fill-blue-500" : "text-gray-300"
          }
        />
      </button>
    ))}
  </div>
);

const StarDisplay = ({ value }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={18}
        className={
          s <= value ? "text-blue-500 fill-blue-500" : "text-gray-200"
        }
      />
    ))}
  </div>
);

const ReviewCard = ({
  title,
  reviewType,
  existingReview,
  rating,
  setRating,
  comment,
  setComment,
  submitting,
  onSubmit,
  editingId,
  editRating,
  setEditRating,
  editComment,
  setEditComment,
  editSubmitting,
  onEditStart,
  onEditSubmit,
  onEditCancel,
}) => {
  const isEditing = !!(
    editingId &&
    existingReview &&
    editingId === existingReview._id
  );

  if (existingReview) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
        {isEditing ? (
          <div className="space-y-4">
            <StarPicker value={editRating} onChange={setEditRating} />
            <textarea
              value={editComment}
              onChange={(e) => setEditComment(e.target.value)}
              placeholder="Your comment..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-400 text-sm"
            />
            <div className="flex gap-3">
              <button
                onClick={onEditSubmit}
                disabled={editSubmitting}
                className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              >
                <Send size={16} />
                {editSubmitting ? "Saving..." : "Save changes"}
              </button>
              <button
                onClick={onEditCancel}
                className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div>
            <StarDisplay value={existingReview.rating} />
            {existingReview.comment && (
              <p className="mt-3 text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-xl px-4 py-3">
                {existingReview.comment}
              </p>
            )}
            {existingReview.edit_count < 1 && (
              <button
                onClick={() => onEditStart(existingReview)}
                className="mt-4 flex items-center gap-1.5 text-blue-600 text-sm font-semibold hover:text-blue-700 transition-colors"
              >
                <Edit2 size={15} />
                Edit review (1 edit left)
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-500 mb-2">Star rating</p>
          <StarPicker value={rating} onChange={setRating} />
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Comment (optional)</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-blue-400 text-sm"
          />
        </div>
        <button
          onClick={() => onSubmit(reviewType)}
          disabled={submitting}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm shadow-blue-200"
        >
          <Send size={16} />
          {submitting ? "Submitting..." : "Submit review"}
        </button>
      </div>
    </div>
  );
};

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Review state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [overallRating, setOverallRating] = useState(5);
  const [overallComment, setOverallComment] = useState("");
  const [driverRating, setDriverRating] = useState(5);
  const [driverComment, setDriverComment] = useState("");
  const [submittingOverall, setSubmittingOverall] = useState(false);
  const [submittingDriver, setSubmittingDriver] = useState(false);
  const [editingReview, setEditingReview] = useState(null); // { _id, review_type, rating, comment }
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchBookingDetail();
  }, [id]);

  const fetchBookingDetail = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getBookingById(id);
      setBooking(response.data);
      if (response.data?.status === "completed") {
        fetchReviews(id);
      }
    } catch (err) {
      setError(err.message || "Unable to load booking details");
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async (bookingId) => {
    setReviewsLoading(true);
    try {
      const res = await getReviewsByBooking(bookingId);
      setReviews(res.data || []);
    } catch {
      // silently ignore
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleSubmitReview = async (reviewType) => {
    const isDriver = reviewType === "driver";
    const rating = isDriver ? driverRating : overallRating;
    const comment = isDriver ? driverComment : overallComment;
    const setSending = isDriver ? setSubmittingDriver : setSubmittingOverall;

    setSending(true);
    try {
      await createReview(id, rating, reviewType, comment);
      await fetchReviews(id);
      if (isDriver) {
        setDriverComment("");
        setDriverRating(5);
      } else {
        setOverallComment("");
        setOverallRating(5);
      }
    } catch (err) {
      alert(
        err.response?.data?.message || err.message || "Unable to submit review",
      );
    } finally {
      setSending(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment || "");
  };

  const handleSubmitEdit = async () => {
    setEditSubmitting(true);
    try {
      await updateReview(editingReview._id, editRating, editComment);
      await fetchReviews(id);
      setEditingReview(null);
    } catch (err) {
      alert(
        err.response?.data?.message || err.message || "Unable to update review",
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleCancelBooking = async () => {
    setCancelling(true);
    try {
      await cancelBooking(id);
      alert("Booking canceled successfully!");
      navigate("/my-bookings");
    } catch (err) {
      alert(err.message || "Unable to cancel booking. Please try again.");
    } finally {
      setCancelling(false);
      setShowCancelModal(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        label: "Pending",
        color: "bg-blue-50 text-blue-600 border-blue-200",
      },
      confirmed: {
        label: "Confirmed",
        color: "bg-blue-50 text-blue-600 border-blue-200",
      },
      in_progress: {
        label: "In progress",
        color: "bg-blue-50 text-blue-600 border-blue-200",
      },
      vehicle_returned: {
        label: "Vehicle returned",
        color: "bg-blue-50 text-blue-600 border-blue-200",
      },
      completed: {
        label: "Completed",
        color: "bg-gray-50 text-gray-600 border-gray-200",
      },
      cancelled: {
        label: "Cancelled",
        color: "bg-red-50 text-red-600 border-red-200",
      },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-50 text-gray-600",
    };
    return (
      <span
        className={`px-4 py-2 rounded-full text-sm font-bold border ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const overallReview = reviews.find((r) => r.review_type === "overall");
  const driverReview = reviews.find((r) => r.review_type === "driver");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
            {error || "Booking not found"}
          </div>
          <Link
            to="/my-bookings"
            className="inline-flex items-center gap-2 mt-6 text-blue-600 font-semibold hover:gap-3 transition-all"
          >
            <ChevronLeft size={20} />
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back Button */}
        <button
          onClick={() => navigate("/my-bookings")}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Back to list
        </button>

        {/* Header */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Booking details
              </h1>
              <p className="text-gray-500">
                Booking ID:{" "}
                <span className="font-mono font-bold">{booking._id}</span>
              </p>
            </div>
            {getStatusBadge(booking.status)}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Info */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Vehicle information
              </h2>
              <div className="flex gap-6">
                <div className="w-48 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                  {booking.vehicle?.image_url ||
                    booking.vehicle?.image_urls?.[0] ? (
                    <img
                      src={
                        booking.vehicle.image_url ||
                        booking.vehicle.image_urls[0]
                      }
                      alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Car className="text-gray-300" size={48} />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {booking.vehicle?.brand} {booking.vehicle?.model}
                  </h3>
                  <p className="text-gray-500 mb-1">
                    License plate:{" "}
                    <span className="font-bold">
                      {booking.vehicle?.license_plate || "N/A"}
                    </span>
                  </p>
                  <p className="text-gray-500">
                    Vehicle type: {booking.vehicle?.vehicle_type?.type_name || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Booking details
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar
                    className="text-blue-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Rental time</p>
                    <p className="font-bold text-gray-900">
                      {formatDate(booking.start_date)} -{" "}
                      {formatDate(booking.end_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin
                    className="text-red-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Pickup location</p>
                    <p className="font-bold text-gray-900">
                      {booking.pickup_location}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin
                    className="text-blue-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Return location</p>
                    <p className="font-bold text-gray-900">
                      {booking.return_location}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock
                    className="text-blue-500 mt-1 flex-shrink-0"
                    size={20}
                  />
                  <div>
                    <p className="text-sm text-gray-500">Rental type</p>
                    <p className="font-bold text-gray-900">
                      {booking.rental_type === "self_drive"
                        ? "Self-drive"
                        : "With driver"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Info (if with_driver) */}
            {booking.driver && (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Driver information
                </h2>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600" size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {booking.driver?.user?.full_name}
                    </h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Phone size={14} />
                        {booking.driver?.user?.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail size={14} />
                        {booking.driver?.user?.email}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Review Section — only for completed bookings */}
            {booking.status === "completed" &&
              (reviewsLoading ? (
                <div className="flex justify-center py-6">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <ReviewCard
                    title="Trip review"
                    reviewType="overall"
                    existingReview={overallReview}
                    rating={overallRating}
                    setRating={setOverallRating}
                    comment={overallComment}
                    setComment={setOverallComment}
                    submitting={submittingOverall}
                    onSubmit={handleSubmitReview}
                    editingId={editingReview?._id}
                    editRating={editRating}
                    setEditRating={setEditRating}
                    editComment={editComment}
                    setEditComment={setEditComment}
                    editSubmitting={editSubmitting}
                    onEditStart={handleEditReview}
                    onEditSubmit={handleSubmitEdit}
                    onEditCancel={() => setEditingReview(null)}
                  />
                  {booking.rental_type === "with_driver" && booking.driver && (
                    <ReviewCard
                      title="Driver review"
                      reviewType="driver"
                      existingReview={driverReview}
                      rating={driverRating}
                      setRating={setDriverRating}
                      comment={driverComment}
                      setComment={setDriverComment}
                      submitting={submittingDriver}
                      onSubmit={handleSubmitReview}
                      editingId={editingReview?._id}
                      editRating={editRating}
                      setEditRating={setEditRating}
                      editComment={editComment}
                      setEditComment={setEditComment}
                      editSubmitting={editSubmitting}
                      onEditStart={handleEditReview}
                      onEditSubmit={handleSubmitEdit}
                      onEditCancel={() => setEditingReview(null)}
                    />
                  )}
                </>
              ))}
          </div>

          {/* Right Column - Payment & Actions */}
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Payment
              </h2>
              <div className="space-y-3 mb-6">
                {(() => {
                  // Calculate rental days
                  const startDate = new Date(booking.start_date);
                  const endDate = new Date(booking.end_date);
                  const diffTime = Math.abs(endDate - startDate);
                  const rentalDays =
                    Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                  // Calculate vehicle fee
                  const vehicleDailyRate = booking.vehicle?.daily_rate || 0;
                  const vehicleTotal = rentalDays * vehicleDailyRate;

                  // Calculate chauffeur fee (if applicable)
                  const DRIVER_FEE_PER_DAY = 500000;
                  const driverTotal =
                    booking.rental_type === "with_driver"
                      ? rentalDays * DRIVER_FEE_PER_DAY
                      : 0;

                  return (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Vehicle fee ({rentalDays} days x{" "}
                          {formatCurrency(vehicleDailyRate)})
                        </span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(vehicleTotal)}
                        </span>
                      </div>
                      {driverTotal > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Driver fee ({rentalDays} days x{" "}
                            {formatCurrency(DRIVER_FEE_PER_DAY)})
                          </span>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(driverTotal)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                        <span className="font-semibold text-gray-700">
                          Total amount
                        </span>
                        <span className="font-bold text-gray-900">
                          {formatCurrency(booking.total_amount)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          Deposit (30%)
                        </span>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(booking.deposit_amount)}
                        </span>
                      </div>

                      {booking.status === "completed" ? (
                        <>
                          {/* For completed bookings, show final payment details */}
                          {(booking.charging_fee > 0 ||
                            booking.penalty_amount > 0) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                  Additional fees
                                </span>
                                <span className="font-bold text-red-600">
                                  +
                                  {formatCurrency(
                                    (booking.charging_fee || 0) +
                                    (booking.penalty_amount || 0),
                                  )}
                                </span>
                              </div>
                            )}
                          <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                            <span className="font-semibold text-gray-700">
                              Final payment
                            </span>
                            <span className="font-bold text-blue-600">
                              {formatCurrency(
                                booking.final_amount ||
                                booking.total_amount - booking.deposit_amount,
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm pt-3 border-t-2 border-blue-200">
                            <span className="font-bold text-gray-900">
                              Total paid
                            </span>
                            <span className="font-bold text-blue-600 text-lg">
                              {formatCurrency(
                                booking.deposit_amount +
                                (booking.final_amount ||
                                  booking.total_amount -
                                  booking.deposit_amount),
                              )}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                          <span className="font-semibold text-gray-700">
                            Remaining
                          </span>
                          <span className="font-bold text-blue-600">
                            {formatCurrency(
                              booking.total_amount - booking.deposit_amount,
                            )}
                          </span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* Payment Status */}
              {booking.status === "completed" ? (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-3 rounded-xl mb-4">
                  <CheckCircle size={20} />
                  <span className="text-sm font-bold">
                    Fully paid
                  </span>
                </div>
              ) : booking.status === "confirmed" ||
                booking.status === "in_progress" ||
                booking.status === "vehicle_delivered" ||
                booking.status === "vehicle_returned" ? (
                <div className="flex items-center gap-2 text-blue-600 bg-blue-50 px-4 py-3 rounded-xl mb-4">
                  <CheckCircle size={20} />
                  <span className="text-sm font-bold">Deposit paid</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-3 rounded-xl mb-4">
                  <AlertCircle size={20} />
                  <span className="text-sm font-bold">Deposit unpaid</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
                {booking.status === "pending" && (
                  <button
                    onClick={() => navigate(`/payment/deposit/${booking._id}`)}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    Deposit payment
                  </button>
                )}

                {booking.status === "vehicle_returned" && (
                  <button
                    onClick={() => navigate(`/payment/final/${booking._id}`)}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <CreditCard size={20} />
                    Remaining payment
                  </button>
                )}

                {(booking.status === "in_progress" || booking.status === "confirmed") && (
                  <Link
                    to={`/bookings/${booking._id}/extend`}
                    className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                  >
                    <Clock size={20} />
                    Request extension
                  </Link>
                )}

                {(booking.status === "in_progress" ||
                  booking.status === "vehicle_returned" ||
                  booking.status === "completed") && (
                    <Link
                      to={`/bookings/${booking._id}/handover-receipt`}
                      className="w-full bg-white text-blue-700 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all border border-blue-200 flex items-center justify-center gap-2"
                    >
                      <ClipboardCheck size={20} />
                      Delivery handover receipt
                    </Link>
                  )}

                {(booking.status === "pending" ||
                  booking.status === "confirmed") && (
                    <button
                      onClick={() => setShowCancelModal(true)}
                      className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-200"
                    >
                      Cancel booking
                    </button>
                  )}
              </div>
            </div>
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="text-red-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Confirm booking cancellation
                </h3>
                <p className="text-gray-500">
                  Are you sure you want to cancel this booking?
                  {(booking.status === "confirmed" ||
                    booking.status === "in_progress") && (
                      <span className="block mt-2 text-blue-600 font-semibold">
                        Your deposit will be refunded.
                      </span>
                    )}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  disabled={cancelling}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                >
                  Go back
                </button>
                <button
                  onClick={handleCancelBooking}
                  disabled={cancelling}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {cancelling ? "Canceling..." : "Confirm cancellation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingDetail;
