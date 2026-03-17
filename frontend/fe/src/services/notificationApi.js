import apiClient from "./api";

export const getMyNotifications = async () => {
    const res = await apiClient("/notifications", { method: "GET" });
    return res.data || [];
};

export const markNotificationAsRead = async (id) => {
    const res = await apiClient(`/notifications/${id}/read`, { method: "PUT" });
    return res.data;
};

export const markAllNotificationsAsRead = async () => {
    await apiClient("/notifications/read-all", { method: "PUT" });
    return true;
};
