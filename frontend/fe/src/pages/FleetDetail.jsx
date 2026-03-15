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

  // Fetch vehicle detail từ API
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const data = await getVehicleById(id);
        setCar(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch vehicle:", err);
        setError("Không thể tải thông tin xe. Vui lòng thử lại sau.");
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
            {error || "Xe không tồn tại trong hệ thống."}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Quay lại
          </button>
        </div>
      </div>
    );
  }
  // Car data đã có từ API, không cần transform

  return (
    <div className="bg-[#F8F9FB] pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <button
          onClick={() => navigate(-1)} // Quay lại trang trước đó
          className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
        >
          <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Quay lại danh sách
        </button>
        {/* ===== GRID CHÍNH ===== */}
        <div className="grid lg:grid-cols-3 gap-12">
          {/* CỘT TRÁI: ẢNH & THÔNG TIN CHI TIẾT */}
          <div className="lg:col-span-2">
            {/* Ảnh chính */}
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

            {/* Gallery ảnh nhỏ */}
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

            {/* Tiêu đề xe */}
            <div className="mt-10 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {car.brand} {car.model}
                </h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-yellow-500 font-bold">★ 4.5</span>
                  <span className="text-gray-400 text-sm">(128 Đánh giá)</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 text-sm font-medium">
                    Đời {car.year || 2024}
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

            {/* Thông số kỹ thuật (Grid 4 cột) */}
            <div className="mt-10">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-6">
                Thông số chính
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <SpecItem
                  icon={<Gauge size={20} />}
                  label="Tình trạng"
                  value={
                    car.status === "available"
                      ? "Sẵn sàng"
                      : car.status === "rented"
                        ? "Đang thuê"
                        : "Bảo trì"
                  }
                />
                <SpecItem
                  icon={<Users size={20} />}
                  label="Số chỗ"
                  value={`${car.vehicle_type?.seat_capacity || 4} người`}
                />
                <SpecItem
                  icon={<Fuel size={20} />}
                  label="Nhiên liệu"
                  value={
                    car.vehicle_type?.fuel_type === "electric"
                      ? "Điện"
                      : car.vehicle_type?.fuel_type === "hybrid"
                        ? "Hybrid"
                        : car.vehicle_type?.fuel_type === "diesel"
                          ? "Dầu"
                          : "Xăng"
                  }
                />
                <SpecItem
                  icon={<Settings2 size={20} />}
                  label="Hộp số"
                  value={
                    car.vehicle_type?.transmission === "auto"
                      ? "Tự động"
                      : "Số sàn"
                  }
                />
              </div>
            </div>

            {/* Mô tả & Features */}
            <div className="grid md:grid-cols-2 gap-12 mt-12 border-t pt-10">
              <div>
                <h3 className="text-lg font-bold mb-4">Thông tin xe</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  Xe {car.brand} {car.model} đời {car.year || "2024"}, biển số{" "}
                  {car.license_plate}, màu {car.color || "trắng"}.
                  {car.is_electric &&
                    " Xe điện 100% thân thiện với môi trường."}
                  {car.vehicle_type?.battery_capacity_kwh &&
                    ` Pin ${car.vehicle_type.battery_capacity_kwh} kWh.`}
                  {car.current_mileage > 0 &&
                    ` Số km đã đi: ${car.current_mileage.toLocaleString("vi-VN")} km.`}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Tính năng</h3>
                <ul className="grid grid-cols-1 gap-3">
                  <FeatureItem text="Hệ thống định vị GPS" />
                  <FeatureItem text="Bluetooth Audio" />
                  <FeatureItem text="Cảm biến lùi hỗ trợ đỗ xe" />
                  {car.is_electric && (
                    <FeatureItem text="Xe điện - Tiết kiệm chi phí" />
                  )}
                  {car.vehicle_type?.charging_cost_per_kwh && (
                    <FeatureItem
                      text={`Chi phí sạc: ${car.vehicle_type.charging_cost_per_kwh.toLocaleString("vi-VN")}đ/kWh`}
                    />
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BOX ĐẶT XE (STICKY) */}
          <div className="relative">
            <BookingCard car={car} />
          </div>
        </div>

        {/* ===== XE TƯƠNG TỰ ===== */}
        {/* TODO: Fetch similar vehicles from API based on category */}
        {/* <div className="mt-24 border-t pt-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                Có thể bạn sẽ thích
              </h3>
              <p className="text-gray-500 mt-2">
                Khám phá thêm những mẫu xe sang trọng khác trong đội xe của
                chúng tôi.
              </p>
            </div>
            <Link
              to="/fleet"
              className="text-blue-600 font-bold flex items-center gap-2 hover:gap-3 transition-all"
            >
              Xem tất cả <span className="text-xl">→</span>
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
