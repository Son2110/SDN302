// FleetFilters.jsx

const FleetFilters = ({ setType, setSeats, setPrice, setSort }) => {
  return (
    <div className="flex flex-wrap items-center gap-4 mb-10">
      {/* Vehicle type filter */}
      <select
        onChange={(e) => setType(e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 outline-none shadow-sm focus:border-blue-500"
      >
        <option value="">Vehicle type (All)</option>
        <option value="suv">SUV / Crossover</option>
        <option value="mini">City Car (Mini)</option>
      </select>

      {/* Seat capacity filter */}
      <select
        onChange={(e) => setSeats(e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 outline-none shadow-sm focus:border-blue-500"
      >
        <option value="">Seats</option>
        <option value="4">4 Seats</option>
        <option value="5">5 Seats</option>
        <option value="7">7 Seats</option>
      </select>

      {/* Price range filter */}
      <select
        onChange={(e) => setPrice(e.target.value)}
        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm text-gray-600 outline-none shadow-sm focus:border-blue-500"
      >
        <option value="">Rental price range</option>
        <option value="0-1">Below 1 million / day</option>
        <option value="1-2">1 - 2 million / day</option>
        <option value="2+">Above 2 million / day</option>
      </select>

      {/* Sorting */}
      <div className="md:ml-auto w-full md:w-auto">
        <select
          onChange={(e) => setSort(e.target.value)}
          className="w-full md:w-auto rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 outline-none shadow-sm"
        >
          <option value="recommended">Sort: Most popular</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="rating">Highest rating</option>
        </select>
      </div>
    </div>
  );
};

export default FleetFilters;