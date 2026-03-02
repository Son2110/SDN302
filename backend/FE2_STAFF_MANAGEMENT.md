# 🛠️ FE2 — Staff Management Panel

> **Người phụ trách:** FE2
> **Phạm vi:** Dashboard quản lý dành cho Staff — quản lý đơn, phân công tài xế, bàn giao xe, duyệt gia hạn, xem giao dịch
> **Base URL:** `http://localhost:<PORT>/api`
> **Auth:** Mọi API đều gửi Header `Authorization: Bearer <token>`
> **Role của user:** `staff`

--- 

## 📋 Danh sách chức năng cần implement

| # | Chức năng | Route FE | Ưu tiên |
|---|-----------|----------|---------|
| F1 | Danh sách tất cả đơn đặt xe | `/staff/bookings` | 🔴 |
| F2 | Chi tiết đơn | `/staff/bookings/:id` | 🔴 |
| F3 | Cập nhật đơn | (form trong F2) | 🔴 |
| F4 | Xoá đơn | (nút trong F1/F2) | 🟡 |
| G1 | Danh sách phân công tài xế | `/staff/assignments` | 🔴 |
| G2 | Phân công tài xế mới | (form/modal trong G1) | 🔴 |
| G3 | Cập nhật phân công (đổi tài xế) | (form trong G1) | 🟡 |
| G4 | Xoá phân công | (nút trong G1) | 🟡 |
| H1 | Danh sách biên bản bàn giao | `/staff/handovers` | 🔴 |
| H2 | Tạo biên bản giao xe | `/staff/handovers/delivery` hoặc modal | 🔴 |
| H3 | Tạo biên bản trả xe | `/staff/handovers/return` hoặc modal | 🔴 |
| I1 | Danh sách yêu cầu gia hạn | `/staff/extensions` | 🟡 |
| I2 | Duyệt / Từ chối gia hạn | (nút trong I1) | 🟡 |
| I3 | Danh sách giao dịch thanh toán | `/staff/payments` | 🟡 |
| I4 | Chi tiết giao dịch | `/staff/payments/:id` | 🟡 |

---

## 🔌 Chi tiết API Endpoints

---

### F1. Danh sách tất cả đơn đặt xe

```
GET /api/bookings/all
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `status` | `string` | Tất cả | `pending`, `confirmed`, `in_progress`, `vehicle_returned`, `completed`, `cancelled` |
| `page` | `number` | `1` | Trang |
| `limit` | `number` | `20` | Số đơn mỗi trang |

**Ví dụ:**
```
GET /api/bookings/all?status=pending&page=1&limit=20
GET /api/bookings/all?status=confirmed
```

**Response 200:**
```json
{
  "success": true,
  "count": 5,
  "total": 25,
  "page": 1,
  "totalPages": 2,
  "data": [
    {
      "_id": "booking1...",
      "customer": {
        "user": { "full_name": "Nguyễn Văn A", "phone": "090..." }
      },
      "vehicle": { "brand": "Toyota", "model": "Camry", "license_plate": "51A-12345" },
      "status": "pending",
      "rental_type": "self_drive",
      "start_date": "2026-03-10T00:00:00.000Z",
      "end_date": "2026-03-15T00:00:00.000Z",
      "total_amount": 4000000,
      "deposit_amount": 1200000
    }
  ]
}
```

**UI gợi ý:** Table CRUD với columns: Khách hàng, Xe, Loại thuê, Ngày bắt đầu, Ngày kết thúc, Tổng tiền, Trạng thái, Actions. Filter tabs theo status.

---

### F2. Chi tiết đơn đặt xe

```
GET /api/bookings/:id
```

**Header:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "665c...",
    "customer": {
      "_id": "cust1...",
      "user": { "full_name": "Nguyễn Văn A", "email": "a@gmail.com", "phone": "090..." }
    },
    "vehicle": {
      "brand": "Toyota",
      "model": "Camry",
      "license_plate": "51A-12345",
      "vehicle_type": { "type_name": "Sedan" }
    },
    "driver": null,
    "status": "confirmed",
    "rental_type": "self_drive",
    "start_date": "2026-03-10T00:00:00.000Z",
    "end_date": "2026-03-15T00:00:00.000Z",
    "pickup_location": "123 Lê Lợi, Q.1",
    "return_location": "123 Lê Lợi, Q.1",
    "total_amount": 4000000,
    "deposit_amount": 1200000,
    "final_amount": 0
  }
}
```

**UI gợi ý:** Page chi tiết với các section: Thông tin đơn, Thông tin khách, Thông tin xe, Timeline trạng thái. Tuỳ status hiện buttons khác nhau.

---

### F3. Cập nhật đơn đặt xe

```
PUT /api/bookings/:id
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

> ⚠️ Chỉ sửa được khi status = `pending` hoặc `confirmed`. Tự động tính lại tổng tiền & cọc khi đổi xe/ngày.

**Body (JSON) — tất cả field tuỳ chọn:**
```json
{
  "vehicle_id": "newVehicle...",
  "start_date": "2026-03-12",
  "end_date": "2026-03-18",
  "rental_type": "with_driver",
  "pickup_location": "456 Nguyễn Huệ, Q1",
  "return_location": "789 Lê Lợi, Q1"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `vehicle_id` | `string` | ❌ | Đổi xe (phải available trong khoảng thời gian) |
| `start_date` | `string` (ISO) | ❌ | Đổi ngày bắt đầu |
| `end_date` | `string` (ISO) | ❌ | Đổi ngày kết thúc |
| `rental_type` | `string` | ❌ | `"self_drive"` hoặc `"with_driver"` |
| `pickup_location` | `string` | ❌ | Đổi địa điểm nhận |
| `return_location` | `string` | ❌ | Đổi địa điểm trả |

**Response 200:**
```json
{
  "success": true,
  "message": "Đã cập nhật đơn đặt xe thành công.",
  "data": {
    "_id": "665c...",
    "vehicle": "newVehicle...",
    "start_date": "2026-03-12T00:00:00.000Z",
    "end_date": "2026-03-18T00:00:00.000Z",
    "rental_type": "with_driver",
    "total_amount": 7800000,
    "deposit_amount": 2340000,
    "status": "confirmed"
  }
}
```

**Lỗi 400:**
```json
{ "message": "Xe mới đã có khách đặt trong khoảng thời gian này." }
{ "message": "Đơn đang ở trạng thái \"in_progress\", không thể chỉnh sửa." }
```

**UI gợi ý:** Inline edit form hoặc modal edit trong trang chi tiết đơn.

---

### F4. Xoá đơn đặt xe

```
DELETE /api/bookings/:id
```

**Header:**
```
Authorization: Bearer <token>
```

**Không cần Body.**

> ⚠️ Chỉ xoá được đơn `pending` hoặc `cancelled`

**Response 200:**
```json
{
  "success": true,
  "message": "Đã xoá đơn đặt xe thành công."
}
```

**Lỗi 400:**
```json
{ "message": "Đơn đang ở trạng thái \"confirmed\", không thể xoá. Chỉ xoá được đơn pending hoặc cancelled." }
```

**UI gợi ý:** Confirm dialog "Bạn có chắc muốn xoá đơn này?" → call API → refresh list.

---

### G1. Danh sách phân công tài xế

```
GET /api/driver-assignment
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `status` | `string` | Tất cả | `pending`, `accepted`, `rejected` |
| `driver_id` | `string` | Tất cả | Lọc theo ID tài xế |
| `booking_id` | `string` | Tất cả | Lọc theo ID đơn đặt xe |

**Ví dụ:**
```
GET /api/driver-assignment?status=pending
GET /api/driver-assignment?driver_id=driver123
```

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "assignment1...",
      "status": "pending",
      "assigned_at": "2026-03-01T10:00:00Z",
      "booking": {
        "_id": "booking1...",
        "start_date": "2026-03-10",
        "end_date": "2026-03-15",
        "vehicle": { "brand": "Toyota", "model": "Camry" },
        "customer": {
          "user": { "full_name": "Nguyễn Văn A", "phone": "090...", "email": "a@gmail.com" }
        }
      },
      "driver": {
        "user": { "full_name": "Trần Văn B", "phone": "091..." }
      },
      "assigned_by": {
        "user": { "full_name": "Lê Thị C" }
      }
    }
  ]
}
```

**UI gợi ý:** Table: Booking, Tài xế, Trạng thái, Ngày phân công, Staff phân công. Filter tabs: Tất cả | Chờ phản hồi | Đã nhận | Đã từ chối.

---

### G2. Phân công tài xế mới

```
POST /api/driver-assignment
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

> ⚠️ Chỉ cho booking có `rental_type = "with_driver"` và status = `confirmed`

**Body (JSON):**
```json
{
  "booking_id": "665c...",
  "driver_id": "driver123..."
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `booking_id` | `string` | ✅ | ID đơn đặt xe |
| `driver_id` | `string` | ✅ | ID tài xế (phải có status = `available`) |

**Response 201:**
```json
{
  "success": true,
  "message": "Đã gửi yêu cầu phân công đến tài xế. Đang chờ tài xế xác nhận.",
  "data": {
    "_id": "assignment1...",
    "booking": "665c...",
    "driver": "driver123...",
    "assigned_by": "staff1...",
    "status": "pending"
  }
}
```

**Lỗi 400:**
```json
{ "message": "Booking này không phải loại thuê có tài xế." }
{ "message": "Tài xế đang bận, không thể phân công." }
```

**UI gợi ý:** Dropdown chọn tài xế (lọc available) + dropdown chọn booking (lọc confirmed + with_driver) → submit.

---

### G3. Cập nhật phân công (đổi tài xế)

```
PUT /api/driver-assignment/:id
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

> ⚠️ Chỉ đổi được khi status = `pending` hoặc `rejected`

**Body (JSON):**
```json
{
  "driver_id": "newDriver456..."
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `driver_id` | `string` | ✅ | ID tài xế mới |

**Response 200:**
```json
{
  "success": true,
  "message": "Đã cập nhật phân công. Tài xế mới sẽ nhận yêu cầu.",
  "data": {
    "_id": "assignment1...",
    "driver": "newDriver456...",
    "status": "pending",
    "assigned_by": "staff1...",
    "assigned_at": "2026-03-02T08:00:00Z"
  }
}
```

**Lỗi 400:**
```json
{ "message": "Không thể sửa phân công đã được tài xế nhận. Hãy huỷ trước rồi tạo mới." }
```

---

### G4. Xoá (huỷ) phân công

```
DELETE /api/driver-assignment/:id
```

**Header:**
```
Authorization: Bearer <token>
```

**Không cần Body.**

> Nếu assignment đang `accepted`: tự động gỡ `booking.driver = null`, chuyển `driver.status = "available"`

**Response 200:**
```json
{
  "success": true,
  "message": "Đã huỷ phân công thành công."
}
```

**UI gợi ý:** Confirm dialog → call API → refresh list.

---

### H1. Danh sách biên bản bàn giao

```
GET /api/handovers
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `handover_type` | `string` | Tất cả | `delivery` (giao xe) hoặc `return` (trả xe) |
| `booking_id` | `string` | Tất cả | Lọc theo đơn |
| `page` | `number` | `1` | |
| `limit` | `number` | `20` | |

**Ví dụ:**
```
GET /api/handovers?handover_type=delivery&page=1
```

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "total": 10,
  "page": 1,
  "totalPages": 5,
  "data": [
    {
      "_id": "handover1...",
      "handover_type": "delivery",
      "handover_time": "2026-03-10T08:00:00.000Z",
      "mileage": 35000,
      "battery_level_percentage": 95,
      "booking": {
        "_id": "booking1...",
        "status": "in_progress",
        "customer": { "user": { "full_name": "Nguyễn Văn A", "phone": "090..." } }
      },
      "vehicle": { "brand": "VinFast", "model": "VF8", "license_plate": "51A-12345" },
      "staff": { "user": { "full_name": "Lê Thị C" } }
    }
  ]
}
```

**UI gợi ý:** Table: Loại, Thời gian, Booking, Xe, Km, Pin (%), Nhân viên. Filter tabs: Tất cả | Giao xe | Trả xe.

---

### H2. Tạo biên bản giao xe (Delivery)

```
POST /api/handovers/delivery
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

> ⚠️ Chỉ tạo khi booking status = `confirmed`. Sau khi tạo: booking → `in_progress`, vehicle → `rented`

**Body (JSON):**
```json
{
  "booking_id": "665c...",
  "mileage": 35000,
  "battery_level_percentage": 95,
  "notes": "Xe tình trạng tốt, pin đầy, đủ giấy tờ",
  "customer_signature": "data:image/png;base64,..."
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `booking_id` | `string` | ✅ | ID đơn đặt xe |
| `mileage` | `number` | ❌ | Số km ODO lúc giao (mặc định lấy từ xe) |
| `battery_level_percentage` | `number` | ❌ | % pin (xe điện, mặc định 100) |
| `notes` | `string` | ❌ | Ghi chú tình trạng xe |
| `customer_signature` | `string` | ❌ | Chữ ký khách (base64) |

**Response 201:**
```json
{
  "success": true,
  "message": "Lập biên bản giao xe thành công! Chuyến đi đã bắt đầu.",
  "data": {
    "handover": {
      "_id": "handover1...",
      "handover_type": "delivery",
      "mileage": 35000,
      "battery_level_percentage": 95
    },
    "booking_status": "in_progress",
    "vehicle_status": "rented"
  }
}
```

**UI gợi ý:** Form: chọn booking (confirmed) → nhập km, % pin, ghi chú → optional canvas chữ ký → submit.

---

### H3. Tạo biên bản trả xe (Return)

```
POST /api/handovers/return
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

> ⚠️ Chỉ tạo khi booking status = `in_progress`. Sau khi tạo: booking → `vehicle_returned`, vehicle → `available`

**Body (JSON):**
```json
{
  "booking_id": "665c...",
  "return_mileage": 35500,
  "battery_level_percentage": 60,
  "notes": "Xe có vết xước nhỏ ở cản trước",
  "penalty_amount": 500000,
  "customer_signature": "data:image/png;base64,..."
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `booking_id` | `string` | ✅ | ID đơn đặt xe |
| `return_mileage` | `number` | ✅ | Số km ODO lúc trả (phải >= lúc giao) |
| `battery_level_percentage` | `number` | ❌ | % pin lúc trả (xe điện) |
| `notes` | `string` | ❌ | Ghi chú tình trạng xe |
| `penalty_amount` | `number` | ❌ | Tiền phạt (mặc định 0) |
| `customer_signature` | `string` | ❌ | Chữ ký khách (base64) |

> **Lưu ý:** `final_amount = total_amount + charging_fee + penalty_amount - deposit_amount`
> - `charging_fee` được server tự động tính dựa trên % pin giao vs % pin trả

**Response 201:**
```json
{
  "success": true,
  "message": "Nhận lại xe thành công! Vui lòng hướng dẫn khách thanh toán phần còn lại.",
  "data": {
    "handover": {
      "_id": "handover2...",
      "handover_type": "return",
      "mileage": 35500,
      "battery_level_percentage": 60
    },
    "charging_fee": 84000,
    "penalty_amount": 500000,
    "final_amount_to_pay": 2800000,
    "booking_status": "vehicle_returned",
    "vehicle_status": "available"
  }
}
```

**UI gợi ý:** Form: chọn booking (in_progress) → nhập km trả, % pin, tiền phạt (nếu có), ghi chú → submit. Hiển thị `charging_fee` và `final_amount_to_pay` sau khi tạo thành công.

---

### I1. Danh sách yêu cầu gia hạn

```
GET /api/extensions
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `status` | `string` | Tất cả | `pending`, `approved`, `rejected`, `alternative_offered` |
| `booking_id` | `string` | Tất cả | Lọc theo đơn đặt xe |
| `page` | `number` | `1` | |
| `limit` | `number` | `20` | |

**Ví dụ:**
```
GET /api/extensions?status=pending
```

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "total": 5,
  "page": 1,
  "totalPages": 1,
  "data": [
    {
      "_id": "ext1...",
      "status": "pending",
      "original_end_date": "2026-03-15T00:00:00.000Z",
      "new_end_date": "2026-03-20T00:00:00.000Z",
      "days_extended": 5,
      "has_conflict": false,
      "additional_amount": 4000000,
      "booking": {
        "_id": "booking1...",
        "status": "in_progress",
        "vehicle": { "brand": "Toyota", "model": "Camry", "license_plate": "51A-12345" }
      },
      "customer": {
        "user": { "full_name": "Nguyễn Văn A", "phone": "090...", "email": "a@gmail.com" }
      },
      "processed_by": null
    }
  ]
}
```

**UI gợi ý:** Table: Khách hàng, Xe, Ngày gốc → Ngày mới, Số ngày, Tiền thêm, Trạng thái, Actions. Filter tabs, ưu tiên hiện pending đầu tiên.

---

### I2a. Duyệt gia hạn

```
PUT /api/extensions/:id/approve
```

**Header:**
```
Authorization: Bearer <token>
```

**Không cần Body.**

**Response 200:**
```json
{
  "success": true,
  "message": "Đã duyệt gia hạn thành công! Hợp đồng đã được cập nhật.",
  "data": {
    "extension_status": "approved",
    "new_end_date": "2026-03-20T00:00:00.000Z",
    "new_total_amount": 8000000
  }
}
```

> Sau khi duyệt: `booking.end_date` → ngày mới, `booking.total_amount` += tiền gia hạn

---

### I2b. Từ chối gia hạn

```
PUT /api/extensions/:id/reject
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON — tuỳ chọn):**
```json
{
  "reject_reason": "Xe đã có người đặt trong khoảng thời gian này"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `reject_reason` | `string` | ❌ | Lý do từ chối |

**Response 200:**
```json
{
  "success": true,
  "message": "Đã từ chối yêu cầu gia hạn.",
  "data": {
    "extension_status": "rejected"
  }
}
```

**UI gợi ý cho I2:** Mỗi row pending có 2 nút: ✅ Duyệt (call approve) | ❌ Từ chối (popup nhập lý do → call reject).

---

### I3. Danh sách giao dịch thanh toán

```
GET /api/payments
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `payment_type` | `string` | Tất cả | `deposit`, `rental_fee`, `extension_fee`, `penalty`, `refund` |
| `status` | `string` | Tất cả | `pending`, `completed`, `failed`, `refunded` |
| `payment_method` | `string` | Tất cả | `cash`, `card`, `momo`, `zalopay`, `vnpay` |
| `booking_id` | `string` | Tất cả | Lọc theo đơn đặt xe |
| `page` | `number` | `1` | |
| `limit` | `number` | `20` | |

**Ví dụ:**
```
GET /api/payments?payment_type=deposit&status=completed
GET /api/payments?booking_id=665c...
```

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "total": 15,
  "page": 1,
  "totalPages": 1,
  "data": [
    {
      "_id": "pay1...",
      "payment_type": "deposit",
      "amount": 1200000,
      "payment_method": "momo",
      "status": "completed",
      "transaction_id": "MOMO_TXN_123456",
      "payment_date": "2026-03-08T10:30:00.000Z",
      "booking": {
        "_id": "booking1...",
        "status": "confirmed",
        "total_amount": 4000000,
        "deposit_amount": 1200000
      },
      "customer": {
        "user": { "full_name": "Nguyễn Văn A", "phone": "090...", "email": "a@gmail.com" }
      },
      "processed_by": null
    }
  ]
}
```

**UI gợi ý:** Table: Ngày, Loại giao dịch, Số tiền, Phương thức, Trạng thái, Khách hàng, Booking. Nhiều filter dropdowns.

---

### I4. Chi tiết 1 giao dịch

```
GET /api/payments/:id
```

**Header:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "pay1...",
    "payment_type": "deposit",
    "amount": 1200000,
    "payment_method": "momo",
    "status": "completed",
    "transaction_id": "MOMO_TXN_123456",
    "payment_date": "2026-03-08T10:30:00.000Z",
    "booking": {
      "_id": "booking1...",
      "status": "confirmed",
      "total_amount": 4000000,
      "deposit_amount": 1200000,
      "vehicle": { "brand": "Toyota", "model": "Camry", "license_plate": "51A-12345" }
    },
    "customer": {
      "user": { "full_name": "Nguyễn Văn A", "phone": "090...", "email": "a@gmail.com" }
    },
    "processed_by": null
  }
}
```

**UI gợi ý:** Modal hoặc sidebar detail khi click vào 1 row trong bảng I3.

---

### Bonus: Xem giao dịch theo đơn (dùng trong F2 chi tiết đơn)

```
GET /api/payments/booking/:bookingId
```

**Header:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "summary": {
    "total_amount": 4000000,
    "deposit_amount": 1200000,
    "final_amount": 2800000,
    "total_paid": 4000000,
    "total_refunded": 0,
    "remaining": 0
  },
  "data": [
    {
      "_id": "pay1...",
      "payment_type": "deposit",
      "amount": 1200000,
      "status": "completed",
      "payment_date": "2026-03-08T10:30:00.000Z"
    }
  ]
}
```

---

### Bonus: Xem biên bản bàn giao theo đơn (dùng trong F2 chi tiết đơn)

```
GET /api/handovers/booking/:bookingId
```

**Header:**
```
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "booking_id": "665c...",
    "booking_status": "vehicle_returned",
    "delivery": {
      "_id": "handover1...",
      "handover_type": "delivery",
      "handover_time": "2026-03-10T08:00:00.000Z",
      "mileage": 35000,
      "battery_level_percentage": 95,
      "staff": { "user": { "full_name": "Lê Thị C" } }
    },
    "return": {
      "_id": "handover2...",
      "handover_type": "return",
      "handover_time": "2026-03-15T16:00:00.000Z",
      "mileage": 35500,
      "battery_level_percentage": 60,
      "staff": { "user": { "full_name": "Lê Thị C" } }
    },
    "km_driven": 500
  }
}
```

---

## 📁 Cấu trúc thư mục gợi ý

```
src/
  pages/
    staff/
      StaffBookings.jsx        ← F1
      StaffBookingDetail.jsx   ← F2 + F3
      StaffAssignments.jsx     ← G1 + G2 + G3 + G4
      StaffHandovers.jsx       ← H1
      HandoverDeliveryForm.jsx ← H2
      HandoverReturnForm.jsx   ← H3
      StaffExtensions.jsx      ← I1 + I2
      StaffPayments.jsx        ← I3 + I4
  components/
    staff/
      BookingTable.jsx
      BookingEditForm.jsx
      AssignmentTable.jsx
      AssignDriverForm.jsx
      HandoverTable.jsx
      HandoverForm.jsx
      ExtensionTable.jsx
      PaymentTable.jsx
      PaymentDetail.jsx
  services/
    bookingApi.js
    driverAssignmentApi.js
    handoverApi.js
    extensionApi.js
    paymentApi.js
```

---

## 🔄 Staff Actions theo Booking Status

| Booking Status | Staff Actions khả dụng |
|----------------|------------------------|
| `pending` | Sửa đơn, Xoá đơn |
| `confirmed` | Sửa đơn, Huỷ đơn, Phân công tài xế (nếu with_driver), Giao xe |
| `in_progress` | Nhận trả xe, Xem biên bản |
| `vehicle_returned` | Xem biên bản, Xem giao dịch |
| `completed` | Chỉ xem |
| `cancelled` | Xoá đơn |
