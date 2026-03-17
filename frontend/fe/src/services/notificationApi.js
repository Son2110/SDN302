import apiClient from "./api";

// Get user's notifications
export const getNotifications = async () => {
  return await apiClient("/notifications", {
    method: "GET",
  });
};

// Mark a notification as read
export const markNotificationAsRead = async (id) => {
  return await apiClient(`/notifications/${id}/read`, {
    method: "PUT",
  });
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async () => { 
  return await apiClient("/notifications/read-all", {
    method: "PUT",
  });
};

// Delete a notification
export const deleteNotification = async (id) => {
  return await apiClient(`/notifications/${id}`, {
    method: "DELETE",
  });
};
