import { useState, useMemo } from "react";

import { fleetData } from "../../data/fleetData"; // Import dữ liệu gốc tại đây
import FleetHeader from "../components/fleet/FleetHeader";
import FleetGrid from "../components/fleet/FleetGrid";
import FleetFilters from "../components/fleet/FleetFilters"
const FleetPage = () => {
  // 1. Khai báo các State để lưu giá trị bộ lọc
  const [type, setType] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");
  const [sort, setSort] = useState("recommended");

  // 2. Hàm xử lý logic lọc (Cực kỳ quan trọng)
  const filteredVehicles = useMemo(() => {
    let result = [...fleetData];

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
      result.sort((a, b) => parseInt(a.price.replace(/\./g, "")) - parseInt(b.price.replace(/\./g, "")));
    } else if (sort === "price-high") {
      result.sort((a, b) => parseInt(b.price.replace(/\./g, "")) - parseInt(a.price.replace(/\./g, "")));
    } else if (sort === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    }

    return result;
  }, [type, seats, price, sort]);

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