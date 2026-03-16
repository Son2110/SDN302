const API_URL = import.meta.env.VITE_API_URL;
import { getToken } from "./api";

/**
 * Get available vehicles for a date range
 * @param {string} start_date - YYYY-MM-DD
 * @param {string} end_date - YYYY-MM-DD
 * @returns {Promise} Available vehicles list
 */
export const getAvailableVehicles = async (start_date, end_date) => {
  const params = new URLSearchParams();
  if (start_date) params.append("start_date", start_date);
  if (end_date) params.append("end_date", end_date);

  const res = await fetch(`${API_URL}/bookings/available?${params.toString()}`);
  const response = await res.json();
  if (!res.ok)
    throw new Error(response.message || "Failed to fetch available vehicles");
  return response.data; // Return array of vehicles directly
};

/**
 * Get booked date ranges for a specific vehicle (for calendar blocking)
 * @param {string} vehicleId - Vehicle ID
 * @returns {Promise} Array of { start: date, end: date } ranges
 */
export const getVehicleBookedDates = async (vehicleId) => {
  const res = await fetch(
    `${API_URL}/bookings/vehicle/${vehicleId}/booked-dates`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch booked dates");
  return data;
};

/**
 * Get all vehicles (for Fleet page - no date filter)
 * @returns {Promise} All available vehicles
 */
export const getAllVehicles = async () => {
  return getAvailableVehicles(); // No params = get all available
};

/**
 * Get vehicle details by ID
 * @param {string} id - Vehicle ID
 * @returns {Promise} Vehicle details
 */
export const getVehicleById = async (id) => {
  // Use bookings/available endpoint to get vehicle data (no auth required)
  // Then filter by ID or fetch from vehicles endpoint if user is authenticated
  const res = await fetch(`${API_URL}/bookings/available`);
  const response = await res.json();
  if (!res.ok) throw new Error(response.message || "Failed to fetch vehicle");

  // Find vehicle by ID from the list
  const vehicle = response.data.find((v) => v._id === id);
  if (!vehicle) throw new Error("Vehicle not found");

  return vehicle;
};

// ==================== STAFF VEHICLE MANAGEMENT ====================

/**
 * Get all vehicles with filters (Staff only)
 * @param {Object} params - {status, brand, page, limit}
 * @returns {Promise}
 */
export const getVehiclesForStaff = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.status) query.append("status", params.status);
  if (params.brand) query.append("brand", params.brand);
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);

  const res = await fetch(`${API_URL}/vehicles?${query.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch vehicles");
  return data;
};

/**
 * Get vehicle by ID (Staff only)
 * @param {string} id - Vehicle ID
 * @returns {Promise}
 */
export const getVehicleByIdForStaff = async (id) => {
  const res = await fetch(`${API_URL}/vehicles/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch vehicle");
  return data.data;
};

/**
 * Create new vehicle (Staff only)
 * @param {Object} vehicleData
 * @returns {Promise}
 */
export const createVehicle = async (vehicleData) => {
  const isFormData = vehicleData instanceof FormData;
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}/vehicles`, {
    method: "POST",
    headers,
    body: isFormData ? vehicleData : JSON.stringify(vehicleData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create vehicle");
  return data;
};

/**
 * Update vehicle (Staff only)
 * @param {string} id - Vehicle ID
 * @param {Object|FormData} vehicleData
 * @returns {Promise}
 */
export const updateVehicle = async (id, vehicleData) => {
  const isFormData = vehicleData instanceof FormData;
  const headers = { Authorization: `Bearer ${getToken()}` };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_URL}/vehicles/${id}`, {
    method: "PUT",
    headers,
    body: isFormData ? vehicleData : JSON.stringify(vehicleData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update vehicle");
  return data;
};

/**
 * Delete vehicle (Staff only)
 * @param {string} id - Vehicle ID
 * @returns {Promise}
 */
export const deleteVehicle = async (id) => {
  const res = await fetch(`${API_URL}/vehicles/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete vehicle");
  return data;
};

/**
 * Update vehicle status (Staff only)
 * @param {string} id - Vehicle ID
 * @param {string} status - "available" | "maintenance"
 * @param {string} maintenance_note - Optional note
 * @returns {Promise}
 */
export const updateVehicleStatus = async (id, status, maintenance_note) => {
  const res = await fetch(`${API_URL}/vehicles/${id}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ status, maintenance_note }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update status");
  return data;
};

/**
 * Get all vehicle types (Staff only)
 * @returns {Promise}
 */
export const getVehicleTypes = async () => {
  const res = await fetch(`${API_URL}/vehicles/types`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch vehicle types");
  return data.data;
};

/**
 * Create vehicle type (Staff only)
 * @param {Object} typeData
 * @returns {Promise}
 */
export const createVehicleType = async (typeData) => {
  const res = await fetch(`${API_URL}/vehicles/types`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(typeData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create vehicle type");
  return data;
};
