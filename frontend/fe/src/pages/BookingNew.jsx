import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { Calendar, MapPin, CreditCard, AlertCircle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import * as bookingService from "../services/bookingService";
import * as vehicleService from "../services/vehicleService";

const BookingNew = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceInfo, setPriceInfo] = useState(null);
  const [availability, setAvailability] = useState(null);

  const [formData, setFormData] = useState({
    vehicle: searchParams.get("vehicle") || "",
    rental_type: "self_drive",
    start_date: "",
    end_date: "",
    pickup_location: "",
    return_location: "",
    promotion_code: "",
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/bookings/new" + (searchParams.get("vehicle") ? `?vehicle=${searchParams.get("vehicle")}` : ""));
    }
  }, [isAuthenticated, navigate, searchParams]);

  // Load vehicle if vehicle ID provided
  useEffect(() => {
    const vehicleId = searchParams.get("vehicle");
    if (vehicleId) {
      loadVehicle(vehicleId);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  // Calculate price when form data changes
  useEffect(() => {
    if (formData.vehicle && formData.start_date && formData.end_date) {
      calculatePrice();
      checkAvailability();
    }
  }, [formData.vehicle, formData.start_date, formData.end_date, formData.rental_type, formData.promotion_code]);

  const loadVehicle = async (vehicleId) => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleById(vehicleId);
      setVehicle(response.vehicle);
      setFormData((prev) => ({ ...prev, vehicle: vehicleId }));
    } catch (err) {
      setError(err.message || "Failed to load vehicle");
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = async () => {
    try {
      const response = await bookingService.calculatePrice({
        vehicle: formData.vehicle,
        start_date: formData.start_date,
        end_date: formData.end_date,
        rental_type: formData.rental_type,
        promotion_code: formData.promotion_code || undefined,
      });
      setPriceInfo(response);
    } catch (err) {
      console.error("Error calculating price:", err);
    }
  };

  const checkAvailability = async () => {
    try {
      const response = await bookingService.checkAvailability({
        vehicle: formData.vehicle,
        start_date: formData.start_date,
        end_date: formData.end_date,
      });
      setAvailability(response);
    } catch (err) {
      console.error("Error checking availability:", err);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.vehicle || !formData.start_date || !formData.end_date) {
      setError("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (!formData.pickup_location || !formData.return_location) {
      setError("Vui lòng nhập địa điểm nhận và trả xe");
      return;
    }

    if (availability && !availability.available) {
      setError("Xe không có sẵn trong khoảng thời gian đã chọn");
      return;
    }

    try {
      const response = await bookingService.createBooking(formData);
      navigate(`/bookings/${response.booking._id}`);
    } catch (err) {
      setError(err.message || "Đặt xe thất bại");
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          to={vehicle ? `/vehicles/${vehicle._id}` : "/fleet"}
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Quay lại
        </Link>

        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Đặt Xe</h1>

          {vehicle && (
            <div className="bg-gray-50 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4">
                <img
                  src={vehicle.image_urls?.[0] || "/cars/default.jpg"}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div>
                  <h3 className="font-bold text-lg">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-gray-600">{vehicle.year}</p>
                  <p className="text-blue-600 font-semibold">
                    {formatPrice(vehicle.daily_rate)}/ngày
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
              <AlertCircle size={20} />
              {error}
            </div>
          )}

          {availability && !availability.available && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg mb-6">
              ⚠️ Xe không có sẵn trong khoảng thời gian đã chọn
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rental Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Loại thuê xe *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="rental_type"
                    value="self_drive"
                    checked={formData.rental_type === "self_drive"}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-semibold">Tự lái</p>
                    <p className="text-sm text-gray-500">Bạn tự lái xe</p>
                  </div>
                </label>
                <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="rental_type"
                    value="with_driver"
                    checked={formData.rental_type === "with_driver"}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-semibold">Có tài xế</p>
                    <p className="text-sm text-gray-500">Có tài xế đi kèm (+500k/ngày)</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Ngày nhận xe *
                </label>
                <input
                  type="datetime-local"
                  name="start_date"
                  value={formData.start_date}
                  onChange={handleChange}
                  required
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar size={16} className="inline mr-1" />
                  Ngày trả xe *
                </label>
                <input
                  type="datetime-local"
                  name="end_date"
                  value={formData.end_date}
                  onChange={handleChange}
                  required
                  min={formData.start_date || new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Locations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Địa điểm nhận xe *
                </label>
                <input
                  type="text"
                  name="pickup_location"
                  value={formData.pickup_location}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ nhận xe"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <MapPin size={16} className="inline mr-1" />
                  Địa điểm trả xe *
                </label>
                <input
                  type="text"
                  name="return_location"
                  value={formData.return_location}
                  onChange={handleChange}
                  placeholder="Nhập địa chỉ trả xe"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Promotion Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mã khuyến mãi (nếu có)
              </label>
              <input
                type="text"
                name="promotion_code"
                value={formData.promotion_code}
                onChange={handleChange}
                placeholder="Nhập mã khuyến mãi"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Price Summary */}
            {priceInfo && (
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  Tóm tắt thanh toán
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Giá cơ bản ({priceInfo.days} ngày):</span>
                    <span className="font-semibold">{formatPrice(priceInfo.baseAmount)}</span>
                  </div>
                  {priceInfo.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(priceInfo.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-blue-200">
                    <span>Tổng tiền:</span>
                    <span className="text-blue-600">{formatPrice(priceInfo.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 pt-2">
                    <span>Tiền cọc (30%):</span>
                    <span>{formatPrice(priceInfo.depositAmount)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!priceInfo || (availability && !availability.available)}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-bold text-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl"
            >
              Xác nhận đặt xe
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingNew;
