import { Link } from "react-router-dom";
import { Users, Gauge, Fuel } from "lucide-react";

const FleetCard = ({ vehicle }) => {
  if (!vehicle) return null;

  const vehicleType = vehicle.vehicle_type || {};
  const imageUrl =
    vehicle.image_urls && vehicle.image_urls.length > 0
      ? vehicle.image_urls[0]
      : "/cars/default.jpg";

  // Format price
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm hover:shadow-lg transition overflow-hidden">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={imageUrl}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="h-full w-full object-cover hover:scale-105 transition duration-500"
          onError={(e) => {
            e.target.src = "/cars/default.jpg";
          }}
        />
        <span className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white capitalize">
          {vehicleType.category || vehicleType.type_name || "N/A"}
        </span>
        {vehicle.status === "available" && (
          <span className="absolute top-3 left-3 rounded-full bg-green-500 px-3 py-1 text-[11px] text-white">
            Có sẵn
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">
            {vehicle.brand} {vehicle.model}
          </h3>
          <span className="text-xs text-gray-500">{vehicle.year}</span>
        </div>

        {/* Specs */}
        <div className="flex gap-4 text-xs text-gray-500 mb-4">
          {vehicleType.seat_capacity && (
            <span className="flex items-center gap-1">
              <Users size={14} /> {vehicleType.seat_capacity} Chỗ
            </span>
          )}
          {vehicleType.transmission && (
            <span className="flex items-center gap-1">
              <Gauge size={14} />{" "}
              {vehicleType.transmission === "auto" ? "Tự động" : "Số sàn"}
            </span>
          )}
          {vehicleType.fuel_type && (
            <span className="flex items-center gap-1">
              <Fuel size={14} />{" "}
              {vehicleType.fuel_type === "gasoline"
                ? "Xăng"
                : vehicleType.fuel_type === "diesel"
                ? "Diesel"
                : vehicleType.fuel_type === "electric"
                ? "Điện"
                : vehicleType.fuel_type === "hybrid"
                ? "Hybrid"
                : vehicleType.fuel_type}
            </span>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Giá thuê/ngày</p>
            <p className="text-lg font-bold text-gray-900">
              {formatPrice(vehicle.daily_rate)}
            </p>
          </div>

          <Link
            to={`/vehicles/${vehicle._id}`}
            className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition"
          >
            Chi tiết →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FleetCard;
