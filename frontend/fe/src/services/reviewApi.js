const API_URL = import.meta.env.VITE_API_URL;
import { getToken } from "./api";

// POST /api/reviews  (auth: customer)
export const createReview = async (
  bookingId,
  rating,
  reviewType,
  comment = "",
) => {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({
      bookingId,
      rating,
      review_type: reviewType,
      comment,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Không thể gửi đánh giá");
  return data;
};

// GET /api/reviews/booking/:bookingId  (public)
export const getReviewsByBooking = async (bookingId) => {
  const res = await fetch(`${API_URL}/reviews/booking/${bookingId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Không thể lấy đánh giá");
  return data; // { success, data: [] }
};

// GET /api/reviews/driver/:driverId  (public)
export const getDriverReviews = async (driverId) => {
  const res = await fetch(`${API_URL}/reviews/driver/${driverId}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Không thể lấy đánh giá tài xế");
  return data; // { success, data: [], average_rating, total_reviews }
};

// GET /api/reviews/all-driver-reviews  (auth: staff)
export const getAllDriverReviews = async ({ page = 1, limit = 12, search = "", min_rating, max_rating, driver_id } = {}) => {
  const params = new URLSearchParams({ page, limit });
  if (search) params.set("search", search);
  if (min_rating) params.set("min_rating", min_rating);
  if (max_rating) params.set("max_rating", max_rating);
  if (driver_id) params.set("driver_id", driver_id);

  const res = await fetch(`${API_URL}/reviews/all-driver-reviews?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Không thể lấy danh sách đánh giá");
  return data; // { success, data, page, pages, total }
};

// GET /api/reviews/:reviewId  (auth: staff)
export const getReviewById = async (reviewId) => {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Không thể lấy chi tiết review");
  return data; // { success, data }
};

// PUT /api/reviews/:reviewId  (auth: customer)
export const updateReview = async (reviewId, rating, comment) => {
  const res = await fetch(`${API_URL}/reviews/${reviewId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ rating, comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Không thể sửa đánh giá");
  return data;
};
