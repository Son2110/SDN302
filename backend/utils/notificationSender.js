import Notification from "../models/notification.model.js";

/**
 * Tạo và lưu thông báo vào database
 * @param {Object} data
 * @param {string} data.recipientId - ID của User nhận tin
 * @param {string} data.title - Tiêu đề
 * @param {string} data.message - Nội dung
 * @param {string} data.type - Loại thông báo
 * @param {string} [data.relatedId] - ID object liên quan (BookingId, PaymentId...)
 * @param {string} [data.relatedModel] - Tên Model liên quan
 */
export const sendNotification = async ({
  recipientId,
  title,
  message,
  type,
  relatedId = null,
  relatedModel = null,
}) => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      related_id: relatedId,
      related_model: relatedModel,
    });

    // TODO: Nếu sau này làm Socket.io (Realtime), sẽ emit sự kiện ở đây
    // io.to(recipientId).emit("new_notification", notification);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Không throw error để tránh làm hỏng luồng chính (booking, payment...)
  }
};
