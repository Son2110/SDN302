import FleetCard from "./FleetCard";
import { fleetData } from "../../../data/fleetData";

const FleetGrid = () => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {fleetData.map((car) => (
        <FleetCard key={car.id} car={car} />
      ))}
    </div>
  );
};

export default FleetGrid;
