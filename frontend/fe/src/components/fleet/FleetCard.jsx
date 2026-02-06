import { Users, Gauge, Fuel } from "lucide-react";

const FleetCard = ({ car }) => {
  return (
    <div className="rounded-2xl bg-white shadow-sm hover:shadow-lg transition overflow-hidden">
      {/* Image */}
      <div className="relative h-44 overflow-hidden">
        <img
          src={car.image}
          alt={car.name}
          className="h-full w-full object-cover hover:scale-105 transition duration-500"
        />
        <span className="absolute top-3 right-3 rounded-full bg-black/70 px-3 py-1 text-[11px] text-white">
          {car.type}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-bold text-gray-900">{car.name}</h3>
          <span className="text-xs text-yellow-500 font-semibold">
            ★ {car.rating}
          </span>
        </div>

        {/* Specs */}
        <div className="flex gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1">
            <Users size={14} /> {car.seats} Seats
          </span>
          <span className="flex items-center gap-1">
            <Gauge size={14} /> {car.transmission}
          </span>
          <span className="flex items-center gap-1">
            <Fuel size={14} /> {car.fuel}
          </span>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400">Daily Rate</p>
            <p className="text-lg font-bold text-gray-900">
              ${car.price}
              <span className="text-sm font-normal text-gray-500"> / day</span>
            </p>
          </div>

          <button className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700">
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
};

export default FleetCard;
