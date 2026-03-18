# Car Rental Notification System Implementation

## 1. Overview
The Notification System is built to provide real-time (or near real-time) status updates to users throughout the car rental lifecycle (Booking Lifecycle).

The current system uses **Polling** (Client calls API) to fetch new notifications. The structure is ready to integrate **Socket.io** for real-time updates in the future.

---

## 2. Database Schema (`Notification` Model)

File: `backend/models/notification.model.js`

| Field | Type | Description |
| :--- | :--- | :--- |
| `recipient` | ObjectId (User) | Notification recipient (Customer, Driver, Staff). |
| `title` | String | Brief title of the notification. |
| `message` | String | Detailed content. |
| `type` | String (Enum) | Notification type for easy Client filtering or icon display. |
| `related_id` | ObjectId | ID of the related object (BookingID, PaymentID...). |
| `related_model` | String | Name of the related Model ("Booking", "Payment"...). |
| `is_read` | Boolean | Read status. |
| `createdAt` | DateTime | Creation time. |

### Supported Notification Types:
- `booking_created`: When customer creates a new booking.
- `payment_success`: When payment (deposit/final) is successful.
- `driver_assigned`: When driver is assigned or accepts a trip.
- `vehicle_handover`: When vehicle is delivered or returned.
- `extension_status`: Related to extension requests (sent, approved, rejected).
- `vehicle_return`: When vehicle return is completed.
- `general`: General notifications.

---

## 3. Utility Function (`sendNotification`)

File: `backend/utils/notificationSender.js`

A utility function shared across the backend to create notifications. This function is designed to **not throw errors** to avoid interrupting the main flow (e.g., payment, booking).

```javascript
import { sendNotification } from "../utils/notificationSender.js";

await sendNotification({
  recipientId: user._id,
  title: "Title",
  message: "Notification content",
  type: "general",
  relatedId: relatedObject._id,
  relatedModel: "RelatedModelName" 
});
```

---

## 4. Implemented Triggers (Events that send notifications)

The system has integrated notifications into the following business flows:

### A. Booking Flow (`bookingController.js`)
- **Event**: Customer creates Booking successfully.
- **Recipient**: Customer.
- **Type**: `booking_created`.

### B. Payment Flow (`paymentController.js`)
- **Event 1**: Deposit payment successful.
- **Event 2**: Final Payment successful.
- **Recipient**: Customer.
- **Type**: `payment_success`.

### C. Driver Assignment (`driverAssignmentController.js`)
- **Event 1 (Staff -> Driver)**: Staff assigns a trip to a driver.
  - **Recipient**: Driver.
  - **Message**: "You have been assigned to booking #..."
- **Event 2 (Driver -> Customer)**: Driver accepts the trip.
  - **Recipient**: Customer.
  - **Message**: "Driver has accepted the trip..."
  - **Type**: `driver_assigned`.

### D. Vehicle Handover (`handoverController.js`)
- **Event 1 (Delivery)**: Driver/Staff delivers vehicle to customer (status: `in_progress`).
  - **Recipient**: Customer.
  - **Message**: "Vehicle has been handed over. Have a safe trip!"
- **Event 2 (Return)**: Customer successfully returns vehicle (status: `completed`).
  - **Recipient**: Customer.
  - **Message**: "Thank you for using our service..."
  - **Type**: `vehicle_handover` / `vehicle_return`.

### E. Extension Flow (`extensionController.js`)
- **Event 1 (Request)**: Customer sends extension request.
  - **Recipient**: Customer (confirmation that request is pending).
- **Event 2 (Approve)**: Staff approves request.
  - **Recipient**: Customer.
  - **Message**: "Extension request ... has been approved."
- **Event 3 (Reject)**: Staff rejects request.
  - **Recipient**: Customer.
  - **Message**: Includes rejection reason.
  - **Type**: `extension_status`.

---

## 5. API Endpoints

File: `backend/routes/notificationRoutes.js` -> `backend/controllers/notificationController.js`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Private (All Users) | Get the list of notifications for the current user (sorted by latest). |
| `PUT` | `/api/notifications/:id/read` | Private (All Users) | Mark a notification as "read". |
| `PUT` | `/api/notifications/read-all` | Private (All Users) | Mark **all** notifications as "read". |
| `DELETE` | `/api/notifications/:id` | Private (All Users) | Delete a notification. |

---

## 6. Future Improvements
- **Real-time (Socket.io)**: Update `sendNotification` to emit a socket event immediately upon record creation, helping the client display popups instantly without reloading.
- **Push Notifications (FCM)**: Integrate Firebase Cloud Messaging for the Mobile App.
- **Email Integration**: Send parallel emails for critical notifications (New Booking, Invoices).
