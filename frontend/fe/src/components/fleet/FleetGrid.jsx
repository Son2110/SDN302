import FleetCard from "./FleetCard";

const FleetGrid = ({ vehicles }) => {
  if (!vehicles || vehicles.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vehicles.map((vehicle) => (
        <FleetCard key={vehicle._id} vehicle={vehicle} />
      ))}
    </div>
  );
};

export default FleetGrid;
