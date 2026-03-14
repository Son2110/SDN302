import { useState, useMemo, useEffect } from "react";
import { getAllVehicles } from "../services/vehicleApi";
import FleetHeader from "../components/fleet/FleetHeader";
import FleetGrid from "../components/fleet/FleetGrid";
import FleetFilters from "../components/fleet/FleetFilters";

const FleetPage = () => {
  // 1. Khai báo các State để lưu giá trị bộ lọc
  const [type, setType] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("recommended");

  // 2. State cho vehicles data từ API
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 3. Fetch vehicles từ API khi component mount
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const data = await getAllVehicles();
        // Transform backend data sang format FleetCard expect
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
              ? "Tự động"
              : "Số sàn",
          fuel:
            vehicle.vehicle_type?.fuel_type === "electric"
              ? "Điện"
              : vehicle.vehicle_type?.fuel_type === "hybrid"
                ? "Hybrid"
                : vehicle.vehicle_type?.fuel_type === "diesel"
                  ? "Dầu"
                  : "Xăng",
          rating: 4.5, // Default rating - có thể tính từ reviews sau
          status: vehicle.status,
        }));
        setVehicles(transformed);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
        setError("Không thể tải danh sách xe. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, []);

  // 4. Hàm xử lý logic lọc (Cực kỳ quan trọng)
  const filteredVehicles = useMemo(() => {
    let result = [...vehicles];

    // Lọc theo loại xe (category: suv, mini...)
    if (type) {
      result = result.filter((car) => car.category === type);
    }

    // Lọc theo số chỗ ngồi
    if (seats) {
      result = result.filter((car) => car.seats === parseInt(seats));
    }

    // Lọc theo khoảng giá (Chuyển chuỗi "1.200.000" thành số để so sánh)
    if (price) {
      result = result.filter((car) => {
        const priceNum = parseInt(car.price.replace(/\./g, ""));
        if (price === "0-1") return priceNum < 1000000;
        if (price === "1-2") return priceNum >= 1000000 && priceNum <= 2000000;
        if (price === "2+") return priceNum > 2000000;
        return true;
      });
    }

    // Logic Sắp xếp
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
            Thử lại
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F9FAFB] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <FleetHeader />

        {/* Truyền các hàm set vào để Filters có thể thay đổi state của Cha */}
        <FleetFilters
          setType={setType}
          setSeats={setSeats}
          setPrice={setPrice}
          setSort={setSort}
        />

        {/* Truyền danh sách xe đã được lọc xuống Grid */}
        <FleetGrid data={filteredVehicles} />
      </div>
    </main>
  );
};

export default FleetPage;
