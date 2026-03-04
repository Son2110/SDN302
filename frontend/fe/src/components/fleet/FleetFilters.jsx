const FleetFilters = ({ vehicleTypes, filters, onFilterChange }) => {
  const handleChange = (key, value) => {
    onFilterChange({ [key]: value === "" ? undefined : value });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mb-10">
      {/* Vehicle Type Filter */}
      <select
        value={filters.vehicle_type || ""}
        onChange={(e) => handleChange("vehicle_type", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả loại xe</option>
        {vehicleTypes.map((type) => (
          <option key={type._id} value={type._id}>
            {type.type_name}
          </option>
        ))}
      </select>

      {/* Category Filter */}
      <select
        value={filters.category || ""}
        onChange={(e) => handleChange("category", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Tất cả danh mục</option>
        <option value="sedan">Sedan</option>
        <option value="suv">SUV</option>
        <option value="van">Van</option>
        <option value="luxury">Luxury</option>
      </select>

      {/* Brand Filter */}
      <input
        type="text"
        placeholder="Tìm theo hãng xe..."
        value={filters.brand || ""}
        onChange={(e) => handleChange("brand", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Price Range */}
      <div className="flex items-center gap-2">
        <input
          type="number"
          placeholder="Giá min"
          value={filters.min_price || ""}
          onChange={(e) => handleChange("min_price", e.target.value)}
          className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-gray-400">-</span>
        <input
          type="number"
          placeholder="Giá max"
          value={filters.max_price || ""}
          onChange={(e) => handleChange("max_price", e.target.value)}
          className="w-24 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Tìm kiếm..."
        value={filters.search || ""}
        onChange={(e) => handleChange("search", e.target.value)}
        className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Clear Filters */}
      {(filters.vehicle_type ||
        filters.category ||
        filters.brand ||
        filters.min_price ||
        filters.max_price ||
        filters.search) && (
        <button
          onClick={() =>
            onFilterChange({
              vehicle_type: undefined,
              category: undefined,
              brand: undefined,
              min_price: undefined,
              max_price: undefined,
              search: undefined,
            })
          }
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
};

export default FleetFilters;
