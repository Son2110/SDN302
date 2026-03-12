const API_URL = import.meta.env.VITE_API_URL;
import { getToken } from './api';

export const getPaymentsList = async (params = {}) => {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v != null && v !== "")
  );
  const query = new URLSearchParams(cleanParams).toString();
  
  const res = await fetch(`${API_URL}/payments?${query}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch payments");
  return data;
};

export const getPaymentDetailInfo = async (id) => {
  const res = await fetch(`${API_URL}/payments/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch payment detail");
  return data;
};

export const getPaymentsByBookingId = async (bookingId) => {
  const res = await fetch(`${API_URL}/payments/booking/${bookingId}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch booking payments");
  return data;
};
