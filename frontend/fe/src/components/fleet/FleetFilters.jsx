import { SlidersHorizontal, RotateCcw } from "lucide-react";

const FleetFilters = ({
  type,
  seats,
  price,
  sort,
  onTypeChange,
  onSeatsChange,
  onPriceChange,
  onSortChange,
  onReset,
}) => {
  const hasActiveFilters = Boolean(type || seats || price);

  return (
    <div className="mb-10 rounded-2xl border border-gray-200 bg-white p-4 md:p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-gray-700">
          <SlidersHorizontal size={16} className="text-blue-600" />
          <p className="text-sm font-bold uppercase tracking-wider">Smart filters</p>
        </div>

        <button
          type="button"
          onClick={onReset}
          disabled={!hasActiveFilters}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RotateCcw size={14} />
          Clear filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Vehicle type (All)</option>
          <option value="sedan">Sedan</option>
          <option value="suv">SUV / Crossover</option>
          <option value="van">Van</option>
          <option value="luxury">Luxury</option>
        </select>

        <select
          value={seats}
          onChange={(e) => onSeatsChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Seats (All)</option>
          <option value="4">4 Seats</option>
          <option value="5">5 Seats</option>
          <option value="7">7 Seats</option>
        </select>

        <select
          value={price}
          onChange={(e) => onPriceChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="">Rental price (All)</option>
          <option value="0-1">Below 1M VND / day</option>
          <option value="1-2">1M - 2M VND / day</option>
          <option value="2+">Above 2M VND / day</option>
        </select>

        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
        >
          <option value="recommended">Sort: Recommended</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>
      </div>
    </div>
  );
};

export default FleetFilters;