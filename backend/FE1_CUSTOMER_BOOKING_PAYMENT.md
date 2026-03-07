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
| **F1** | **Xem & cập nhật thông tin cá nhân** | `/profile` | 🟡 |
| **F2** | **Đăng ký làm tài xế** | `/driver-registration` | 🟡 |

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

## F. User Profile & Driver Registration

---

### F1. Xem & cập nhật thông tin cá nhân

#### API 1: Lấy thông tin profile đầy đủ

```
GET /api/users/my-profile
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
    "user": {
      "_id": "665a...",
      "email": "customer@test.com",
      "full_name": "Nguyễn Văn A",
      "phone": "0901234567",
      "avatar_url": "",
      "is_active": true
    },
    "roles": ["customer"],
    "customer": {
      "_id": "665b...",
      "user": "665a...",
      "id_card": "001099012345",
      "driver_license": "B2-123456",
      "date_of_birth": "1990-05-15T00:00:00.000Z",
      "address": "123 Nguyễn Huệ, Q1",
      "rating": 4.8,
      "total_bookings": 5,
      "total_spent": 15000000,
      "loyalty_points": 150
    },
    "driver": null
  }
}
```

> **Lưu ý:** Nếu user cũng là driver, `driver` sẽ có dữ liệu thay vì `null`.

---

#### API 2: Cập nhật thông tin chung (Tên, SĐT, Avatar) ⭐ MỚI

```
PUT /api/users/me
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

> **Sử dụng cho:** Update thông tin chung của User (full_name, phone, avatar_url)  
> **Không phụ thuộc vào role** - Dùng chung cho cả Customer và Driver

**Body (JSON):**
```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0907654321",
  "avatar_url": "https://example.com/avatar.jpg"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `full_name` | `string` | ❌ | Họ tên mới |
| `phone` | `string` | ❌ | SĐT mới |
| `avatar_url` | `string` | ❌ | URL ảnh đại diện |

> **Lưu ý:** Chỉ gửi các field cần cập nhật. Không cần gửi tất cả.

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật thông tin thành công",
  "data": {
    "_id": "665a...",
    "email": "customer@test.com",
    "full_name": "Nguyễn Văn B",
    "phone": "0907654321",
    "avatar_url": "https://example.com/avatar.jpg",
    "is_active": true
  }
}
```

---

#### API 3: Cập nhật thông tin khách hàng (CMND, địa chỉ, ngày sinh)

```
PUT /api/users/customers/:id
```

> **Sử dụng cho:** Update thông tin RIÊNG của Customer (address, date_of_birth, driver_license)  
> **Lấy `:id`** từ `data.customer._id` trong response của API 1

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "driver_license": "B2-999888",
  "date_of_birth": "1992-08-20",
  "address": "456 Lê Lợi, Q1"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `driver_license` | `string` | ❌ | Số GPLX (nếu có) |
| `date_of_birth` | `date` | ❌ | Ngày sinh (format: YYYY-MM-DD) |
| `address` | `string` | ❌ | Địa chỉ |

> **⚠️ Quan trọng:** API này CŨNG có thể nhận `full_name`, `phone`, `avatar_url` nhưng **KHÔNG NÊN** gửi để tránh conflict khi user vừa là Customer vừa là Driver. Chỉ gửi Customer-specific fields.

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật thông tin khách hàng thành công",
  "data": {
    "_id": "665b...",
    "user": {
      "_id": "665a...",
      "email": "customer@test.com",
      "full_name": "Nguyễn Văn A",
      "phone": "0901234567"
    },
    "driver_license": "B2-999888",
    "date_of_birth": "1992-08-20T00:00:00.000Z",
    "address": "456 Lê Lợi, Q1"
  }
}
```

---

### 🎯 LUỒNG CẬP NHẬT THÔNG TIN (Quan trọng!)

#### **Trường hợp 1: User chỉ có role `customer`**

```javascript
// 1. Load profile
const profile = await getMyProfile();
// profile.data = { user, roles: ["customer"], customer, driver: null }

// 2. User sửa Tên/SĐT/Avatar → Gọi API 2
await updateUserInfo({
  full_name: "Tên mới",
  phone: "SĐT mới",
  avatar_url: "URL mới"
});

// 3. User sửa Địa chỉ/Ngày sinh/GPLX → Gọi API 3
await updateCustomer(profile.data.customer._id, {
  address: "Địa chỉ mới",
  date_of_birth: "1990-01-01",
  driver_license: "B2-123456"
});
```

#### **Trường hợp 2: User có cả 2 role `customer` + `driver`**

```javascript
// 1. Load profile
const profile = await getMyProfile();
// profile.data = { user, roles: ["customer", "driver"], customer, driver }

// 2. Sửa Tên/SĐT/Avatar (chung cho cả Customer & Driver) → CHỈ GỌI API 2
await updateUserInfo({
  full_name: "Tên mới",
  phone: "SĐT mới"
});
// ✅ Cả Customer và Driver đều thấy thông tin mới

// 3. Sửa thông tin RIÊNG Customer (địa chỉ, ngày sinh) → Gọi API 3
await updateCustomer(profile.data.customer._id, {
  address: "Địa chỉ mới"
  // ❌ KHÔNG gửi full_name, phone, avatar_url ở đây
});

// 4. Sửa thông tin RIÊNG Driver (GPLX, loại bằng, kinh nghiệm)
//    → Gọi PUT /api/users/drivers/:id (FE3 quản lý)
```

---

### 📱 UI Implementation Guide

#### **Layout: Profile Page với Sections**

```jsx
// Profile.jsx

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    // Load profile on mount
    const loadProfile = async () => {
      const data = await getMyProfile();
      setProfile(data.data);
    };
    loadProfile();
  }, []);

  return (
    <div>
      {/* Section 1: Thông tin chung (User) - Dùng chung cho tất cả roles */}
      <UserInfoSection 
        data={profile.user}
        onUpdate={async (data) => {
          await updateUserInfo(data); // API 2: PUT /api/users/me
          // Reload profile
        }}
      />
      
      {/* Section 2: Thông tin khách hàng - Chỉ hiện khi có role customer */}
      {profile.roles.includes('customer') && (
        <CustomerInfoSection
          data={profile.customer}
          onUpdate={async (data) => {
            await updateCustomer(profile.customer._id, data); // API 3
            // Reload profile
          }}
        />
      )}
      
      {/* Section 3: Thông tin tài xế - Chỉ hiện khi có role driver */}
      {profile.roles.includes('driver') && (
        <DriverInfoSection
          data={profile.driver}
          // Driver update do FE3 quản lý
        />
      )}
      
      {/* Nút đăng ký tài xế - Chỉ hiện khi là customer nhưng chưa là driver */}
      {profile.roles.includes('customer') && !profile.roles.includes('driver') && (
        <Button onClick={() => navigate('/driver-registration')}>
          Đăng ký làm tài xế
        </Button>
      )}
    </div>
  );
};
```

---

#### **Component 1: UserInfoSection (Thông tin chung)**

```jsx
// components/customer/UserInfoSection.jsx

const UserInfoSection = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: data.full_name,
    phone: data.phone,
    avatar_url: data.avatar_url
  });

  const handleSubmit = async () => {
    try {
      // Chỉ gửi các field thay đổi
      const updates = {};
      if (formData.full_name !== data.full_name) updates.full_name = formData.full_name;
      if (formData.phone !== data.phone) updates.phone = formData.phone;
      if (formData.avatar_url !== data.avatar_url) updates.avatar_url = formData.avatar_url;
      
      await onUpdate(updates); // PUT /api/users/me
      toast.success("Cập nhật thành công!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="card">
      <h3>Thông tin chung</h3>
      {isEditing ? (
        <>
          <input value={formData.full_name} onChange={...} placeholder="Họ tên" />
          <input value={formData.phone} onChange={...} placeholder="SĐT" />
          <input value={formData.avatar_url} onChange={...} placeholder="Avatar URL" />
          <button onClick={handleSubmit}>Lưu</button>
          <button onClick={() => setIsEditing(false)}>Hủy</button>
        </>
      ) : (
        <>
          <p>Email: {data.email}</p>
          <p>Họ tên: {data.full_name}</p>
          <p>SĐT: {data.phone}</p>
          <img src={data.avatar_url || '/default-avatar.png'} alt="Avatar" />
          <button onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
        </>
      )}
    </div>
  );
};
```

---

#### **Component 2: CustomerInfoSection (Thông tin khách hàng)**

```jsx
// components/customer/CustomerInfoSection.jsx

const CustomerInfoSection = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    address: data.address || '',
    date_of_birth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
    driver_license: data.driver_license || ''
  });

  const handleSubmit = async () => {
    try {
      // Chỉ gửi Customer fields, KHÔNG gửi full_name/phone/avatar
      await onUpdate(formData); // PUT /api/users/customers/:id
      toast.success("Cập nhật thành công!");
      setIsEditing(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="card">
      <h3>Thông tin khách hàng</h3>
      {isEditing ? (
        <>
          <input value={formData.address} onChange={...} placeholder="Địa chỉ" />
          <input type="date" value={formData.date_of_birth} onChange={...} />
          <input value={formData.driver_license} onChange={...} placeholder="Số GPLX (nếu có)" />
          <button onClick={handleSubmit}>Lưu</button>
          <button onClick={() => setIsEditing(false)}>Hủy</button>
        </>
      ) : (
        <>
          <p>CMND/CCCD: {data.id_card}</p>
          <p>Địa chỉ: {data.address || 'Chưa cập nhật'}</p>
          <p>Ngày sinh: {data.date_of_birth || 'Chưa cập nhật'}</p>
          <p>GPLX: {data.driver_license || 'Không có'}</p>
          <p>⭐ Rating: {data.rating}/5</p>
          <p>📦 Tổng đơn: {data.total_bookings}</p>
          <p>💰 Tổng chi: {data.total_spent.toLocaleString('vi-VN')} VND</p>
          <p>🎁 Điểm tích luỹ: {data.loyalty_points}</p>
          <button onClick={() => setIsEditing(true)}>Chỉnh sửa</button>
        </>
      )}
    </div>
  );
};
```

---

#### **service/userApi.js**

```javascript
// services/userApi.js

import api from './api'; // axios instance với token auto-attach

/**
 * Lấy thông tin profile đầy đủ (user + customer + driver)
 */
export const getMyProfile = async () => {
  const response = await api.get('/users/my-profile');
  return response.data;
};

/**
 * Cập nhật thông tin chung (full_name, phone, avatar_url)
 * Dùng chung cho tất cả roles
 */
export const updateUserInfo = async (data) => {
  const response = await api.put('/users/me', data);
  return response.data;
};

/**
 * Cập nhật thông tin Customer (address, date_of_birth, driver_license)
 */
export const updateCustomer = async (customerId, data) => {
  const response = await api.put(`/users/customers/${customerId}`, data);
  return response.data;
};

/**
 * Đăng ký làm tài xế
 */
export const registerAsDriver = async (data) => {
  const response = await api.post('/users/driver-registration', data);
  return response.data;
};
```

---

### ✅ Checklist Implementation cho F1

- [ ] Tạo `services/userApi.js` với 4 functions
- [ ] Tạo `Profile.jsx` page với logic hiển thị 3 sections
- [ ] Tạo `UserInfoSection.jsx` component:
  - [ ] Form edit: full_name, phone, avatar_url
  - [ ] Submit → gọi `updateUserInfo()` → PUT /api/users/me ⭐ API MỚI
- [ ] Tạo `CustomerInfoSection.jsx` component:
  - [ ] Form edit: address, date_of_birth, driver_license
  - [ ] Submit → gọi `updateCustomer(customerId, data)` → PUT /api/users/customers/:id
  - [ ] **CHỈ gửi Customer fields**, KHÔNG gửi full_name/phone/avatar
- [ ] Logic hiện/ẩn:
  - [ ] Nút "Đăng ký tài xế" chỉ hiện khi `roles.includes('customer') && !roles.includes('driver')`
  - [ ] DriverInfoSection chỉ hiện khi `roles.includes('driver')` (read-only, FE3 quản lý update)
- [ ] Toast notification cho success/error
- [ ] Reload profile sau khi update thành công

---

**UI gợi ý:**

**1. Nếu user chỉ là `customer`:**
- Hiển thị 2 sections: **Thông tin chung** + **Thông tin khách hàng**
- Nút action: **Đăng ký làm tài xế**

**2. Nếu user có cả 2 role `customer` + `driver`:**
- Hiển thị 3 sections: **Thông tin chung** + **Thông tin khách hàng** + **Thông tin tài xế**
- KHÔNG hiện nút "Đăng ký làm tài xế"

---

#### API 4: Cập nhật thông tin customer (DEPRECATED - Chỉ dùng cho legacy)

**⚠️ Lưu ý:** API này CÒN hoạt động nhưng KHÔNG khuyến khích dùng để update User fields. Dùng API 2 (PUT /api/users/me) thay thế.

**Body (JSON):**
```json
{
  "full_name": "Nguyễn Văn B",
  "phone": "0907654321",
  "avatar_url": "https://example.com/avatar.jpg",
  "driver_license": "B2-999888",
  "date_of_birth": "1992-08-20",
  "address": "456 Lê Lợi, Q1"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `full_name` | `string` | ❌ | Họ tên mới |
| `phone` | `string` | ❌ | SĐT mới |
| `avatar_url` | `string` | ❌ | URL ảnh đại diện |
| `driver_license` | `string` | ❌ | Số GPLX (nếu có) |
| `date_of_birth` | `date` | ❌ | Ngày sinh (format: YYYY-MM-DD) |
| `address` | `string` | ❌ | Địa chỉ |

> **Lưu ý:** Chỉ gửi các field cần cập nhật. Không cần gửi tất cả.

**Response 200:**
```json
{
  "success": true,
  "message": "Cập nhật thông tin khách hàng thành công",
  "data": {
    "_id": "665b...",
    "user": {
      "_id": "665a...",
      "email": "customer@test.com",
      "full_name": "Nguyễn Văn B",
      "phone": "0907654321",
      "avatar_url": "https://example.com/avatar.jpg"
    },
    "driver_license": "B2-999888",
    "date_of_birth": "1992-08-20T00:00:00.000Z",
    "address": "456 Lê Lợi, Q1"
  }
}
```

**UI gợi ý:**

**Form chỉnh sửa:**
```jsx
// Tạo modal hoặc edit mode trong /profile

// Form fields (pre-fill từ API 1):
- Avatar (upload image hoặc URL input)
- Họ tên (text input)
- Số điện thoại (text input)
- CMND/CCCD (readonly - không cho sửa)
- Ngày sinh (date picker)
- Địa chỉ (textarea)
- GPLX (text input, optional)

// Submit:
- Gọi PUT /api/users/customers/:id với data
- Success → Toast "Cập nhật thành công" → Refresh profile
- Error → Toast hiện error message
```

---

### F2. Đăng ký làm tài xế (Customer → Driver)

```
POST /api/users/driver-registration
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

> **Role required:** `customer` — Chỉ khách hàng mới có thể đăng ký

**Body (JSON):**
```json
{
  "license_number": "B2-987654",
  "license_type": "B2",
  "license_expiry": "2028-12-31",
  "experience_years": 5
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `license_number` | `string` | ✅ | Số giấy phép lái xe (phải unique) |
| `license_type` | `string` | ✅ | Loại bằng (B1, B2, C, D...) |
| `license_expiry` | `date` | ✅ | Ngày hết hạn (phải > ngày hiện tại, format: YYYY-MM-DD) |
| `experience_years` | `number` | ✅ | Số năm kinh nghiệm lái xe |

**Response 201:**
```json
{
  "success": true,
  "message": "Đăng ký làm tài xế thành công! Bạn có thể bắt đầu nhận chuyến.",
  "data": {
    "driver": {
      "_id": "665c...",
      "user": {
        "_id": "665a...",
        "email": "customer@test.com",
        "full_name": "Nguyễn Văn A",
        "phone": "0901234567"
      },
      "license_number": "B2-987654",
      "license_type": "B2",
      "license_expiry": "2028-12-31T00:00:00.000Z",
      "experience_years": 5,
      "rating": 0,
      "total_trips": 0,
      "status": "available"
    },
    "roles": ["customer", "driver"]
  }
}
```

**Lỗi 400:**
```json
{ "success": false, "message": "Vui lòng cung cấp đầy đủ thông tin: license_number, license_type, license_expiry, experience_years" }
```

```json
{ "success": false, "message": "Bạn đã là tài xế rồi" }
```

```json
{ "success": false, "message": "Số giấy phép lái xe đã được đăng ký" }
```

```json
{ "success": false, "message": "Giấy phép lái xe đã hết hạn" }
```

**UI gợi ý:**

**1. Vị trí hiển thị:**
- Thêm link/nút "Đăng ký làm tài xế" trong `/profile` page
- Chỉ hiện khi:
  - `user.roles` chứa `"customer"` VÀ
  - `user.roles` KHÔNG chứa `"driver"`

**2. Form đăng ký:**
```jsx
// Tạo page /driver-registration (ProtectedRoute role="customer")
// Hoặc modal trong /profile

// Form fields:
- Số giấy phép lái xe (text input, required, placeholder: "B2-123456")
- Loại bằng (dropdown: B1, B2, C, D, E, F, required)
- Ngày hết hạn (date picker, required, validation: phải >= ngày hiện tại)
- Số năm kinh nghiệm (number input, required, min: 0, max: 50)

// Submit button:
- Loading state khi đang submit
- Sau khi success:
  1. Toast: "Đăng ký làm tài xế thành công!"
  2. Cập nhật AuthContext với roles mới: ["customer", "driver"]
  3. Navbar tự động hiện thêm Driver menu (do FE3 quản lý)
  4. Redirect → /driver/assignments (trang dashboard tài xế)
```

**3. Flow hoàn chỉnh:**

```
Customer login → Vào /profile → Nút "Đăng ký làm tài xế"
                        ↓
              Click → /driver-registration (hoặc modal)
                        ↓
              Điền form và Submit
                        ↓
        POST /api/users/driver-registration → Success
                        ↓
        Cập nhật user.roles = ["customer", "driver"] trong AuthContext
                        ↓
        Navbar xuất hiện menu Driver (do FE3 xử lý)
                        ↓
        Redirect → /driver/assignments
```

**4. Validation FE:**
- Tất cả fields required
- `license_expiry` phải >= ngày hiện tại
- `experience_years`: min = 0, max = 50
- `license_number` format đề xuất: "XX-NNNNNN" (2 chữ + gạch ngang + 6 số)

**5. Edge cases:**
- Nếu user đã là driver → API trả 400 → Modal confirm "Bạn đã là tài xế rồi" → redirect /driver/assignments
- Nếu license_number trùng → API trả 400 → Hiện lỗi dưới field "Số giấy phép đã được đăng ký"
- Nếu license hết hạn → API trả 400 → Hiện lỗi "Giấy phép lái xe đã hết hạn, vui lòng gia hạn trước khi đăng ký"

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
      Profile.jsx             ← F1 (xem & cập nhật thông tin)
      DriverRegistration.jsx  ← F2 (đăng ký làm tài xế)
  components/
    customer/
      BookingList.jsx
      BookingStatusBadge.jsx
      PaymentForm.jsx         ← C1, C2
      PaymentSummary.jsx      ← C4
      ExtensionForm.jsx       ← D1
      HandoverInfo.jsx        ← E1
      ProfileForm.jsx         ← F1 (form chỉnh sửa profile)
      DriverRegForm.jsx       ← F2 (form đăng ký driver)
  services/
    bookingApi.js
    paymentApi.js
    extensionApi.js
    handoverApi.js
    userApi.js              ← F1, F2 (my-profile, update customer, register driver)
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

---

## ✅ Checklist cho FE1

### Phase 1: Booking Flow (Ưu tiên cao)
- [ ] B1: Chọn xe + Tạo đơn (`CreateBooking.jsx`)
- [ ] B2: Danh sách đơn của tôi (`MyBookings.jsx`)
- [ ] B3: Chi tiết đơn đặt xe (`BookingDetail.jsx`)
- [ ] B4: Huỷ đơn (action button trong B3)
- [ ] C1: Thanh toán cọc (`PaymentForm.jsx`)
- [ ] C2: Thanh toán cuối (`PaymentForm.jsx`)

### Phase 2: Extensions & History (Ưu tiên trung bình)
- [ ] C3: Lịch sử thanh toán (`MyPayments.jsx`)
- [ ] C4: Chi tiết thanh toán theo đơn (section trong B3)
- [ ] D1: Yêu cầu gia hạn (`ExtensionForm.jsx`)
- [ ] D2: Danh sách gia hạn (`MyExtensions.jsx`)
- [ ] D3: Chi tiết gia hạn (`ExtensionDetail.jsx`)
- [ ] E1: Xem biên bản bàn giao (`HandoverInfo.jsx` trong B3)

### Phase 3: User Profile & Driver Registration (MỚI)
- [ ] F1: Xem & cập nhật thông tin cá nhân (`Profile.jsx`)
  - [ ] Hiển thị thông tin user + customer
  - [ ] Form chỉnh sửa profile
  - [ ] Upload/change avatar
  - [ ] Hiển thị tabs Customer/Driver nếu có cả 2 role
  - [ ] Nút "Đăng ký làm tài xế" (chỉ hiện khi chưa là driver)
- [ ] F2: Đăng ký làm tài xế (`DriverRegistration.jsx`)
  - [ ] Form đăng ký với validation FE
  - [ ] Date picker cho license_expiry (phải >= ngày hiện tại)
  - [ ] Dropdown loại bằng (B1, B2, C, D, E, F)
  - [ ] Success → update AuthContext roles → redirect /driver/assignments
- [ ] Tạo `userApi.js` service với 3 functions:
  - [ ] `getMyProfile()` - GET /api/users/my-profile
  - [ ] `updateCustomer(id, data)` - PUT /api/users/customers/:id
  - [ ] `registerAsDriver(data)` - POST /api/users/driver-registration

### Notes:
- **Phụ thuộc FE3:** Đợi FE3 hoàn thành AuthContext, ProtectedRoute, Toast trước khi bắt đầu
- **Driver Registration Flow:** Sau khi đăng ký thành công, Navbar sẽ tự động hiện Driver menu (do FE3 quản lý)
