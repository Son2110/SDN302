import apiClient, { getToken } from "./api";

const API_URL = import.meta.env.VITE_API_URL;

// --- Driver Side ---
export const getMyAssignments = async (status) => {
    let endpoint = "/driver-assignment/my-assignments";
    if (status) {
        endpoint += `?status=${status}`;
    }
    return await apiClient(endpoint);
};

export const respondToAssignment = async (id, responseData) => {
    return await apiClient(`/driver-assignment/${id}/respond`, {
        method: "PUT",
        body: JSON.stringify(responseData),
    });
};

export const getAssignmentDetail = async (id) => {
    return await apiClient(`/driver-assignment/${id}`);
};

// --- Staff Side ---
export const getAssignments = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );
  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(`${API_URL}/driver-assignment?${query}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch driver assignments");
  return data;
};

export const assignDriver = async (payload) => {
  const res = await fetch(`${API_URL}/driver-assignment`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}` 
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to assign driver");
  return data;
};

export const updateAssignment = async (id, driver_id) => {
  const res = await fetch(`${API_URL}/driver-assignment/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}` 
    },
    body: JSON.stringify({ driver_id }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update assignment");
  return data;
};

export const deleteAssignment = async (id) => {
  const res = await fetch(`${API_URL}/driver-assignment/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete assignment");
  return data;
};
