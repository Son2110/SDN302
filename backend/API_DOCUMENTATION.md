# 📖 API Documentation — Booking Car System

> **Base URL:** `http://localhost:<PORT>/api`
>
> Tất cả các API có khóa 🔒 đều yêu cầu gửi kèm **Bearer Token** trong Header:
>
> ```
> Authorization: Bearer <your_jwt_token>
> ```

---

## Mục lục

1. [Auth](#1-auth)
2. [Users](#2-users)
3. [Bookings](#3-bookings)
4. [Payments](#4-payments)
5. [Driver Assignment](#5-driver-assignment)
6. [Handovers](#6-handovers)
7. [Extensions](#7-extensions)

---

## 1. Auth

### 1.1 Đăng ký tài khoản

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/auth/register` |
| **Auth** | Không |
| **Role** | Ai cũng được |

**Body (JSON):**

```json
{
  "email": "nguyenvana@gmail.com",
  "password": "123456",
  "full_name": "Nguyễn Văn A",
  "phone": "0901234567",
  "id_card": "001099012345"
}
```

**Response (201):**

```json
{
  "success": true,
  "_id": "665a...",
  "email": "nguyenvana@gmail.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 1.2 Đăng nhập

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/auth/login` |
| **Auth** | Không |

**Body (JSON):**

```json
{
  "email": "nguyenvana@gmail.com",
  "password": "123456"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "665a...",
    "email": "nguyenvana@gmail.com",
    "full_name": "Nguyễn Văn A",
    "roles": ["customer"]
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

> ⚠️ **Lưu ý:** Lấy `token` ở đây để set vào Header `Authorization` cho tất cả các API bên dưới.

---

### 1.3 Xem thông tin cá nhân 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/auth/me` |
| **Auth** | 🔒 Bearer Token |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "665a...",
    "email": "nguyenvana@gmail.com",
    "full_name": "Nguyễn Văn A",
    "roles": ["customer"]
  }
}
```

---

## 2. Users

### 2.1 Xem thông tin cá nhân 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/users/my-profile` |
| **Auth** | 🔒 Bearer Token |
| **Role** | Bất kỳ (customer, staff, driver) |

**Response (200):**

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

> **Lưu ý:** Nếu user cũng là driver, `driver` sẽ có dữ liệu. Nếu user có cả 2 role, cả `customer` và `driver` đều có dữ liệu.

---

### 2.2 Đăng ký làm tài xế 🔒

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/users/driver-registration` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

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
| `license_number` | `string` | ✅ | Số giấy phép lái xe (unique) |
| `license_type` | `string` | ✅ | Loại bằng (B1, B2, C, D...) |
| `license_expiry` | `date` | ✅ | Ngày hết hạn (phải > ngày hiện tại) |
| `experience_years` | `number` | ✅ | Số năm kinh nghiệm |

**Response (201):**

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

**Lỗi (400):**

```json
{ "success": false, "message": "Bạn đã là tài xế rồi" }
```

```json
{ "success": false, "message": "Số giấy phép lái xe đã được đăng ký" }
```

```json
{ "success": false, "message": "Giấy phép lái xe đã hết hạn" }
```

---

### 2.3 Lấy danh sách khách hàng 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/users/customers` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Query Params:**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `page` | `number` | 1 | Trang hiện tại |
| `limit` | `number` | 10 | Số bản ghi mỗi trang |
| `search` | `string` | "" | Tìm theo tên, email, SĐT |

**Ví dụ:**

```
GET /api/users/customers?page=1&limit=10&search=nguyen
```

**Response (200):**

```json
{
  "success": true,
  "count": 2,
  "total": 15,
  "page": 1,
  "pages": 2,
  "data": [
    {
      "_id": "665b...",
      "user": {
        "_id": "665a...",
        "email": "customer1@test.com",
        "full_name": "Nguyễn Văn A",
        "phone": "0901234567",
        "avatar_url": "",
        "is_active": true
      },
      "id_card": "001099012345",
      "driver_license": "B2-123456",
      "date_of_birth": "1990-05-15T00:00:00.000Z",
      "address": "123 Nguyễn Huệ, Q1",
      "rating": 4.8,
      "total_bookings": 5,
      "total_spent": 15000000,
      "loyalty_points": 150
    }
  ]
}
```

---

### 2.4 Xem chi tiết khách hàng 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/users/customers/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` (chỉ xem profile của mình) hoặc `staff` (xem tất cả) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "665b...",
    "user": {
      "_id": "665a...",
      "email": "customer@test.com",
      "full_name": "Nguyễn Văn A",
      "phone": "0901234567",
      "avatar_url": "",
      "is_active": true
    },
    "id_card": "001099012345",
    "driver_license": "B2-123456",
    "date_of_birth": "1990-05-15T00:00:00.000Z",
    "address": "123 Nguyễn Huệ, Q1",
    "rating": 4.8,
    "total_bookings": 5,
    "total_spent": 15000000,
    "loyalty_points": 150
  }
}
```

**Lỗi (403):**

```json
{ "success": false, "message": "Bạn không có quyền xem thông tin này" }
```

**Lỗi (404):**

```json
{ "success": false, "message": "Không tìm thấy khách hàng" }
```

---

### 2.5 Cập nhật thông tin khách hàng 🔒

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/users/customers/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` (chỉ cập nhật của mình) hoặc `staff` (cập nhật tất cả) |

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
| `driver_license` | `string` | ❌ | Số GPLX |
| `date_of_birth` | `date` | ❌ | Ngày sinh |
| `address` | `string` | ❌ | Địa chỉ |

> **Lưu ý:** Chỉ gửi các field cần cập nhật. Không cần gửi tất cả.

**Response (200):**

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

---

### 2.6 Lấy danh sách tài xế 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/users/drivers` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Query Params:**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `page` | `number` | 1 | Trang hiện tại |
| `limit` | `number` | 10 | Số bản ghi mỗi trang |
| `search` | `string` | "" | Tìm theo tên, email, SĐT |
| `status` | `string` | "" | `available`, `busy`, `offline` |

**Ví dụ:**

```
GET /api/users/drivers?page=1&limit=10&status=available
GET /api/users/drivers?search=tran
```

**Response (200):**

```json
{
  "success": true,
  "count": 3,
  "total": 8,
  "page": 1,
  "pages": 1,
  "data": [
    {
      "_id": "665c...",
      "user": {
        "_id": "665d...",
        "email": "driver@test.com",
        "full_name": "Trần Văn B",
        "phone": "0911122233",
        "avatar_url": "",
        "is_active": true
      },
      "license_number": "B2-555444",
      "license_type": "B2",
      "license_expiry": "2027-06-30T00:00:00.000Z",
      "experience_years": 3,
      "rating": 4.9,
      "total_trips": 25,
      "status": "available"
    }
  ]
}
```

---

### 2.7 Xem chi tiết tài xế 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/users/drivers/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `driver` (chỉ xem profile của mình) hoặc `staff` (xem tất cả) |

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "665c...",
    "user": {
      "_id": "665d...",
      "email": "driver@test.com",
      "full_name": "Trần Văn B",
      "phone": "0911122233",
      "avatar_url": "",
      "is_active": true
    },
    "license_number": "B2-555444",
    "license_type": "B2",
    "license_expiry": "2027-06-30T00:00:00.000Z",
    "experience_years": 3,
    "rating": 4.9,
    "total_trips": 25,
    "status": "available"
  }
}
```

**Lỗi (403):**

```json
{ "success": false, "message": "Bạn không có quyền xem thông tin này" }
```

**Lỗi (404):**

```json
{ "success": false, "message": "Không tìm thấy tài xế" }
```

---

### 2.8 Cập nhật thông tin tài xế 🔒

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/users/drivers/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `driver` (chỉ cập nhật của mình) hoặc `staff` (cập nhật tất cả) |

**Body (JSON):**

```json
{
  "full_name": "Trần Văn C",
  "phone": "0999888777",
  "avatar_url": "https://example.com/driver.jpg",
  "license_number": "B2-111222",
  "license_type": "C",
  "license_expiry": "2029-12-31",
  "experience_years": 7,
  "status": "offline"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `full_name` | `string` | ❌ | Họ tên mới |
| `phone` | `string` | ❌ | SĐT mới |
| `avatar_url` | `string` | ❌ | URL ảnh đại diện |
| `license_number` | `string` | ❌ | Số GPLX (unique) |
| `license_type` | `string` | ❌ | Loại bằng |
| `license_expiry` | `date` | ❌ | Ngày hết hạn |
| `experience_years` | `number` | ❌ | Số năm kinh nghiệm |
| `status` | `string` | ❌ | `available`, `busy`, `offline` (chỉ staff mới được đổi) |

> **Lưu ý:** 
> - Chỉ gửi các field cần cập nhật
> - `status` chỉ staff mới có quyền thay đổi

**Response (200):**

```json
{
  "success": true,
  "message": "Cập nhật thông tin tài xế thành công",
  "data": {
    "_id": "665c...",
    "user": {
      "_id": "665d...",
      "email": "driver@test.com",
      "full_name": "Trần Văn C",
      "phone": "0999888777",
      "avatar_url": "https://example.com/driver.jpg"
    },
    "license_number": "B2-111222",
    "license_type": "C",
    "license_expiry": "2029-12-31T00:00:00.000Z",
    "experience_years": 7,
    "status": "offline"
  }
}
```

**Lỗi (400):**

```json
{ "success": false, "message": "Số giấy phép lái xe đã tồn tại" }
```

```json
{ "success": false, "message": "Trạng thái không hợp lệ" }
```

---

## 3. Bookings

### 3.1 Xem xe khả dụng 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/bookings/available` |
| **Auth** | 🔒 Bearer Token |

**Query Params:**

| Param | Type | Mô tả |
|---|---|---|
| `start_date` | `string` | Ngày bắt đầu thuê (ISO format) |
| `end_date` | `string` | Ngày kết thúc thuê (ISO format) |

**Ví dụ Postman:**

```
GET /api/bookings/available?start_date=2026-03-10&end_date=2026-03-15
```

**Response (200):**

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
      "vehicle_type": { "type_name": "Sedan", "category": "sedan" }
    }
  ]
}
```

---

### 2.2 Tạo đơn đặt xe 🔒 (Customer)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/bookings` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

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

> `rental_type`: `"self_drive"` (tự lái) hoặc `"with_driver"` (có tài xế)

**Response (201):**

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

---

### 2.3 Huỷ đơn đặt xe 🔒 (Customer / Staff)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/bookings/:id/cancel` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` (chỉ huỷ đơn mình) / `staff` (huỷ bất kỳ) |

**Ví dụ Postman:**

```
PUT /api/bookings/665c.../cancel
```

**Không cần Body.**

**Response (200) — Đơn pending:**

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

**Response (200) — Đơn confirmed (đã cọc):**

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

---

### 2.4 Xem danh sách đơn của tôi 🔒 (Customer)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/bookings/my-bookings` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả | Mặc định |
|---|---|---|---|
| `status` | `string` | Lọc theo trạng thái (`pending`, `confirmed`, `in_progress`, ...) | Tất cả |
| `page` | `number` | Trang | `1` |
| `limit` | `number` | Số đơn mỗi trang | `10` |

**Ví dụ Postman:**

```
GET /api/bookings/my-bookings?status=confirmed&page=1&limit=5
```

**Response (200):**

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

---

### 2.5 Xem chi tiết đơn 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/bookings/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` (chỉ đơn mình) / `staff` / `driver` |

**Ví dụ Postman:**

```
GET /api/bookings/665c...
```

**Response (200):**

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
    "total_amount": 4000000,
    "deposit_amount": 1200000
  }
}
```

---

### 2.6 Xem tất cả đơn (Staff) 🔒

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/bookings/all` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả | Mặc định |
|---|---|---|---|
| `status` | `string` | Lọc theo trạng thái | Tất cả |
| `page` | `number` | Trang | `1` |
| `limit` | `number` | Số đơn mỗi trang | `20` |

**Ví dụ Postman:**

```
GET /api/bookings/all?status=pending&page=1&limit=20
```

---

### 2.7 Cập nhật đơn đặt xe 🔒 (Staff)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/bookings/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

> Chỉ cho sửa khi đơn đang `pending` hoặc `confirmed`. Tự động tính lại tổng tiền & tiền cọc khi đổi xe hoặc sửa ngày.

**Body (JSON) — Tất cả field đều tuỳ chọn:**

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

**Response (200):**

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

**Lỗi (400) — Xe bị trùng lịch:**

```json
{
  "message": "Xe mới đã có khách đặt trong khoảng thời gian này."
}
```

**Lỗi (400) — Trạng thái không cho phép:**

```json
{
  "message": "Đơn đang ở trạng thái \"in_progress\", không thể chỉnh sửa."
}
```

---

### 2.8 Xoá đơn đặt xe 🔒 (Staff)

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/bookings/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

> Chỉ xoá được đơn đang `pending` hoặc `cancelled`. Đơn đã confirmed trở lên phải huỷ trước.

**Ví dụ Postman:**

```
DELETE /api/bookings/665c...
```

**Không cần Body.**

**Response (200):**

```json
{
  "success": true,
  "message": "Đã xoá đơn đặt xe thành công."
}
```

**Lỗi (400) — Trạng thái không cho phép:**

```json
{
  "message": "Đơn đang ở trạng thái \"confirmed\", không thể xoá. Chỉ xoá được đơn pending hoặc cancelled."
}
```

---

## 4. Payments

### 4.1 Thanh toán tiền cọc 🔒 (Customer)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/payments/deposit` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

**Body (JSON):**

```json
{
  "booking_id": "665c...",
  "payment_method": "momo",
  "transaction_id": "MOMO_TXN_123456"
}
```

> `payment_method`: `"cash"` | `"card"` | `"momo"` | `"zalopay"` | `"vnpay"`

**Response (200):**

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

---

### 3.2 Thanh toán chốt sổ (Final) 🔒 (Customer)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/payments/final` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

> Chỉ gọi được khi đơn ở trạng thái `vehicle_returned` (đã trả xe, chờ thanh toán).

**Body (JSON):**

```json
{
  "booking_id": "665c...",
  "payment_method": "vnpay",
  "transaction_id": "VNPAY_TXN_789"
}
```

**Response (200):**

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

> Sau khi thanh toán:
> - Booking chuyển sang `completed`
> - Customer được cộng `loyalty_points`, `total_bookings`, `total_spent`
> - Driver (nếu có) được cộng `total_trips` và chuyển về `available`

---

### 3.3 Xem tất cả giao dịch 🔒 (Staff)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/payments` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả | Mặc định |
|---|---|---|---|
| `payment_type` | `string` | `deposit`, `rental_fee`, `extension_fee`, `penalty`, `refund` | Tất cả |
| `status` | `string` | `pending`, `completed`, `failed`, `refunded` | Tất cả |
| `payment_method` | `string` | `cash`, `card`, `momo`, `zalopay`, `vnpay` | Tất cả |
| `booking_id` | `string` | Lọc theo đơn đặt xe | Tất cả |
| `page` | `number` | Trang | `1` |
| `limit` | `number` | Số giao dịch mỗi trang | `20` |

**Ví dụ Postman:**

```
GET /api/payments?payment_type=deposit&status=completed
GET /api/payments?booking_id=665c...
```

**Response (200):**

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

---

### 3.4 Xem chi tiết 1 giao dịch 🔒 (Staff)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/payments/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Ví dụ Postman:**

```
GET /api/payments/pay1...
```

**Response (200):**

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

---

### 3.5 Khách hàng xem lịch sử thanh toán 🔒 (Customer)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/payments/my-payments` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả | Mặc định |
|---|---|---|---|
| `payment_type` | `string` | Lọc loại giao dịch | Tất cả |
| `status` | `string` | Lọc trạng thái | Tất cả |
| `page` | `number` | Trang | `1` |
| `limit` | `number` | Số giao dịch mỗi trang | `10` |

**Ví dụ Postman:**

```
GET /api/payments/my-payments?payment_type=deposit
```

**Response (200):**

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

---

### 3.6 Xem giao dịch theo đơn đặt xe 🔒 (Staff / Customer chủ đơn)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/payments/booking/:bookingId` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` / `customer` (chỉ xem đơn của mình) |

> Trả về toàn bộ giao dịch của 1 đơn + **tóm tắt tài chính** (tổng đã trả, đã hoàn, còn nợ).

**Ví dụ Postman:**

```
GET /api/payments/booking/665c...
```

**Response (200):**

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

---

## 5. Driver Assignment

### 5.1 Phân công tài xế 🔒 (Staff)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/driver-assignment` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

> Chỉ áp dụng cho đơn `rental_type = "with_driver"` và trạng thái `confirmed`.

**Body (JSON):**

```json
{
  "booking_id": "665c...",
  "driver_id": "driver123..."
}
```

**Response (201):**

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

---

### 4.2 Tài xế phản hồi phân công 🔒 (Driver)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/driver-assignment/:id/respond` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `driver` |

**Body (JSON) — Nhận chuyến:**

```json
{
  "status": "accepted",
  "response_note": "Tôi nhận chuyến này"
}
```

**Body (JSON) — Từ chối:**

```json
{
  "status": "rejected",
  "response_note": "Tôi bận rồi"
}
```

**Response (200) — Nhận chuyến:**

```json
{
  "success": true,
  "message": "Nhận chuyến thành công!",
  "data": {
    "_id": "assignment1...",
    "status": "accepted"
  }
}
```

> Khi tài xế `accepted`:
> - `booking.driver` được gán = tài xế này
> - `driver.status` chuyển sang `"busy"`

---

### 4.3 Tài xế xem chuyến của mình 🔒 (Driver)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/driver-assignment/my-assignments` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `driver` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả |
|---|---|---|
| `status` | `string` | Lọc theo trạng thái (`pending`, `accepted`, `rejected`) |

**Ví dụ Postman:**

```
GET /api/driver-assignment/my-assignments?status=accepted
```

**Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "assignment1...",
      "status": "accepted",
      "booking": {
        "_id": "booking1...",
        "start_date": "2026-03-10",
        "end_date": "2026-03-15",
        "vehicle": { "brand": "Toyota", "model": "Camry" },
        "customer": {
          "user": { "full_name": "Nguyễn Văn A", "phone": "090..." }
        }
      }
    }
  ]
}
```

---

### 4.4 Lấy tất cả phân công 🔒 (Staff)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/driver-assignment` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả |
|---|---|---|
| `status` | `string` | Lọc theo trạng thái (`pending`, `accepted`, `rejected`) |
| `driver_id` | `string` | Lọc theo ID tài xế |
| `booking_id` | `string` | Lọc theo ID đơn đặt xe |

**Ví dụ Postman:**

```
GET /api/driver-assignment?status=pending
GET /api/driver-assignment?driver_id=driver123...
GET /api/driver-assignment?booking_id=665c...
```

**Response (200):**

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

---

### 4.5 Xem chi tiết 1 phân công 🔒 (Staff / Driver)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/driver-assignment/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff`, `driver` |

> Driver chỉ xem được assignment của chính mình.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "assignment1...",
    "status": "pending",
    "assigned_at": "2026-03-01T10:00:00Z",
    "response_note": null,
    "booking": {
      "_id": "booking1...",
      "rental_type": "with_driver",
      "start_date": "2026-03-10",
      "end_date": "2026-03-15",
      "pickup_location": "123 Nguyễn Huệ, Q1",
      "return_location": "456 Lê Lợi, Q1",
      "status": "confirmed",
      "total_amount": 5000000,
      "vehicle": {
        "brand": "Toyota",
        "model": "Camry",
        "license_plate": "51A-12345",
        "vehicle_type": { "type_name": "Sedan 4 chỗ", "seat_capacity": 4 }
      },
      "customer": {
        "user": { "full_name": "Nguyễn Văn A", "phone": "090...", "email": "a@gmail.com", "avatar_url": "" }
      }
    },
    "driver": {
      "user": { "full_name": "Trần Văn B", "phone": "091...", "email": "b@gmail.com" }
    },
    "assigned_by": {
      "user": { "full_name": "Lê Thị C" }
    }
  }
}
```

---

### 4.6 Cập nhật phân công — Đổi tài xế 🔒 (Staff)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/driver-assignment/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

> Chỉ cho đổi tài xế khi assignment ở trạng thái `pending` hoặc `rejected`. Nếu đã `accepted` phải huỷ trước (DELETE) rồi tạo mới.

**Body (JSON):**

```json
{
  "driver_id": "newDriver456..."
}
```

**Response (200):**

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

**Lỗi (400) — Assignment đã được nhận:**

```json
{
  "message": "Không thể sửa phân công đã được tài xế nhận. Hãy huỷ trước rồi tạo mới."
}
```

---

### 4.7 Huỷ phân công 🔒 (Staff)

| | |
|---|---|
| **Method** | `DELETE` |
| **URL** | `/api/driver-assignment/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

> Nếu assignment đang ở trạng thái `accepted`:
> - `booking.driver` được gỡ về `null`
> - `driver.status` chuyển về `"available"`

**Response (200):**

```json
{
  "success": true,
  "message": "Đã huỷ phân công thành công."
}
```

---

## 6. Handovers (Biên bản bàn giao xe)

### 6.1 Lập biên bản giao xe (Delivery) 🔒 (Staff)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/handovers/delivery` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

> Chỉ tạo khi booking đang `confirmed`. Sau khi tạo: booking → `in_progress`, vehicle → `rented`.

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

> - `mileage`: Số km ODO hiện tại lúc giao, nếu không truyền sẽ lấy `vehicle.current_mileage`
> - `battery_level_percentage`: % pin (xe điện), mặc định 100
> - `customer_signature`: Chữ ký khách hàng (base64), có thể `null`

**Response (201):**

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

---

### 5.2 Lập biên bản nhận lại xe (Return) 🔒 (Staff)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/handovers/return` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

> Chỉ tạo khi booking đang `in_progress`. Sau khi tạo: booking → `vehicle_returned`, vehicle → `available`.

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

> - `return_mileage` **(bắt buộc)**: Số km ODO lúc trả, phải >= số km lúc giao
> - `battery_level_percentage`: % pin lúc trả (xe điện)
> - `penalty_amount`: Tiền phạt (nếu có), mặc định `0`
> - `charging_fee`: Tự động tính = `(pin_giao - pin_trả) / 100 × battery_capacity_kwh × charging_cost_per_kwh`
> - `final_amount = total_amount + charging_fee + penalty - deposit_amount`

**Response (201):**

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

---

### 5.3 Xem tất cả biên bản bàn giao 🔒 (Staff)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/handovers` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả | Mặc định |
|---|---|---|---|
| `handover_type` | `string` | Lọc loại: `delivery` hoặc `return` | Tất cả |
| `booking_id` | `string` | Lọc theo đơn đặt xe | Tất cả |
| `page` | `number` | Trang | `1` |
| `limit` | `number` | Số biên bản mỗi trang | `20` |

**Ví dụ Postman:**

```
GET /api/handovers?handover_type=delivery&page=1
GET /api/handovers?booking_id=665c...
```

**Response (200):**

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

---

### 5.4 Xem chi tiết 1 biên bản 🔒 (Staff)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/handovers/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Ví dụ Postman:**

```
GET /api/handovers/handover1...
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "handover1...",
    "handover_type": "delivery",
    "handover_time": "2026-03-10T08:00:00.000Z",
    "mileage": 35000,
    "battery_level_percentage": 95,
    "notes": "Xe tình trạng tốt, pin đầy",
    "confirmed_by_customer": true,
    "booking": {
      "_id": "booking1...",
      "status": "in_progress",
      "customer": { "user": { "full_name": "Nguyễn Văn A", "phone": "090...", "email": "a@gmail.com" } },
      "driver": { "user": { "full_name": "Trần Văn B", "phone": "091..." } }
    },
    "vehicle": {
      "brand": "VinFast", "model": "VF8", "license_plate": "51A-12345",
      "vehicle_type": { "type_name": "SUV điện 5 chỗ" }
    },
    "staff": { "user": { "full_name": "Lê Thị C" } }
  }
}
```

---

### 5.5 Xem biên bản theo đơn đặt xe 🔒 (Staff / Customer chủ đơn)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/handovers/booking/:bookingId` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` / `customer` (chỉ xem đơn của mình) |

> Trả về cặp biên bản delivery + return của 1 đơn. Nếu cả 2 đều có → tính thêm **km_driven** (km đã chạy).

**Ví dụ Postman:**

```
GET /api/handovers/booking/665c...
```

**Response (200):**

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

> Nếu chưa trả xe: `return = null`, `km_driven = null`.

---

## 7. Extensions (Gia hạn thuê xe)

### 7.1 Yêu cầu gia hạn 🔒 (Customer)

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/extensions/request` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

> Chỉ gửi khi booking đang `confirmed` hoặc `in_progress`.

**Body (JSON):**

```json
{
  "booking_id": "665c...",
  "new_end_date": "2026-03-20"
}
```

**Response (201):**

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

---

### 6.2 Staff duyệt gia hạn 🔒 (Staff)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/extensions/:id/approve` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Ví dụ Postman:**

```
PUT /api/extensions/ext1.../approve
```

**Không cần Body.**

**Response (200):**

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

> Sau khi duyệt:
> - `booking.end_date` → ngày mới
> - `booking.total_amount` += tiền gia hạn

---

### 6.3 Staff từ chối gia hạn 🔒 (Staff)

| | |
|---|---|
| **Method** | `PUT` |
| **URL** | `/api/extensions/:id/reject` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Body (JSON — tuỳ chọn):**

```json
{
  "reject_reason": "Xe đã có người đặt trong khoảng thời gian này"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Đã từ chối yêu cầu gia hạn.",
  "data": {
    "extension_status": "rejected"
  }
}
```

---

### 6.4 Xem tất cả yêu cầu gia hạn 🔒 (Staff)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/extensions` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả | Mặc định |
|---|---|---|---|
| `status` | `string` | `pending`, `approved`, `rejected`, `alternative_offered` | Tất cả |
| `booking_id` | `string` | Lọc theo đơn đặt xe | Tất cả |
| `page` | `number` | Trang | `1` |
| `limit` | `number` | Số yêu cầu mỗi trang | `20` |

**Ví dụ Postman:**

```
GET /api/extensions?status=pending
GET /api/extensions?booking_id=665c...
```

**Response (200):**

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

---

### 6.5 Xem chi tiết 1 yêu cầu gia hạn 🔒 (Staff / Customer chủ yêu cầu)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/extensions/:id` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `staff` / `customer` (chỉ xem yêu cầu của mình) |

**Ví dụ Postman:**

```
GET /api/extensions/ext1...
```

**Response (200):**

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

### 6.6 Khách hàng xem yêu cầu gia hạn của mình 🔒 (Customer)

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/extensions/my-requests` |
| **Auth** | 🔒 Bearer Token |
| **Role** | `customer` |

**Query Params (tuỳ chọn):**

| Param | Type | Mô tả | Mặc định |
|---|---|---|---|
| `status` | `string` | Lọc theo trạng thái | Tất cả |
| `page` | `number` | Trang | `1` |
| `limit` | `number` | Số yêu cầu mỗi trang | `10` |

**Ví dụ Postman:**

```
GET /api/extensions/my-requests?status=pending
```

**Response (200):**

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

## Flow tổng quan — Test trên Postman theo thứ tự

```
1. POST /api/auth/register          → Tạo tài khoản Customer
2. POST /api/auth/login              → Lấy Token
3. GET  /api/bookings/available      → Xem xe trống
4. POST /api/bookings                → Tạo đơn (pending)
5. POST /api/payments/deposit        → Thanh toán cọc (→ confirmed)
6. POST /api/driver-assignment       → [Staff] Phân công tài xế (nếu with_driver)
7. PUT  /api/driver-assignment/:id/respond → [Driver] Nhận/Từ chối chuyến
8. POST /api/handovers/delivery      → [Staff] Giao xe (→ in_progress)
9. POST /api/extensions/request      → [Customer] Gia hạn (tuỳ chọn)
10. PUT /api/extensions/:id/approve  → [Staff] Duyệt gia hạn
11. POST /api/handovers/return       → [Staff] Nhận lại xe (→ vehicle_returned)
12. POST /api/payments/final         → [Customer] Thanh toán chốt sổ (→ completed)
```

---

## Trạng thái Booking

```
pending → confirmed → in_progress → vehicle_returned → completed
   ↓          ↓
cancelled  cancelled (+ refund cọc)
```

| Trạng thái | Mô tả |
|---|---|
| `pending` | Chờ thanh toán cọc |
| `confirmed` | Đã cọc, chờ giao xe |
| `in_progress` | Đang thuê xe |
| `vehicle_returned` | Đã trả xe, chờ thanh toán |
| `completed` | Hoàn tất |
| `cancelled` | Đã huỷ |
| `deposit_lost` | Mất cọc (quá hạn check-in) |
