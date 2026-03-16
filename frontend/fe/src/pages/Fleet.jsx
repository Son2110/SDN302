import { useState, useMemo, useEffect } from "react";
import { getAllVehicles } from "../services/vehicleApi";
import FleetHeader from "../components/fleet/FleetHeader";
import FleetGrid from "../components/fleet/FleetGrid";
import FleetFilters from "../components/fleet/FleetFilters";

const FleetPage = () => {
  // 1. Filter state
  const [type, setType] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("recommended");

  // 2. Vehicles state from API
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch vehicles when component mounts
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const data = await getAllVehicles();
        // Transform backend data to FleetCard format
        const transformed = data.map((vehicle) => ({
          id: vehicle._id,
          name: `${vehicle.brand} ${vehicle.model}`,
          image: vehicle.image_urls?.[0] || "/placeholder-car.jpg",
          price: vehicle.daily_rate.toLocaleString("vi-VN"),
          type:
            vehicle.vehicle_type?.type_name ||
            vehicle.vehicle_type?.category ||
            "sedan",
          category: vehicle.vehicle_type?.category || "sedan",
          seats: vehicle.vehicle_type?.seat_capacity || 4,
          transmission:
            vehicle.vehicle_type?.transmission === "auto"
              ? "Automatic"
              : "Manual",
          fuel:
            vehicle.vehicle_type?.fuel_type === "electric"
              ? "Electric"
              : vehicle.vehicle_type?.fuel_type === "hybrid"
                ? "Hybrid"
                : vehicle.vehicle_type?.fuel_type === "diesel"
                  ? "Diesel"
                  : "Gasoline",
          rating: 4.5,
          status: vehicle.status,
        }));
        setVehicles(transformed);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
        setError("Unable to load vehicle list. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // 4. Filtering logic
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // Filter by type
    if (type) {
      result = result.filter((car) => car.category === type);
    }

    // Filter by seats
    if (seats) {
      result = result.filter((car) => car.seats === parseInt(seats));
    }

    // Filter by price range
    if (price) {
      result = result.filter((car) => {
        const priceNum = parseInt(car.price.replace(/\./g, ""));
        if (price === "0-1") return priceNum < 1000000;
        if (price === "1-2") return priceNum >= 1000000 && priceNum <= 2000000;
        if (price === "2+") return priceNum > 2000000;
        return true;
      });
    }

    // Sort logic
    if (sort === "price-low") {
      result.sort(
        (a, b) =>
          parseInt(a.price.replace(/\./g, "")) -
          parseInt(b.price.replace(/\./g, "")),
      );
    } else if (sort === "price-high") {
      result.sort(
        (a, b) =>
          parseInt(b.price.replace(/\./g, "")) -
          parseInt(a.price.replace(/\./g, "")),
      );
    } else if (sort === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [vehicles, type, seats, price, sort]);

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-96 mx-auto"></div>
          </div>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-[#F9FAFB] pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-red-500 font-medium">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <FleetHeader />

        {/* Pass setters so filters can update parent state */}
        <FleetFilters
          setType={setType}
          setSeats={setSeats}
          setPrice={setPrice}
          setSort={setSort}
        />

        {/* Pass filtered vehicles to grid */}
        <FleetGrid data={filteredVehicles} />
      </div>
    </main>
  );
};

export default FleetPage;
