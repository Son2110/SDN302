const API_URL = import.meta.env.VITE_API_URL;
import { getToken } from './api';

export const getExtensions = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );
  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(`${API_URL}/extensions?${query}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch extensions");
  return data;
};

export const approveExtension = async (id) => {
  const res = await fetch(`${API_URL}/extensions/${id}/approve`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to approve extension");
  return data;
};

export const rejectExtension = async (id, reject_reason = "") => {
  const res = await fetch(`${API_URL}/extensions/${id}/reject`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}` 
    },
    body: JSON.stringify({ reject_reason }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to reject extension");
  return data;
};
