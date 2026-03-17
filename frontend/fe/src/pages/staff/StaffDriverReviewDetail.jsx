import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Star,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Loader2,
  AlertCircle,
  Car,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { getReviewById } from "../../services/reviewApi";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const formatCurrency = (n) =>
  n != null
    ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n)
    : "—";

const StarRow = ({ rating, size = 20 }) => (
  <span className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={size}
        fill={s <= rating ? "#f59e0b" : "none"}
        color={s <= rating ? "#f59e0b" : "#d1d5db"}
      />
    ))}
  </span>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3">
    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
      <Icon size={15} className="text-gray-500" />
    </div>
    <div>
      <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm font-semibold text-gray-800 mt-0.5">{value || "—"}</p>
    </div>
  </div>
);

const BookingStatusBadge = ({ status }) => {
  const cfg = {
    completed: { cls: "bg-emerald-50 text-emerald-700", label: "Completed" },
    in_progress: { cls: "bg-blue-50 text-blue-700", label: "In Progress" },
    confirmed: { cls: "bg-indigo-50 text-indigo-700", label: "Confirmed" },
    cancelled: { cls: "bg-red-50 text-red-700", label: "Cancelled" },
  }[status] || { cls: "bg-gray-100 text-gray-600", label: status };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

// ── Avatar Component ──────────────────────────────────────────────────────────
const Avatar = ({ url, name, size = "lg" }) => {
  const dim = size === "lg" ? "w-16 h-16" : "w-12 h-12";
  const iconSize = size === "lg" ? 28 : 20;
  return (
    <div
      className={`${dim} rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0 ring-2 ring-white shadow`}
    >
      {url ? (
        <img src={url} alt={name} className="w-full h-full object-cover" />
      ) : (
        <User size={iconSize} className="text-gray-400" />
      )}
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function StaffDriverReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await getReviewById(id);
        setReview(res.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );

  if (error)
    return (
      <div className="flex items-center gap-3 p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700">
        <AlertCircle size={20} />
        <p>{error}</p>
      </div>
    );

  if (!review)
    return (
      <div className="p-10 text-center text-gray-400">Review not found.</div>
    );

  const driver = review.driver;
  const customer = review.customer;
  const booking = review.booking;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/staff/driver-reviews")}
          className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-100"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review Detail</h1>
          <p className="text-gray-400 text-sm mt-0.5">
            ID: <span className="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{review._id}</span>
          </p>
        </div>
      </div>

      {/* ── Rating hero card ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          {/* Big rating display */}
          <div className="flex flex-col items-center justify-center w-28 h-28 bg-amber-50 rounded-2xl border-2 border-amber-200 shrink-0">
            <span className="text-4xl font-black text-amber-600">{review.rating}</span>
            <StarRow rating={review.rating} size={14} />
            <span className="text-xs text-amber-500 font-medium mt-0.5">/ 5</span>
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full border border-blue-200">
                Driver Review
              </span>
              {review.edit_count >= 1 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                  ✏️ Edited once
                </span>
              )}
            </div>

            <div className="bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              {review.comment ? (
                <p className="text-gray-700 leading-relaxed text-sm italic">
                  "{review.comment}"
                </p>
              ) : (
                <p className="text-gray-400 text-sm italic">No comment provided</p>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs text-gray-400">
              <Calendar size={12} />
              <span>
                Reviewed on{" "}
                <span className="font-medium text-gray-500">
                  {formatDate(review.createdAt)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ── Driver Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-gray-900 rounded-lg flex items-center justify-center">
              <User size={13} className="text-white" />
            </span>
            Driver
          </h2>

          <div className="flex items-center gap-3">
            <Avatar url={driver?.user?.avatar_url} name={driver?.user?.full_name} size="lg" />
            <div>
              <p className="font-bold text-gray-900 text-base">
                {driver?.user?.full_name || "—"}
              </p>
              <p className="text-xs text-gray-400">Tài xế được đánh giá</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-50">
            <InfoRow icon={Phone} label="Phone" value={driver?.user?.phone} />
            <InfoRow icon={Mail} label="Email" value={driver?.user?.email} />
            {driver?.rating != null && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <Star size={15} className="text-amber-500" fill="#f59e0b" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                    Overall Rating
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm font-bold text-amber-600">
                      {driver.rating.toFixed(1)}
                    </span>
                    <StarRow rating={Math.round(driver.rating)} size={13} />
                    <span className="text-xs text-gray-400">
                      ({driver.total_trips} trips)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Customer Card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <User size={13} className="text-white" />
            </span>
            Customer
          </h2>

          <div className="flex items-center gap-3">
            <Avatar url={customer?.user?.avatar_url} name={customer?.user?.full_name} />
            <div>
              <p className="font-bold text-gray-900 text-base">
                {customer?.user?.full_name || "—"}
              </p>
              <p className="text-xs text-gray-400">Người đánh giá</p>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-gray-50">
            <InfoRow icon={Phone} label="Phone" value={customer?.user?.phone} />
            <InfoRow icon={Mail} label="Email" value={customer?.user?.email} />
          </div>
        </div>
      </div>

      {/* ── Booking Card ── */}
      {booking && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
            <span className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center">
              <Car size={13} className="text-white" />
            </span>
            Related Booking
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <InfoRow
              icon={CheckCircle2}
              label="Status"
              value={
                <BookingStatusBadge status={booking.status} />
              }
            />
            <InfoRow
              icon={Calendar}
              label="Start Date"
              value={formatDate(booking.start_date)}
            />
            <InfoRow
              icon={Calendar}
              label="End Date"
              value={formatDate(booking.end_date)}
            />
            <InfoRow
              icon={Car}
              label="Rental Type"
              value={
                booking.rental_type === "with_driver"
                  ? "With Driver"
                  : "Self-drive"
              }
            />
            <InfoRow
              icon={MapPin}
              label="Pickup Location"
              value={booking.pickup_location}
            />
            <InfoRow
              icon={MapPin}
              label="Return Location"
              value={booking.return_location}
            />
            {booking.total_amount != null && (
              <InfoRow
                icon={Clock}
                label="Total Amount"
                value={formatCurrency(booking.total_amount)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
