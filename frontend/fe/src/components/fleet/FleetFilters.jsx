// FleetFilters.jsx

// Thêm export default ở ngay trước const hoặc ở cuối file
const FleetFilters = ({ setType, setSeats, setPrice, setSort }) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-10">
      {/* Bộ lọc loại xe */}
      <select 
        onChange={(e) => setType(e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 outline-none shadow-sm focus:border-blue-500"
      >
        <option value="">Loại xe (Tất cả)</option>
        <option value="suv">SUV / Crossover</option>
        <option value="mini">Xe Đô thị (Mini)</option>
      </select>

      {/* Bộ lọc số chỗ ngồi */}
      <select 
        onChange={(e) => setSeats(e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 outline-none shadow-sm focus:border-blue-500"
      >
        <option value="">Số chỗ ngồi</option>
        <option value="4">4 Chỗ</option>
        <option value="5">5 Chỗ</option>
        <option value="7">7 Chỗ</option>
      </select>

      {/* Bộ lọc khoảng giá */}
      <select 
        onChange={(e) => setPrice(e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 outline-none shadow-sm focus:border-blue-500"
      >
        <option value="">Khoảng giá thuê</option>
        <option value="0-1">Dưới 1 triệu / ngày</option>
        <option value="1-2">1 - 2 triệu / ngày</option>
        <option value="2+">Trên 2 triệu / ngày</option>
      </select>

      {/* Sắp xếp */}
      <div className="md:ml-auto w-full md:w-auto">
        <select 
          onChange={(e) => setSort(e.target.value)}
          className="w-full md:w-auto rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 outline-none shadow-sm"
        >
          <option value="recommended">Sắp xếp: Phổ biến nhất</option>
          <option value="price-low">Giá: Thấp đến Cao</option>
          <option value="price-high">Giá: Cao đến Thấp</option>
          <option value="rating">Đánh giá cao nhất</option>
        </select>
      </div>
    </div>
  );
};

// QUAN TRỌNG: Dòng này phải có nếu bạn import FleetFilters từ file khác
export default FleetFilters;