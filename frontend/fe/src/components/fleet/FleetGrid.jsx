import FleetCard from "./FleetCard";
// Local fallback data.
import { fleetData } from "../../../data/fleetData";

const FleetGrid = ({ data }) => {
  /* Prefer parent-provided data (already filtered).
    If absent (for example, homepage), use fallback fleetData.
  */
  const displayData = data || fleetData;

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {displayData.map((car) => (
        <FleetCard key={car.id} car={car} />
      ))}

      {/* Show message if no vehicles match filters */}
      {displayData.length === 0 && (
        <div className="col-span-full py-20 text-center">
          <p className="text-gray-400 font-medium">
            No vehicles match your selected criteria.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-blue-600 text-sm font-bold underline"
          >
            Reset filters
          </button>
        </div>
      )}
    </div>
  );
};

export default FleetGrid;