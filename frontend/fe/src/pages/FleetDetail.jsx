import { useParams, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { getVehicleById } from "../services/vehicleApi";
import BookingCard from "../components/fleet-detail/BookingCard";
import {
  Users,
  Gauge,
  Fuel,
  Settings2,
  CheckCircle2,
  ChevronLeft,
} from "lucide-react";

const FleetDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [car, setCar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch vehicle details from API
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const data = await getVehicleById(id);
        setCar(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch vehicle:", err);
        setError("Unable to load vehicle details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchVehicle();
    }
  }, [id]);

  // Loading state
  if (loading) {
    return (
      <div className="bg-[#F8F9FB] pt-32 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
            <div className="h-96 bg-gray-200 rounded-2xl mb-6"></div>
            <div className="h-64 bg-gray-200 rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !car) {
    return (
      <div className="bg-[#F8F9FB] pt-32 pb-20 min-h-screen">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-red-500 font-medium mb-4">
            {error || "Vehicle does not exist in the system."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }
  // Car data comes directly from API.

  return (
    <div className="bg-[#F8F9FB] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Back to list
        </button>
        {/* ===== MAIN GRID ===== */}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* LEFT COLUMN: IMAGES & DETAILS */}
          <div className="lg:col-span-2">
            {/* Main image */}
            <div className="relative rounded-3xl overflow-hidden bg-white shadow-sm border border-gray-100">
              <span className="absolute top-4 right-6 bg-black/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                {car.vehicle_type?.category === "luxury"
                  ? "Luxury"
                  : car.vehicle_type?.category === "suv"
                    ? "SUV"
                    : car.vehicle_type?.category === "van"
                      ? "Van"
                      : "Sedan"}
              </span>
              <img
                src={car.image_urls?.[0] || "/placeholder-car.jpg"}
                alt={`${car.brand} ${car.model}`}
                className="w-full h-[450px] object-contain p-8"
              />
            </div>

            {/* Thumbnail gallery */}
            <div className="flex gap-4 mt-6">
              {(car.image_urls || []).slice(0, 4).map((img, i) => (
                <div
                  key={i}
                  className="h-24 w-32 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <img
                    src={img}
                    alt={`${car.brand} ${car.model} view ${i + 1}`}
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>

            {/* Vehicle title */}
            <div className="mt-10 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {car.brand} {car.model}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-gray-500 text-sm font-medium">
                    Year {car.year || 2024}
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 text-sm font-medium">
                    {car.vehicle_type?.type_name ||
                      car.vehicle_type?.category ||
                      "Sedan"}
                  </span>
                </div>
              </div>
            </div>

            {/* Key specs (4-column grid) */}
            <div className="mt-10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">
                Key specifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SpecItem
                  icon={<Gauge size={20} />}
                  label="Status"
                  value={
                    car.status === "available"
                      ? "Available"
                      : car.status === "rented"
                        ? "In progress"
                        : "Maintenance"
                  }
                />
                <SpecItem
                  icon={<Users size={20} />}
                  label="Seats"
                  value={`${car.vehicle_type?.seat_capacity || 4} seats`}
                />
                <SpecItem
                  icon={<Fuel size={20} />}
                  label="Fuel"
                  value={
                    car.vehicle_type?.fuel_type === "electric"
                      ? "Electric"
                      : car.vehicle_type?.fuel_type === "hybrid"
                        ? "Hybrid"
                        : car.vehicle_type?.fuel_type === "diesel"
                          ? "Diesel"
                          : "Gasoline"
                  }
                />
                <SpecItem
                  icon={<Settings2 size={20} />}
                  label="Gear"
                  value={
                    car.vehicle_type?.transmission === "auto"
                      ? "Automatic"
                      : "Manual"
                  }
                />
              </div>
            </div>

            {/* Description and features */}
            <div className="grid md:grid-cols-2 gap-12 mt-12 border-t pt-10">
              <div>
                <h3 className="text-lg font-bold mb-4">Vehicle information</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {car.brand} {car.model}, model year {car.year || "2024"}, license plate{" "}
                  {car.license_plate}, color {car.color || "white"}.
                  {car.is_electric &&
                    " 100% electric and environmentally friendly."}
                  {car.vehicle_type?.battery_capacity_kwh &&
                    ` Battery capacity: ${car.vehicle_type.battery_capacity_kwh} kWh.`}
                  {car.current_mileage > 0 &&
                    ` Current mileage: ${car.current_mileage.toLocaleString("vi-VN")} km.`}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Features</h3>
                <ul className="grid grid-cols-1 gap-3">
                  <FeatureItem text="GPS navigation system" />
                  <FeatureItem text="Bluetooth Audio" />
                  <FeatureItem text="Reverse sensor to assist with parking" />
                  {car.is_electric && (
                    <FeatureItem text="Electric vehicle - Save costs" />
                  )}
                  {car.vehicle_type?.charging_cost_per_kwh && (
                    <FeatureItem
                      text={`Charging cost: ${car.vehicle_type.charging_cost_per_kwh.toLocaleString("vi-VN")} VND/kWh`}
                    />
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Right column: sticky booking card */}
          <div className="relative">
            <BookingCard car={car} />
          </div>
        </div>

        {/* ===== Similar Vehicles ===== */}
        {/* TODO: Fetch similar vehicles from API based on category */}
        {/* <div className="mt-24 border-t pt-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                You may also like
              </h3>
              <p className="text-gray-500 mt-2">
                Explore more premium vehicles in our fleet.
              </p>
            </div>
            <Link
              to="/fleet"
              className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
            >
              View all <span className="text-xl">→</span>
            </Link>
          </div>
        </div> */}
      </div>
    </div>
  );
};

// --- Sub-Components Helper ---

const SpecItem = ({ icon, label, value }) => (
  <div className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col items-center text-center shadow-sm">
    <div className="text-blue-500 bg-blue-50 p-3 rounded-xl mb-3">{icon}</div>
    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
      {label}
    </p>
    <p className="text-sm font-bold text-gray-800 mt-1">{value}</p>
  </div>
);

const FeatureItem = ({ text }) => (
  <li className="flex items-center gap-3 text-sm text-gray-600 font-medium">
    <CheckCircle2 size={18} className="text-blue-500" /> {text}
  </li>
);

export default FleetDetail;
