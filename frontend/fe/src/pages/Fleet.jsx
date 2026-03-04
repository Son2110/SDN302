import { useState, useEffect } from "react";
import FleetHeader from "../components/fleet/FleetHeader";
import FleetFilters from "../components/fleet/FleetFilters";
import FleetGrid from "../components/fleet/FleetGrid";
import * as vehicleService from "../services/vehicleService";

const FleetPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    status: "available",
  });
  const [pagination, setPagination] = useState(null);

  // Fetch vehicle types on mount
  useEffect(() => {
    const fetchVehicleTypes = async () => {
      try {
        const response = await vehicleService.getVehicleTypes();
        setVehicleTypes(response.vehicleTypes || []);
      } catch (err) {
        console.error("Error fetching vehicle types:", err);
      }
    };
    fetchVehicleTypes();
  }, []);

  // Fetch vehicles when filters change
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await vehicleService.getVehicles(filters);
        setVehicles(response.vehicles || []);
        setPagination(response.pagination);
      } catch (err) {
        setError(err.message || "Failed to load vehicles");
        console.error("Error fetching vehicles:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, [filters]);

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        <FleetHeader />
        <FleetFilters
          vehicleTypes={vehicleTypes}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500 text-lg">Đang tải...</div>
          </div>
        ) : error ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-red-500 text-lg">{error}</div>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex justify-center items-center py-20">
            <div className="text-gray-500 text-lg">Không tìm thấy xe nào</div>
          </div>
        ) : (
          <>
            <FleetGrid vehicles={vehicles} />
            {pagination && pagination.pages > 1 && (
              <div className="flex justify-center gap-2 mt-10">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Trước
                </button>
                <span className="px-4 py-2 text-gray-700">
                  Trang {pagination.page} / {pagination.pages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                  className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default FleetPage;
