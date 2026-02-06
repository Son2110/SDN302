import { Users, Gauge, Fuel, Star } from "lucide-react";
import { Link } from "react-router-dom";

const FleetCard = ({ car }) => {
  return (
    <div className="rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden group">
      {/* Image */}
      <div className="relative h-52 overflow-hidden bg-gray-100 flex items-center justify-center">
        <img
          src={car.image}
          alt={car.name}
          className="h-full w-full object-contain p-4 group-hover:scale-110 transition duration-500"
        />
        <span className="absolute top-4 left-4 rounded-lg bg-blue-600 px-3 py-1 text-[10px] font-bold text-white uppercase tracking-wider">
          {car.type}
        </span>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-lg text-gray-900">{car.name}</h3>
          <span className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
            <Star size={14} fill="currentColor" /> {car.rating}
          </span>
        </div>

        {/* Specs - Việt hóa */}
        <div className="grid grid-cols-3 gap-2 text-[11px] text-gray-500 mb-6 border-y border-gray-50 py-3">
          <span className="flex flex-col items-center gap-1">
            <Users size={16} className="text-blue-500" /> {car.seats} Chỗ
          </span>
          <span className="flex flex-col items-center gap-1 border-x border-gray-100">
            <Gauge size={16} className="text-blue-500" /> {car.transmission}
          </span>
          <span className="flex flex-col items-center gap-1">
            <Fuel size={16} className="text-blue-500" /> {car.fuel.split(' ')[0]}
          </span>
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between mt-4">
          <div>
            <p className="text-[10px] text-gray-400 uppercase font-bold tracking-tight">Giá thuê ngày</p>
            <p className="text-lg font-black text-gray-900">
              {car.price}
              <span className="text-xs font-medium text-gray-500"> đ</span>
            </p>
          </div>

          <Link
          to={`/fleet/${car.id}`} 
          className="rounded-xl bg-gray-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-600 transition-colors shadow-lg shadow-gray-200"
        >
          Chi tiết →
        </Link>
        </div>
      </div>
    </div>
  );
};

export default FleetCard;