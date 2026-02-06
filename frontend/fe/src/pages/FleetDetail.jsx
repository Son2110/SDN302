import { useParams, Link, useNavigate } from "react-router-dom";
import { fleetData } from "../../data/fleetData";
// Bạn có thể cài lucide-react để lấy icon cho giống mẫu: npm install lucide-react
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
  const car = fleetData.find((item) => item.id === Number(id));
  const navigate = useNavigate();
  if (!car) {
    return (
      <div className="pt-32 text-center text-xl font-medium">
        Xe không tồn tại trong hệ thống.
      </div>
    );
  }

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
                Luxury Class
              </span>
              <img
                src={car.image}
                alt={car.name}
                className="w-full h-[450px] object-contain p-8"
              />
            </div>

            {/* Gallery ảnh nhỏ */}
            <div className="flex gap-4 mt-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="h-24 w-32 bg-white rounded-2xl shadow-sm border border-gray-100 p-2 cursor-pointer hover:border-blue-500 transition-all"
                >
                  <img
                    src={car.image}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
              ))}
            </div>

            {/* Tiêu đề xe */}
            <div className="mt-10 flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-bold text-gray-900">{car.name}</h1>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-yellow-500 font-bold">
                    ★ {car.rating}
                  </span>
                  <span className="text-gray-400 text-sm">(128 Đánh giá)</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-500 text-sm font-medium">
                    Đời 2024
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500 text-sm font-medium">
                    {car.type}
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
                  label="0-100 km/h"
                  value="4.4 giây"
                />
                <SpecItem
                  icon={<Users size={20} />}
                  label="Số chỗ"
                  value={`${car.seats} người`}
                />
                <SpecItem
                  icon={<Fuel size={20} />}
                  label="Nhiên liệu"
                  value={car.fuel}
                />
                <SpecItem
                  icon={<Settings2 size={20} />}
                  label="Hộp số"
                  value={car.transmission}
                />
              </div>
            </div>

            {/* Mô tả & Features */}
            <div className="grid md:grid-cols-2 gap-12 mt-12 border-t pt-10">
              <div>
                <h3 className="text-lg font-bold mb-4">Mô tả chi tiết</h3>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {car.description ||
                    "Trải nghiệm đỉnh cao của sự sang trọng với dòng xe này. Nội thất được thiết kế thủ công tinh xảo, công nghệ tiên tiến mang lại cảm giác lái êm ái tuyệt đối."}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-bold mb-4">Tính năng cao cấp</h3>
                <ul className="grid grid-cols-1 gap-3">
                  <FeatureItem text="Hệ thống âm thanh vòm 4D" />
                  <FeatureItem text="Ghế da Nappa massage" />
                  <FeatureItem text="Cửa sổ trời toàn cảnh" />
                  <FeatureItem text="Điều hướng thực tế ảo MBUX" />
                </ul>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: BOX ĐẶT XE (STICKY) */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100 sticky top-32">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <p className="text-gray-400 text-xs font-bold uppercase mb-1">
                    Giá thuê ngày
                  </p>
                  <span className="text-3xl font-black text-gray-900">
                    ${car.price}
                  </span>
                  <span className="text-gray-500 font-medium"> / ngày</span>
                </div>
                <span className="bg-green-50 text-green-600 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wide">
                  Sẵn sàng
                </span>
              </div>

              <div className="space-y-5">
                <InputGroup
                  label="Điểm đón"
                  placeholder="Thành phố hoặc Sân bay"
                />
                <div className="grid grid-cols-2 gap-4">
                  <InputGroup label="Ngày bắt đầu" type="date" />
                  <InputGroup label="Ngày kết thúc" type="date" />
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-dashed border-gray-200 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Giá cơ bản</span>
                  <span className="font-bold">${car.price}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Bảo hiểm xe</span>
                  <span className="font-bold">$50</span>
                </div>
                <div className="flex justify-between items-center pt-4">
                  <span className="text-lg font-bold">Tổng cộng</span>
                  <span className="text-2xl font-black text-blue-600">
                    ${Number(car.price) + 50}
                  </span>
                </div>
              </div>

              <button className="mt-8 w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3">
                ĐẶT XE NGAY <span>→</span>
              </button>
            </div>
          </div>
        </div>

        {/* ===== XE TƯƠNG TỰ ===== */}
        <div className="mt-24 border-t pt-20">
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

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {fleetData
              .filter((item) => item.id !== car.id)
              .slice(0, 3)
              .map((item) => (
                <SimilarCarCard key={item.id} item={item} />
              ))}
          </div>
        </div>
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

const InputGroup = ({ label, ...props }) => (
  <div>
    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
      {label}
    </label>
    <input
      {...props}
      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
    />
  </div>
);

const SimilarCarCard = ({ item }) => (
  <div className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden">
    <div className="p-2">
      <div className="bg-gray-50 rounded-2xl p-6 flex justify-center items-center h-48 overflow-hidden">
        <img
          src={item.image}
          alt={item.name}
          className="h-full object-contain group-hover:scale-110 transition-transform duration-500"
        />
      </div>
    </div>
    <div className="p-6">
      <h4 className="font-bold text-lg text-gray-900">{item.name}</h4>
      <p className="text-gray-500 text-sm mt-1 font-medium">
        ${item.price} <span className="text-xs">/ ngày</span>
      </p>
      <Link
        to={`/fleet/${item.id}`}
        className="mt-6 block w-full text-center py-3 rounded-xl border border-gray-200 font-bold text-sm group-hover:bg-gray-900 group-hover:text-white group-hover:border-gray-900 transition-all"
      >
        Chi tiết
      </Link>
    </div>
  </div>
);

export default FleetDetail;
