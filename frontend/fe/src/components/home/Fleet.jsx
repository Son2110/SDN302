import { useState, useEffect } from "react";
import { getAllVehicles } from "../../services/vehicleApi";
import { Link } from "react-router-dom";

const Fleet = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTopVehicles = async () => {
      try {
        setLoading(true);
        const data = await getAllVehicles();

        // Keep only the first 4 vehicles with available status.
        const topVehicles = data
          .filter((v) => v.status === "available")
          .slice(0, 4);

        setVehicles(topVehicles);
      } catch (error) {
        console.error("Failed to fetch vehicles:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopVehicles();
  }, []);

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.35em] text-blue-600 font-semibold uppercase mb-3">
              Exclusive Collection
            </p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 uppercase">
              Featured Fleet
            </h2>
            <div className="w-20 h-1 bg-blue-600 mx-auto mt-4" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-56 bg-gray-200 rounded-2xl mb-4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.35em] text-blue-600 font-semibold uppercase mb-3">
            Exclusive Collection
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 uppercase">
            Featured Fleet
          </h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-4" />
        </div>

        {/* Fleet cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {vehicles.map((car) => (
            <Link
              key={car._id}
              to={`/fleet/${car._id}`}
              className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
            >
              {/* Image Area */}
              <div className="relative h-56 flex items-center justify-center bg-gray-50 overflow-hidden">
                <img
                  src={car.image_urls?.[0] || "/placeholder-car.jpg"}
                  alt={`${car.brand} ${car.model}`}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />

                <span className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                  {car.vehicle_type?.category === "luxury"
                    ? "LUXURY"
                    : car.vehicle_type?.category === "suv"
                      ? "SUV"
                      : car.vehicle_type?.category === "van"
                        ? "VAN"
                        : "SEDAN"}
                </span>
              </div>

              {/* Content Area */}
              <div className="p-6">
                <h3 className="font-bold text-xl text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {car.brand} {car.model}
                </h3>

                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                      Starting from
                    </span>
                    <span className="text-lg font-black text-blue-600">
                      {car.daily_rate.toLocaleString("vi-VN")}{" "}
                      <span className="text-xs font-normal text-gray-500">
                        VND/day
                      </span>
                    </span>
                  </div>

                  <button className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors duration-300">
                    Book now
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-16">
          <Link
            to="/fleet"
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-all"
          >
            View all vehicles
            <span className="group-hover:translate-x-2 transition-transform">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Fleet;
