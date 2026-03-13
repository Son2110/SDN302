import apiClient from "./api";

// Get Handover details for a specific booking
export const getHandoverByBooking = async (bookingId) => {
    return await apiClient(`/handovers/booking/${bookingId}`);
};
