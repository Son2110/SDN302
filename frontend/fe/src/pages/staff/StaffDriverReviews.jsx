import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Star,
  Search,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  User,
  Eye,
} from "lucide-react";
import { getAllDriverReviews } from "../../services/reviewApi";

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "—";

const StarRow = ({ rating }) => (
  <span className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <Star
        key={s}
        size={13}
        fill={s <= rating ? "#f59e0b" : "none"}
        color={s <= rating ? "#f59e0b" : "#d1d5db"}
      />
    ))}
  </span>
);

const RatingBadge = ({ rating }) => {
  const color =
    rating >= 4.5
      ? "bg-emerald-50 text-emerald-700"
      : rating >= 3.5
      ? "bg-blue-50 text-blue-700"
      : rating >= 2.5
      ? "bg-yellow-50 text-yellow-700"
      : "bg-red-50 text-red-700";
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${color}`}
    >
      <Star size={10} fill="currentColor" />
      {rating?.toFixed(1)}
    </span>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const StaffDriverReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const loadReviews = async (page = 1) => {
    try {
      setLoading(true);
      const params = { page, limit: 15, search: searchTerm };
      if (ratingFilter) {
        params.min_rating = ratingFilter;
        params.max_rating = ratingFilter;
      }
      const res = await getAllDriverReviews(params);
      setReviews(res.data || []);
      setPagination({ page: res.page, pages: res.pages, total: res.total });
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ratingFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadReviews(1);
  };

  // ── Compute overall avg from current page
  const avg =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-blue-600" size={24} />
            Driver Reviews
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Xem tất cả đánh giá của khách hàng dành cho tài xế
          </p>
        </div>
        <div className="flex items-center gap-3">
          {avg !== null && (
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
              <Star size={14} fill="#f59e0b" color="#f59e0b" />
              <span className="text-sm font-bold text-amber-700">
                {avg.toFixed(1)} avg
              </span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100">
            <TrendingUp size={16} className="text-blue-600" />
            <span className="text-sm font-semibold text-blue-700">
              {pagination.total} reviews
            </span>
          </div>
        </div>
      </div>

      {/* ── Search & Filter ── */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex flex-wrap gap-3 items-center"
      >
        <div className="relative flex-1 min-w-52">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            size={15}
          />
          <input
            type="text"
            placeholder="Tìm theo tên tài xế..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
        >
          <option value="">All Ratings</option>
          <option value="5">⭐⭐⭐⭐⭐ 5 sao</option>
          <option value="4">⭐⭐⭐⭐ 4 sao</option>
          <option value="3">⭐⭐⭐ 3 sao</option>
          <option value="2">⭐⭐ 2 sao</option>
          <option value="1">⭐ 1 sao</option>
        </select>
        <button
          type="submit"
          className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
        >
          Search
        </button>
      </form>

      {/* ── Error ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  #
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider w-64">
                  Comment
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Trip Period
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Reviewed At
                </th>
                <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : reviews.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="text-center py-16 text-gray-400 text-sm"
                  >
                    <Star size={36} className="mx-auto mb-2 text-gray-200" />
                    Chưa có đánh giá nào
                  </td>
                </tr>
              ) : (
                reviews.map((r, idx) => {
                  const driverName = r.driver?.user?.full_name || "—";
                  const driverPhone = r.driver?.user?.phone || "";
                  const driverAvatar = r.driver?.user?.avatar_url;
                  const customerName = r.customer?.user?.full_name || "—";
                  const customerAvatar = r.customer?.user?.avatar_url;

                  return (
                    <tr
                      key={r._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {/* # */}
                      <td className="px-5 py-3.5 text-gray-400 text-xs">
                        {(pagination.page - 1) * 15 + idx + 1}
                      </td>

                      {/* Driver */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-800 overflow-hidden flex items-center justify-center shrink-0">
                            {driverAvatar ? (
                              <img
                                src={driverAvatar}
                                alt={driverName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={15} className="text-gray-300" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-800 text-sm leading-tight">
                              {driverName}
                            </p>
                            {driverPhone && (
                              <p className="text-xs text-gray-400">
                                {driverPhone}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center shrink-0">
                            {customerAvatar ? (
                              <img
                                src={customerAvatar}
                                alt={customerName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={13} className="text-blue-500" />
                            )}
                          </div>
                          <span className="text-gray-700 font-medium text-sm">
                            {customerName}
                          </span>
                        </div>
                      </td>

                      {/* Rating */}
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <RatingBadge rating={r.rating} />
                          <StarRow rating={r.rating} />
                        </div>
                      </td>

                      {/* Comment */}
                      <td className="px-5 py-3.5 max-w-xs">
                        {r.comment ? (
                          <p
                            className="text-gray-600 italic text-sm truncate max-w-[240px]"
                            title={r.comment}
                          >
                            "{r.comment}"
                          </p>
                        ) : (
                          <span className="text-gray-300 text-xs italic">
                            No comment
                          </span>
                        )}
                        {r.edit_count >= 1 && (
                          <span className="text-xs text-gray-300 ml-1">✏️</span>
                        )}
                      </td>

                      {/* Trip Period */}
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        {r.booking ? (
                          <div className="text-xs text-gray-500">
                            <p>{formatDate(r.booking.start_date)}</p>
                            <p className="text-gray-300">↓</p>
                            <p>{formatDate(r.booking.end_date)}</p>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>

                      {/* Reviewed At */}
                      <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-500">
                        {formatDate(r.createdAt)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-center">
                        <button
                          onClick={() =>
                            navigate(`/staff/driver-reviews/${r._id}`)
                          }
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors group"
                          title="View Details"
                        >
                          <Eye
                            size={18}
                            className="group-hover:scale-110 transition-transform"
                          />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination inside card ── */}
        {pagination.pages > 1 && (
          <div className="flex justify-between items-center px-5 py-3 border-t border-gray-100 bg-gray-50">
            <span className="text-xs text-gray-500">
              Showing{" "}
              {Math.min((pagination.page - 1) * 15 + 1, pagination.total)}–
              {Math.min(pagination.page * 15, pagination.total)} of{" "}
              {pagination.total} reviews
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadReviews(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              <span className="text-xs text-gray-600 font-medium">
                {pagination.page} / {pagination.pages}
              </span>
              <button
                onClick={() => loadReviews(pagination.page + 1)}
                disabled={pagination.page >= pagination.pages}
                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffDriverReviews;
