const FleetFilters = () => {
  return (
    <div className="flex flex-wrap items-center gap-3 mb-10">
      {["Vehicle Type", "Brand", "Price Range", "Transmission"].map((label) => (
        <select
          key={label}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 focus:outline-none"
        >
          <option>{label}</option>
        </select>
      ))}

      <div className="ml-auto">
        <select className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm">
          <option>Sort by: Recommended</option>
        </select>
      </div>
    </div>
  );
};

export default FleetFilters;
