import { useState, useEffect, useRef } from "react";
import { getAllVehicles } from "../services/vehicleApi";
import FleetHeader from "../components/fleet/FleetHeader";
import FleetGrid from "../components/fleet/FleetGrid";
import FleetFilters from "../components/fleet/FleetFilters";

const CATEGORY_LABELS = {
  sedan: "Sedan",
  suv: "SUV",
  van: "Van",
  luxury: "Luxury",
};

const FUEL_LABELS = {
  electric: "Electric",
  hybrid: "Hybrid",
  diesel: "Diesel",
  gasoline: "Gasoline",
};

const FleetPage = () => {
  // 1. Filter state
  const [type, setType] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("recommended");

  // 2. Vehicles state from API
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFiltering, setIsFiltering] = useState(false);
  const [error, setError] = useState(null);
  const requestIdRef = useRef(0);

  // 3. Fetch vehicles from API whenever filter/sort changes (debounced + race-safe)
  useEffect(() => {
    const currentRequestId = ++requestIdRef.current;
    const isInitialLoad = vehicles.length === 0;
    const debounceTimer = setTimeout(async () => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setIsFiltering(true);
        }

        const apiFilters = {
          sort,
        };

        if (type) apiFilters.category = type;
        if (seats) apiFilters.seats = seats;
        if (price) apiFilters.price_range = price;

        const data = await getAllVehicles(apiFilters);
        if (currentRequestId !== requestIdRef.current) return;

        // Transform backend data to FleetCard format
        const transformed = data.map((vehicle) => {
          const category = vehicle.vehicle_type?.category || "sedan";
          const fuelType = vehicle.vehicle_type?.fuel_type || "gasoline";
          const seatCapacity = vehicle.vehicle_type?.seat_capacity || 4;
          const categoryLabel = CATEGORY_LABELS[category] || "Sedan";
          const fuelLabel = FUEL_LABELS[fuelType] || "Gasoline";

          return {
            id: vehicle._id,
            name: `${vehicle.brand} ${vehicle.model}`,
            image: vehicle.image_urls?.[0] || "/placeholder-car.jpg",
            price: vehicle.daily_rate.toLocaleString("vi-VN"),
            type: `${fuelLabel} ${categoryLabel} ${seatCapacity} Seats`.toUpperCase(),
            category,
            seats: seatCapacity,
            transmission:
              vehicle.vehicle_type?.transmission === "auto"
                ? "Automatic"
                : "Manual",
            fuel: fuelLabel,
            rating: 4.5,
            status: vehicle.status,
          };
        });
        setVehicles(transformed);
        setError(null);
      } catch (err) {
        if (currentRequestId !== requestIdRef.current) return;
        console.error("Failed to fetch vehicles:", err);
        setError("Unable to load vehicle list. Please try again later.");
      } finally {
        if (currentRequestId !== requestIdRef.current) return;
        setLoading(false);
        setIsFiltering(false);
      }
    }, 220);

    return () => clearTimeout(debounceTimer);
  }, [type, seats, price, sort]);

  const resetFilters = () => {
    setType("");
    setSeats("");
    setPrice("");
    setSort("recommended");
  };

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
            onClick={resetFilters}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reset filters
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
          type={type}
          seats={seats}
          price={price}
          sort={sort}
          onTypeChange={setType}
          onSeatsChange={setSeats}
          onPriceChange={setPrice}
          onSortChange={setSort}
          onReset={resetFilters}
        />

        {isFiltering && (
          <div className="mb-4 flex items-center justify-center" aria-live="polite">
            <div
              className="h-6 w-6 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600"
              aria-label="Loading"
            />
          </div>
        )}

        <FleetGrid data={vehicles} onReset={resetFilters} />
      </div>
    </main>
  );
};

export default FleetPage;
