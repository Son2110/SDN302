# 🧑‍💼 FE1 — Customer: Đặt xe & Thanh toán

> **Người phụ trách:** FE1
> **Phạm vi:** Toàn bộ luồng Customer — đặt xe, quản lý đơn, thanh toán, gia hạn, xem bàn giao
> **Base URL:** `http://localhost:<PORT>/api`
> **Auth:** Mọi API đều gửi Header `Authorization: Bearer <token>`

---

## 📋 Danh sách chức năng cần implement

| # | Chức năng | Route FE | Ưu tiên |
|---|-----------|----------|---------|
| B1 | Chọn xe + Tạo đơn đặt xe | `/booking/create` | 🔴 |
| B2 | Danh sách đơn của tôi | `/my-bookings` | 🔴 |
| B3 | Chi tiết đơn đặt xe | `/bookings/:id` | 🔴 |
| B4 | Huỷ đơn | (nút trong B3) | 🔴 |
| C1 | Thanh toán cọc | `/payments/deposit` hoặc modal trong B3 | 🔴 |
| C2 | Thanh toán cuối | `/payments/final` hoặc modal trong B3 | 🔴 |
| C3 | Lịch sử thanh toán | `/my-payments` | 🟡 |
| C4 | Chi tiết thanh toán theo đơn | (tab/section trong B3) | 🟡 |
| D1 | Yêu cầu gia hạn | `/extensions/request` hoặc modal trong B3 | 🟡 |
| D2 | Danh sách gia hạn của tôi | `/my-extensions` | 🟡 |
| D3 | Chi tiết gia hạn | `/extensions/:id` | 🟡 |
| E1 | Xem biên bản bàn giao | (section trong B3) | 🟡 |

---

## 🔌 Chi tiết API Endpoints

---

### B1. Xem xe khả dụng + Tạo đơn

#### API 1: Lấy danh sách xe khả dụng

```
GET /api/bookings/available?start_date=2026-03-10&end_date=2026-03-15
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params:**

| Param | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `start_date` | `string` (ISO) | ✅ | Ngày bắt đầu thuê |
| `end_date` | `string` (ISO) | ✅ | Ngày kết thúc thuê |

**Response 200:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "vehicleId1",
      "license_plate": "30A-12345",
      "brand": "Toyota",
      "model": "Camry",
      "daily_rate": 800000,
      "vehicle_type": {
        "type_name": "Sedan",
        "category": "sedan"
      }
    }
  ]
}
```

**Cách dùng:** User chọn ngày → gọi API → hiển thị danh sách xe → user chọn xe → sang bước tạo đơn.

---

#### API 2: Tạo đơn đặt xe

```
POST /api/bookings
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "vehicle_id": "665b...",
  "start_date": "2026-03-10",
  "end_date": "2026-03-15",
  "rental_type": "self_drive",
  "pickup_location": "123 Lê Lợi, Q.1, TP.HCM",
  "return_location": "123 Lê Lợi, Q.1, TP.HCM"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `vehicle_id` | `string` | ✅ | ID xe đã chọn |
| `start_date` | `string` (ISO) | ✅ | Ngày bắt đầu |
| `end_date` | `string` (ISO) | ✅ | Ngày kết thúc |
| `rental_type` | `string` | ✅ | `"self_drive"` hoặc `"with_driver"` |
| `pickup_location` | `string` | ✅ | Địa điểm nhận xe |
| `return_location` | `string` | ✅ | Địa điểm trả xe |

**Response 201:**
```json
{
  "success": true,
  "message": "Đặt xe thành công. Vui lòng thanh toán tiền cọc để xác nhận đơn.",
  "data": {
    "booking_id": "booking123...",
    "total_amount": 4000000,
    "deposit_amount": 1200000,
    "status": "pending"
  }
}
```

**Lỗi 400:**
```json
{ "message": "Xe đã có người đặt trong khoảng thời gian này." }
```

**UI gợi ý:** Sau khi tạo đơn thành công → hiện popup/redirect sang trang thanh toán cọc.

---

### B2. Danh sách đơn của tôi

```
GET /api/bookings/my-bookings
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `status` | `string` | Tất cả | `pending`, `confirmed`, `in_progress`, `vehicle_returned`, `completed`, `cancelled` |
| `page` | `number` | `1` | Trang hiện tại |
| `limit` | `number` | `10` | Số đơn mỗi trang |

**Ví dụ:**
```
GET /api/bookings/my-bookings?status=confirmed&page=1&limit=5
```

**Response 200:**
```json
{
  "success": true,
  "count": 2,
  "total": 8,
  "page": 1,
  "totalPages": 2,
  "data": [
    {
      "_id": "booking1...",
      "vehicle": { "brand": "Toyota", "model": "Camry" },
      "status": "confirmed",
      "start_date": "2026-03-10T00:00:00.000Z",
      "end_date": "2026-03-15T00:00:00.000Z",
      "total_amount": 4000000
    }
  ]
}
```

**UI gợi ý:** Table/list có filter tabs (Tất cả | Chờ cọc | Đã xác nhận | Đang thuê | Hoàn tất | Đã huỷ) + phân trang.

---

### B3. Chi tiết đơn đặt xe

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

**UI gợi ý:** Hiển thị full info đơn. Tuỳ `status` hiện các nút action khác nhau:
- `pending` → nút **Thanh toán cọc** + nút **Huỷ đơn**
- `confirmed` → nút **Huỷ đơn** + nút **Yêu cầu gia hạn**
- `in_progress` → nút **Yêu cầu gia hạn**
- `vehicle_returned` → nút **Thanh toán cuối**

---

### B4. Huỷ đơn

```
PUT /api/bookings/:id/cancel
```

**Header:**
```
Authorization: Bearer <token>
```

**Không cần Body.**

**Response 200 (đơn pending — chưa cọc):**
```json
{
  "success": true,
  "message": "Đã huỷ đơn thành công.",
  "data": {
    "booking_id": "665c...",
    "booking_status": "cancelled",
    "refunded": false
  }
}
```

**Response 200 (đơn confirmed — đã cọc):**
```json
{
  "success": true,
  "message": "Đã huỷ đơn thành công. Tiền cọc sẽ được hoàn lại.",
  "data": {
    "booking_id": "665c...",
    "booking_status": "cancelled",
    "refunded": true
  }
}
```

**UI gợi ý:** Confirm dialog trước khi huỷ. Nếu `refunded: true` → hiện thông báo "Tiền cọc sẽ được hoàn lại".

---

### C1. Thanh toán cọc

```
POST /api/payments/deposit
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "booking_id": "665c...",
  "payment_method": "momo",
  "transaction_id": "MOMO_TXN_123456"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `booking_id` | `string` | ✅ | ID đơn đặt xe |
| `payment_method` | `string` | ✅ | `"cash"`, `"card"`, `"momo"`, `"zalopay"`, `"vnpay"` |
| `transaction_id` | `string` | ❌ | Mã giao dịch (tuỳ phương thức) |

**Response 200:**
```json
{
  "success": true,
  "message": "Thanh toán cọc thành công. Đơn đặt xe đã được xác nhận",
  "data": {
    "payment_id": "pay1...",
    "amount_paid": 1200000,
    "payment_date": "2026-03-08T10:30:00.000Z",
    "booking_status": "confirmed"
  }
}
```

**Lỗi 400:**
```json
{ "message": "Đơn không ở trạng thái chờ cọc." }
```

**UI gợi ý:** Form chọn phương thức thanh toán → nhập mã giao dịch (nếu online) → submit. Sau thành công redirect về chi tiết đơn.

---

### C2. Thanh toán cuối (Final)

```
POST /api/payments/final
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "booking_id": "665c...",
  "payment_method": "vnpay",
  "transaction_id": "VNPAY_TXN_789"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `booking_id` | `string` | ✅ | ID đơn đặt xe |
| `payment_method` | `string` | ✅ | `"cash"`, `"card"`, `"momo"`, `"zalopay"`, `"vnpay"` |
| `transaction_id` | `string` | ❌ | Mã giao dịch |

> ⚠️ Chỉ gọi được khi booking status = `vehicle_returned`

**Response 200:**
```json
{
  "success": true,
  "message": "Thanh toán hoàn tất. Cảm ơn quý khách đã sử dụng dịch vụ!",
  "data": {
    "payment_id": "pay2...",
    "amount_paid": 2800000,
    "booking_status": "completed"
  }
}
```

**UI gợi ý:** Hiển thị tóm tắt: tổng tiền, đã cọc, còn phải trả → Form chọn phương thức → submit.

---

### C3. Lịch sử thanh toán của tôi

```
GET /api/payments/my-payments
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
| `page` | `number` | `1` | |
| `limit` | `number` | `10` | |

**Ví dụ:**
```
GET /api/payments/my-payments?payment_type=deposit
```

**Response 200:**
```json
{
  "success": true,
  "count": 1,
  "total": 3,
  "page": 1,
  "totalPages": 1,
  "data": [
    {
      "_id": "pay1...",
      "payment_type": "deposit",
      "amount": 1200000,
      "payment_method": "momo",
      "status": "completed",
      "payment_date": "2026-03-08T10:30:00.000Z",
      "booking": {
        "status": "confirmed",
        "vehicle": { "brand": "Toyota", "model": "Camry", "license_plate": "51A-12345" }
      }
    }
  ]
}
```

**UI gợi ý:** Table với columns: Ngày, Loại, Số tiền, Phương thức, Trạng thái, Xe. Filter dropdown theo loại và trạng thái.

---

### C4. Xem giao dịch theo đơn đặt xe

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
    },
    {
      "_id": "pay2...",
      "payment_type": "rental_fee",
      "amount": 2800000,
      "status": "completed",
      "payment_date": "2026-03-15T16:30:00.000Z"
    }
  ]
}
```

**UI gợi ý:** Hiển thị trong trang chi tiết đơn (B3) dưới dạng:
- **Summary card:** Tổng tiền | Đã cọc | Đã trả | Còn nợ
- **Timeline:** Danh sách giao dịch theo thời gian

---

### D1. Yêu cầu gia hạn

```
POST /api/extensions/request
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "booking_id": "665c...",
  "new_end_date": "2026-03-20"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `booking_id` | `string` | ✅ | ID đơn đặt xe |
| `new_end_date` | `string` (ISO) | ✅ | Ngày kết thúc mới (phải sau ngày kết thúc hiện tại) |

> ⚠️ Chỉ gửi được khi booking status = `confirmed` hoặc `in_progress`

**Response 201:**
```json
{
  "success": true,
  "message": "Đã gửi yêu cầu gia hạn. Vui lòng chờ nhân viên xác nhận.",
  "data": {
    "_id": "ext1...",
    "booking": "665c...",
    "original_end_date": "2026-03-15T00:00:00.000Z",
    "new_end_date": "2026-03-20T00:00:00.000Z",
    "days_extended": 5,
    "has_conflict": false,
    "additional_amount": 4000000,
    "status": "pending"
  }
}
```

**UI gợi ý:** Modal/form trong trang chi tiết đơn: date picker chọn ngày mới → hiển thị preview số ngày thêm + tiền thêm → submit.

---

### D2. Danh sách yêu cầu gia hạn của tôi

```
GET /api/extensions/my-requests
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `status` | `string` | Tất cả | `pending`, `approved`, `rejected`, `alternative_offered` |
| `page` | `number` | `1` | |
| `limit` | `number` | `10` | |

**Ví dụ:**
```
GET /api/extensions/my-requests?status=pending
```

**Response 200:**
```json
{
  "success": true,
  "count": 1,
  "total": 3,
  "page": 1,
  "totalPages": 1,
  "data": [
    {
      "_id": "ext1...",
      "status": "pending",
      "original_end_date": "2026-03-15T00:00:00.000Z",
      "new_end_date": "2026-03-20T00:00:00.000Z",
      "days_extended": 5,
      "additional_amount": 4000000,
      "booking": {
        "status": "in_progress",
        "vehicle": { "brand": "Toyota", "model": "Camry", "license_plate": "51A-12345" }
      },
      "processed_by": null
    }
  ]
}
```

---

### D3. Chi tiết yêu cầu gia hạn

```
GET /api/extensions/:id
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
    "_id": "ext1...",
    "status": "approved",
    "original_end_date": "2026-03-15T00:00:00.000Z",
    "new_end_date": "2026-03-20T00:00:00.000Z",
    "days_extended": 5,
    "has_conflict": false,
    "additional_amount": 4000000,
    "booking": {
      "_id": "booking1...",
      "status": "in_progress",
      "rental_type": "self_drive",
      "vehicle": {
        "brand": "Toyota", "model": "Camry", "license_plate": "51A-12345",
        "vehicle_type": { "type_name": "Sedan 4 chỗ" }
      },
      "customer": { "user": { "full_name": "Nguyễn Văn A" } }
    },
    "customer": { "user": { "full_name": "Nguyễn Văn A", "phone": "090...", "email": "a@gmail.com" } },
    "processed_by": { "user": { "full_name": "Lê Thị C" } },
    "alternative_vehicle": null
  }
}
```

---

### E1. Xem biên bản bàn giao theo đơn

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
      "notes": "Xe tình trạng tốt, pin đầy",
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

> Nếu chưa trả xe: `return = null`, `km_driven = null`

**UI gợi ý:** Section trong trang chi tiết đơn (B3):
- Card **Giao xe:** thời gian, km, % pin, ghi chú, nhân viên
- Card **Trả xe:** thời gian, km, % pin, ghi chú, nhân viên (nếu đã trả)
- Badge: **Đã chạy 500 km**

---

## 📁 Cấu trúc thư mục gợi ý

```
src/
  pages/
    customer/
      MyBookings.jsx          ← B2
      BookingDetail.jsx       ← B3 + B4 + C4 + E1
      CreateBooking.jsx       ← B1
      MyPayments.jsx          ← C3
      MyExtensions.jsx        ← D2
      ExtensionDetail.jsx     ← D3
  components/
    customer/
      BookingList.jsx
      BookingStatusBadge.jsx
      PaymentForm.jsx         ← C1, C2
      PaymentSummary.jsx      ← C4
      ExtensionForm.jsx       ← D1
      HandoverInfo.jsx        ← E1
  services/
    bookingApi.js
    paymentApi.js
    extensionApi.js
    handoverApi.js
```

---

## 🔄 Trạng thái Booking & UI Actions

| Status | Hiển thị | Actions khả dụng |
|--------|---------|-------------------|
| `pending` | 🟡 Chờ cọc | Thanh toán cọc, Huỷ đơn |
| `confirmed` | 🟢 Đã xác nhận | Huỷ đơn, Yêu cầu gia hạn |
| `in_progress` | 🔵 Đang thuê | Yêu cầu gia hạn |
| `vehicle_returned` | 🟠 Chờ thanh toán | Thanh toán cuối |
| `completed` | ✅ Hoàn tất | Không |
| `cancelled` | ❌ Đã huỷ | Không |
