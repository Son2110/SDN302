const API_URL = import.meta.env.VITE_API_URL;
import { getToken } from './api';

export const getHandovers = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );
  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(`${API_URL}/handovers?${query}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch handovers");
  return data;
};

export const createDeliveryHandover = async (payload) => {
  const res = await fetch(`${API_URL}/handovers/delivery`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}` 
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create delivery handover");
  return data;
};

export const createReturnHandover = async (payload) => {
  const res = await fetch(`${API_URL}/handovers/return`, {
    method: "POST",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}` 
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create return handover");
  return data;
};

export const getHandoversByBookingId = async (bookingId) => {
  const res = await fetch(`${API_URL}/handovers/booking/${bookingId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch booking handovers");
  return data;
};
