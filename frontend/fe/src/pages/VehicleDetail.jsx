import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Users, Gauge, Fuel, Calendar, MapPin, CheckCircle } from "lucide-react";
import * as vehicleService from "../services/vehicleService";
import { useAuth } from "../contexts/AuthContext";

const VehicleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const response = await vehicleService.getVehicleById(id);
        setVehicle(response.vehicle);
      } catch (err) {
        setError(err.message || "Không tìm thấy xe");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

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

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-lg mb-4">{error || "Không tìm thấy xe"}</div>
          <Link
            to="/fleet"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Quay lại danh sách xe
          </Link>
        </div>
      </div>
    );
  }

  const vehicleType = vehicle.vehicle_type || {};
  const images = vehicle.image_urls && vehicle.image_urls.length > 0 
    ? vehicle.image_urls 
    : ["/cars/default.jpg"];

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Back Button */}
        <Link
          to="/fleet"
          className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          ← Quay lại danh sách
        </Link>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-white shadow-lg">
              <img
                src={images[0]}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-96 object-cover"
                onError={(e) => {
                  e.target.src = "/cars/default.jpg";
                }}
              />
            </div>
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {images.slice(1, 5).map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt={`${vehicle.brand} ${vehicle.model} ${idx + 2}`}
                    className="w-full h-20 object-cover rounded-lg cursor-pointer hover:opacity-75"
                    onError={(e) => {
                      e.target.src = "/cars/default.jpg";
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">
                  {vehicle.brand} {vehicle.model}
                </h1>
                {vehicle.status === "available" && (
                  <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-semibold flex items-center gap-1">
                    <CheckCircle size={14} />
                    Có sẵn
                  </span>
                )}
              </div>
              <p className="text-gray-600">
                {vehicle.year} • {vehicleType.type_name || vehicleType.category || "N/A"}
              </p>
            </div>

            {/* Price */}
            <div className="bg-blue-50 rounded-xl p-6">
              <p className="text-sm text-gray-600 mb-1">Giá thuê/ngày</p>
              <p className="text-3xl font-bold text-blue-600">
                {formatPrice(vehicle.daily_rate)}
              </p>
            </div>

            {/* Specs */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Thông số kỹ thuật</h2>
              <div className="grid grid-cols-2 gap-4">
                {vehicleType.seat_capacity && (
                  <div className="flex items-center gap-3">
                    <Users className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Số chỗ ngồi</p>
                      <p className="font-semibold">{vehicleType.seat_capacity} chỗ</p>
                    </div>
                  </div>
                )}
                {vehicleType.transmission && (
                  <div className="flex items-center gap-3">
                    <Gauge className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Hộp số</p>
                      <p className="font-semibold">
                        {vehicleType.transmission === "auto" ? "Tự động" : "Số sàn"}
                      </p>
                    </div>
                  </div>
                )}
                {vehicleType.fuel_type && (
                  <div className="flex items-center gap-3">
                    <Fuel className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Nhiên liệu</p>
                      <p className="font-semibold capitalize">
                        {vehicleType.fuel_type === "gasoline"
                          ? "Xăng"
                          : vehicleType.fuel_type === "diesel"
                          ? "Diesel"
                          : vehicleType.fuel_type === "electric"
                          ? "Điện"
                          : vehicleType.fuel_type === "hybrid"
                          ? "Hybrid"
                          : vehicleType.fuel_type}
                      </p>
                    </div>
                  </div>
                )}
                {vehicle.current_mileage && (
                  <div className="flex items-center gap-3">
                    <Gauge className="text-gray-400" size={20} />
                    <div>
                      <p className="text-sm text-gray-500">Số km</p>
                      <p className="font-semibold">
                        {vehicle.current_mileage.toLocaleString()} km
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Thông tin bổ sung</h2>
              <div className="space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Biển số:</span>{" "}
                  <span className="font-semibold">{vehicle.license_plate}</span>
                </p>
                {vehicle.color && (
                  <p>
                    <span className="text-gray-500">Màu sắc:</span>{" "}
                    <span className="font-semibold capitalize">{vehicle.color}</span>
                  </p>
                )}
                <p>
                  <span className="text-gray-500">Trạng thái:</span>{" "}
                  <span className="font-semibold capitalize">
                    {vehicle.status === "available"
                      ? "Có sẵn"
                      : vehicle.status === "rented"
                      ? "Đang được thuê"
                      : "Bảo trì"}
                  </span>
                </p>
                {vehicle.is_electric && (
                  <p className="text-green-600 font-semibold">⚡ Xe điện</p>
                )}
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to={`/bookings/new?vehicle=${vehicle._id}`}
              className={`w-full rounded-xl px-6 py-4 text-lg font-bold text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition shadow-lg hover:shadow-xl text-center block ${
                vehicle.status === "available"
                  ? "bg-blue-600"
                  : "bg-gray-400 cursor-not-allowed pointer-events-none"
              }`}
            >
              {vehicle.status === "available"
                ? "Đặt xe ngay"
                : "Xe không có sẵn"}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleDetail;
