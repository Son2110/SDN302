const API_URL = import.meta.env.VITE_API_URL;
import { getToken } from './api';

export const getAllBookings = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );
  const query = new URLSearchParams(cleanParams).toString();
  const res = await fetch(`${API_URL}/bookings/all?${query}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch bookings");
  return data;
};

export const getBookingDetail = async (id) => {
  const res = await fetch(`${API_URL}/bookings/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch booking detail");
  return data;
};

export const updateBooking = async (id, updateData) => {
  const res = await fetch(`${API_URL}/bookings/${id}`, {
    method: "PUT",
    headers: { 
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}` 
    },
    body: JSON.stringify(updateData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update booking");
  return data;
};

export const deleteBooking = async (id) => {
  const res = await fetch(`${API_URL}/bookings/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete booking");
  return data;
};
