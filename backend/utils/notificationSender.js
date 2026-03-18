import Notification from "../models/notification.model.js";

/**
 * Create and save notification to database
 * @param {Object} data
 * @param {string} data.recipientId - ID of recipient User
 * @param {string} data.title - Title
 * @param {string} data.message - Content
 * @param {string} data.type - Notification type
 * @param {string} [data.relatedId] - ID of related object (BookingId, PaymentId...)
 * @param {string} [data.relatedModel] - Name of related Model
 */
export const sendNotification = async ({
  recipientId,
  title,
  message,
  type,
  relatedId = null,
  relatedModel = null,
  eventKey = null,
}) => {
  try {
    if (eventKey) {
      const exists = await Notification.findOne({
        recipient: recipientId,
        event_key: eventKey,
      }).select("_id");

      if (exists) {
        return exists;
      }
    }

    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      related_id: relatedId,
      related_model: relatedModel,
      event_key: eventKey,
    });

    // TODO: If Socket.io (Realtime) is added, emit event here
    // io.to(recipientId).emit("new_notification", notification);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    // Do not throw error to avoid breaking main flow (booking, payment...)
  }
};
