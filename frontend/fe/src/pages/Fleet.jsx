import FleetHeader from "../components/fleet/FleetHeader";
import FleetFilters from "../components/fleet/FleetFilters";
import FleetGrid from "../components/fleet/FleetGrid";

const FleetPage = () => {
  return (
    <main className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <FleetHeader />
        <FleetFilters />
        <FleetGrid />
      </div>
    </main>
  );
};

export default FleetPage;
