import { useState, useEffect } from "react";
import { getDriverReviews } from "../../services/reviewApi";
import { getMyDriverStatus } from "../../services/userApi";
import { toast } from "react-hot-toast";
import { Star, User, Calendar, MessageSquare, Award, MapPin } from "lucide-react";
import dayjs from "dayjs";

const DriverReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const driverInfo = await getMyDriverStatus();
        if (!driverInfo || !driverInfo._id) {
          toast.error("Không tìm thấy thông tin tài xế.");
          setLoading(false);
          return;
        }

        const response = await getDriverReviews(driverInfo._id);
        if (response.success) {
          setReviews(response.data);
          setStats({
            average_rating: response.average_rating || 0,
            total_reviews: response.total_reviews || 0,
          });
        }
      } catch (error) {
        toast.error(error.message || "Không thể tải đánh giá.");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={14}
            className={`${star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-200"
              }`}
          />
        ))}
      </div>
    );
  };

  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  // Pagination logic
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = reviews.slice(indexOfFirstReview, indexOfLastReview);
  const totalPages = Math.ceil(reviews.length / reviewsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter">
      {/* Header with Glass Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 shadow-sm group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 group-hover:bg-emerald-100 transition-colors duration-500" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-50 ring-4 ring-emerald-50">
              <Award className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Đánh giá của tôi
              </h1>
              <p className="text-gray-400 text-xs font-medium mt-0.5">
                Phản hồi chân thực từ khách hàng sau mỗi hành trình
              </p>
            </div>
          </div>

          <div className="flex items-stretch gap-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4 hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0 border border-yellow-100">
                <Star className="text-yellow-600 w-5 h-5 fill-yellow-600" />
              </div>
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900 tracking-tighter">
                    {stats.average_rating.toFixed(1)}
                  </span>
                  <span className="text-[10px] font-bold text-gray-300 uppercase">/5.0</span>
                </div>
                <div className="mt-0.5">
                  {renderStars(Math.round(stats.average_rating))}
                </div>
              </div>
            </div>

            <div className="bg-emerald-600 p-4 rounded-2xl shadow-lg shadow-emerald-50 flex flex-col justify-center min-w-[130px] hover:-translate-y-1 transition-transform duration-300">
              <p className="text-[9px] text-emerald-100 uppercase font-bold tracking-wider mb-0.5 opacity-70">Tổng cộng</p>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold text-white leading-none tracking-tighter">
                  {stats.total_reviews}
                </span>
                <span className="text-[9px] font-bold text-emerald-100 uppercase tracking-wider opacity-70">Đánh giá</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div className="text-center bg-white p-20 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquare className="text-gray-200 w-10 h-10" />
          </div>
          <p className="text-gray-400 font-bold text-lg">Hòm thư trống</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4">
            {currentReviews.map((review) => (
              <div
                key={review._id}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-all duration-300 group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-5 relative">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:rotate-2 transition-transform duration-300 overflow-hidden shadow-sm">
                      {review.customer?.user?.avatar_url ? (
                        <img
                          src={review.customer.user.avatar_url}
                          alt="Avatar"
                          className="w-full h-full object-cover rounded-xl"
                        />
                      ) : (
                        <User size={26} className="text-emerald-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg tracking-tight">
                        {review.customer?.user?.full_name || "Nhà du hành ẩn danh"}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-gray-200 text-xs">•</span>
                        <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-lg border border-gray-100">
                          <Calendar size={10} className="text-emerald-500" />
                          {dayjs(review.createdAt).format("DD/MM/YYYY")}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50/50 p-5 rounded-2xl border border-gray-100 mb-5 group-hover:bg-white transition-colors duration-200">
                  <p className="text-gray-700 leading-relaxed text-sm font-medium italic">
                    "{review.comment || "Bác tài rất nhiệt tình và vui vẻ, chuyến đi tuyệt vời!"}"
                  </p>
                </div>

                {review.booking && (
                  <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl border border-dotted border-gray-200 group-hover:bg-emerald-50/20 transition-all">
                    <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                      Chuyến đi: {dayjs(review.booking.start_date).format("DD/MM/YYYY")} - {dayjs(review.booking.end_date).format("DD/MM/YYYY")}
                    </div>
                    {review.booking.pickup_location && (
                      <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-gray-400">
                        <MapPin size={10} className="text-red-400 shrink-0" />
                        <span>{review.booking.pickup_location}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8 pb-6">
              <button
                disabled={currentPage === 1}
                onClick={() => paginate(currentPage - 1)}
                className="w-10 h-10 rounded-xl border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white disabled:opacity-20 transition-all"
              >
                &larr;
              </button>

              <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm gap-1">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => paginate(i + 1)}
                    className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${currentPage === i + 1
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-50"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
                      }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                disabled={currentPage === totalPages}
                onClick={() => paginate(currentPage + 1)}
                className="w-10 h-10 rounded-xl border border-gray-100 bg-white flex items-center justify-center text-gray-400 hover:bg-emerald-600 hover:text-white disabled:opacity-20 transition-all"
              >
                &rarr;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverReviews;
