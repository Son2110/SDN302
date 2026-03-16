const API_URL = import.meta.env.VITE_API_URL;
import { getToken } from "./api";

// ==================== DRIVER REGISTRATION ====================

/**
 * Get my driver registration status (Customer)
 * Returns null if not registered, or driver object with status
 * @returns {Promise}
 */
export const getMyDriverStatus = async () => {
  const res = await fetch(`${API_URL}/users/my-driver-status`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch driver status");
  return data.data; // null nếu chưa đăng ký
};

/**
 * Register as driver (Customer only)
 * @param {Object} driverData - {license_number, license_type, license_expiry, experience_years}
 * @returns {Promise}
 */
export const registerAsDriver = async (driverData) => {
  const res = await fetch(`${API_URL}/users/driver-registration`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(driverData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to register as driver");
  return data;
};

/**
 * Re-apply as driver after rejection (Customer only)
 * @param {Object} driverData
 * @returns {Promise}
 */
export const reapplyAsDriver = async (driverData) => {
  const res = await fetch(`${API_URL}/users/driver-registration`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(driverData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to re-apply");
  return data;
};

// ==================== STAFF DRIVER MANAGEMENT ====================

/**
 * Get all drivers (Staff only)
 * @param {Object} params - {page, limit, search, status}
 * @returns {Promise}
 */
export const getAllDrivers = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);

  const res = await fetch(`${API_URL}/users/drivers?${query.toString()}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch drivers");
  return data;
};

/**
 * Get pending drivers only (Staff only)
 * @param {Object} params - {page, limit}
 * @returns {Promise}
 */
export const getPendingDrivers = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);

  const res = await fetch(
    `${API_URL}/users/drivers/pending?${query.toString()}`,
    {
      headers: { Authorization: `Bearer ${getToken()}` },
    },
  );
  const data = await res.json();
  if (!res.ok)
    throw new Error(data.message || "Failed to fetch pending drivers");
  return data;
};

/**
 * Get driver statistics (Staff only)
 * @returns {Promise}
 */
export const getDriverStats = async () => {
  const res = await fetch(`${API_URL}/users/drivers/stats`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch driver stats");
  return data.data;
};

/**
 * Get driver by ID (Staff or own profile)
 * @param {string} id - Driver ID
 * @returns {Promise}
 */
export const getDriverById = async (id) => {
  const res = await fetch(`${API_URL}/users/drivers/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch driver");
  return data.data;
};

/**
 * Update driver (Staff or own profile)
 * @param {string} id - Driver ID
 * @param {Object} driverData
 * @returns {Promise}
 */
export const updateDriver = async (id, driverData) => {
  const res = await fetch(`${API_URL}/users/drivers/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(driverData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update driver");
  return data;
};

/**
 * Approve driver registration (Staff only)
 * @param {string} id - Driver ID
 * @returns {Promise}
 */
export const approveDriver = async (id) => {
  const res = await fetch(`${API_URL}/users/drivers/${id}/approve`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve driver");
  return data;
};

/**
 * Reject driver registration (Staff only)
 * @param {string} id - Driver ID
 * @param {string} rejection_reason - Reason for rejection
 * @returns {Promise}
 */
export const rejectDriver = async (id, rejection_reason) => {
  const res = await fetch(`${API_URL}/users/drivers/${id}/reject`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify({ rejection_reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reject driver");
  return data;
};


