import apiClient from "./api";

// Get all notifications
export const getNotifications = async () => {
  const res = await apiClient("/notifications", { method: "GET" });
  return res.data || [];
};

// Mark one notification as read
export const markNotificationAsRead = async (id) => {
  const res = await apiClient(`/notifications/${id}/read`, {
    method: "PUT",
  });
  return res.data;
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => {
  await apiClient("/notifications/read-all", {
    method: "PUT",
  });
  return true;
};

// Delete a notification
export const deleteNotification = async (id) => {
  await apiClient(`/notifications/${id}`, {
    method: "DELETE",
  });
  return true;
};

// Delete all notifications
export const deleteAllNotifications = async () => {
  await apiClient("/notifications/all", {
    method: "DELETE",
  });
  return true;
};