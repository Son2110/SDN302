# Car Rental Notification System Implementation

## 1. Overview
Hệ thống thông báo (Notification System) được xây dựng để cập nhật trạng thái thời gian thực (hoặc gần thời gian thực) cho người dùng trong suốt vòng đời thuê xe (Booking Lifecycle).

Hệ thống hiện tại sử dụng **Polling** (Client gọi API) để lấy thông báo mới. Cấu trúc đã sẵn sàng để tích hợp **Socket.io** cho Realtime sau này.

---

## 2. Database Schema (`Notification` Model)

File: `backend/models/notification.model.js`

| Field | Type | Description |
| :--- | :--- | :--- |
| `recipient` | ObjectId (User) | Người nhận thông báo (Customer, Driver, Staff). |
| `title` | String | Tiêu đề ngắn gọn của thông báo. |
| `message` | String | Nội dung chi tiết. |
| `type` | String (Enum) | Loại thông báo để Client dễ dàng filter hoặc hiển thị icon phù hợp. |
| `related_id` | ObjectId | ID của đối tượng liên quan (BookingID, PaymentID...). |
| `related_model` | String | Tên Model liên quan ("Booking", "Payment"...). |
| `is_read` | Boolean | Trạng thái đã đọc hay chưa. |
| `createdAt` | DateTime | Thời gian tạo. |

### Supported Notification Types:
- `booking_created`: Khi khách hàng tạo đơn mới.
- `payment_success`: Khi thanh toán (cọc/trả hết) thành công.
- `driver_assigned`: Khi tài xế được phân công hoặc tài xế nhận chuyến.
- `vehicle_handover`: Khi giao xe hoặc nhận xe trả.
- `extension_status`: Liên quan đến yêu cầu gia hạn (gửi yêu cầu, duyệt, từ chối).
- `vehicle_return`: Khi hoàn tất trả xe.
- `general`: Thông báo chung.

---

## 3. Utility Function (`sendNotification`)

File: `backend/utils/notificationSender.js`

Hàm tiện ích dùng chung cho toàn bộ backend để tạo thông báo. Hàm này được thiết kế để **không throw error** làm gián đoạn luồng chính (như thanh toán, đặt xe).

```javascript
import { sendNotification } from "../utils/notificationSender.js";

await sendNotification({
  recipientId: user._id,
  title: "Tiêu đề",
  message: "Nội dung thông báo",
  type: "general",
  relatedId: relatedObject._id,
  relatedModel: "RelatedModelName" 
});
```

---

## 4. Implemented Triggers (Các sự kiện gửi thông báo)

Hệ thống đã tích hợp thông báo vào các luồng nghiệp vụ sau:

### A. Booking Flow (`bookingController.js`)
- **Sự kiện**: Khách hàng tạo Booking thành công.
- **Người nhận**: Khách hàng (Customer).
- **Loại**: `booking_created`.

### B. Payment Flow (`paymentController.js`)
- **Sự kiện 1**: Thanh toán cọc (Deposit) thành công.
- **Sự kiện 2**: Thanh toán phần còn lại (Final Payment) thành công.
- **Người nhận**: Khách hàng.
- **Loại**: `payment_success`.

### C. Driver Assignment (`driverAssignmentController.js`)
- **Sự kiện 1 (Staff -> Driver)**: Staff phân công chuyến cho tài xế.
  - **Người nhận**: Tài xế (Driver).
  - **Thông điệp**: "Bạn được phân công cho đơn #..."
- **Sự kiện 2 (Driver -> Customer)**: Tài xế chấp nhận (Accept) chuyến đi.
  - **Người nhận**: Khách hàng.
  - **Thông điệp**: "Tài xế đã nhận chuyến..."
  - **Loại**: `driver_assigned`.

### D. Vehicle Handover (`handoverController.js`)
- **Sự kiện 1 (Delivery)**: Tài xế/Staff giao xe cho khách (status: `in_progress`).
  - **Người nhận**: Khách hàng.
  - **Thông điệp**: "Xe đã được bàn giao. Chúc quý khách thượng lộ bình an!"
- **Sự kiện 2 (Return)**: Khách trả xe thành công (status: `completed`).
  - **Người nhận**: Khách hàng.
  - **Thông điệp**: "Cảm ơn quý khách đã sử dụng dịch vụ..."
  - **Loại**: `vehicle_handover` / `vehicle_return`.

### E. Extension Flow (`extensionController.js`)
- **Sự kiện 1 (Request)**: Khách gửi yêu cầu gia hạn.
  - **Người nhận**: Khách hàng (xác nhận yêu cầu đang chờ duyệt).
- **Sự kiện 2 (Approve)**: Staff duyệt yêu cầu.
  - **Người nhận**: Khách hàng.
  - **Thông điệp**: "Yêu cầu gia hạn ... đã được chấp thuận."
- **Sự kiện 3 (Reject)**: Staff từ chối yêu cầu.
  - **Người nhận**: Khách hàng.
  - **Thông điệp**: Kèm lý do từ chối.
  - **Loại**: `extension_status`.

---

## 5. API Endpoints

File: `backend/routes/notificationRoutes.js` -> `backend/controllers/notificationController.js`

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Private (All Users) | Lấy danh sách thông báo của người dùng hiện tại (sắp xếp mới nhất). |
| `PUT` | `/api/notifications/:id/read` | Private (All Users) | Đánh dấu một thông báo là "đã đọc". |
| `PUT` | `/api/notifications/read-all` | Private (All Users) | Đánh dấu **tất cả** thông báo là "đã đọc". |
| `DELETE` | `/api/notifications/:id` | Private (All Users) | Xóa một thông báo. |

---

## 6. Future Improvements
- **Realtime (Socket.io)**: Cập nhật `sendNotification` để emit event socket ngay khi tạo record, giúp client hiển thị popup ngay lập tức mà không cần reload.
- **Push Notifications (FCM)**: Tích hợp Firebase Cloud Messaging cho Mobile App.
- **Email Integration**: Gửi email song song cho các thông báo quan trọng (Booking mới, Hóa đơn).
