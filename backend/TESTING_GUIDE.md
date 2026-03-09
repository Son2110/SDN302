# 🧪 HƯỚNG DẪN TEST API — Thuê Xe Điện VinFast

## 📋 Mục lục

1. [Chuẩn bị](#1-chuẩn-bị)
2. [Tài khoản test](#2-tài-khoản-test)
3. [Luồng test chính: Tự lái](#3-luồng-test-chính-tự-lái-self_drive)
4. [Luồng test phụ: Có tài xế](#4-luồng-test-phụ-có-tài-xế-with_driver)
5. [Luồng gia hạn](#5-luồng-gia-hạn)
6. [Xe seed sẵn](#6-xe-seed-sẵn)

---

## 1. Chuẩn bị

```bash
# 1. Seed database
cd backend
node seed.js

# 2. Chạy server
npm run dev
```

**Base URL:** `http://localhost:{PORT}/api`

> Tất cả request cần token (trừ login/register) đều thêm Header:
> ```
> Authorization: Bearer <token>
> ```

---

## 2. Tài khoản test

| Role | Email | Password | Ghi chú |
|------|-------|----------|---------|
| **Customer** | `customer@test.com` | `Test@123` | Khách chính — có bằng lái, tự lái được |
| Customer 2 | `customer2@test.com` | `Test@123` | Khách phụ — có bằng lái |
| Customer 3 | `customer3@test.com` | `Test@123` | Không bằng lái → chỉ thuê có tài xế |
| **Driver** | `driver@test.com` | `Test@123` | Tài xế chính — available |
| Driver 2 | `driver2@test.com` | `Test@123` | Tài xế phụ — available |
| **Staff** | `staff@test.com` | `Test@123` | Nhân viên chính — xử lý mọi thứ |
| Staff 2 | `staff2@test.com` | `Test@123` | Nhân viên phụ |

---

## 3. Luồng test chính: Tự lái (self_drive)

> Dùng 3 account: **customer@test.com** (Customer), **staff@test.com** (Staff)
> Luồng: Login → Xem xe → Đặt xe → Confirm → Đặt cọc → Giao xe → Trả xe → Thanh toán cuối

---

### Bước 1: LOGIN (cả 2 account)

**🔵 Login Customer:**

```
POST /api/auth/login
```
```json
{
  "email": "customer@test.com",
  "password": "Test@123"
}
```

> ✅ Lưu lại `token` → gọi là `TOKEN_CUSTOMER`
> ✅ Lưu lại `data._id` → gọi là `USER_ID`

**🟢 Login Staff:**

```
POST /api/auth/login
```
```json
{
  "email": "staff@test.com",
  "password": "Test@123"
}
```

> ✅ Lưu lại `token` → gọi là `TOKEN_STAFF`

---

### Bước 2: Xem thông tin cá nhân (tuỳ chọn)

```
GET /api/auth/me
Authorization: Bearer <TOKEN_CUSTOMER>
```

> Kiểm tra roles có `customer` không

---

### Bước 3: XEM XE KHẢ DỤNG (Customer)

```
GET /api/bookings/available?start_date=2026-03-05&end_date=2026-03-08
Authorization: Bearer <TOKEN_CUSTOMER>
```

> ✅ Sẽ thấy 5 xe available (VF8 Xanh, VF8 Trắng, VF9 Đen, VF7 Đỏ, VF5 Cam)
> ✅ Lưu lại `_id` của xe muốn thuê → gọi là `VEHICLE_ID`

---

### Bước 4: TẠO ĐƠN ĐẶT XE (Customer)

```
POST /api/bookings
Authorization: Bearer <TOKEN_CUSTOMER>
```
```json
{
  "vehicle_id": "<VEHICLE_ID>",
  "rental_type": "self_drive",
  "start_date": "2026-03-05T08:00:00",
  "end_date": "2026-03-08T18:00:00",
  "pickup_location": "123 Đường Lê Lợi, Quận 1, TP.HCM",
  "return_location": "123 Đường Lê Lợi, Quận 1, TP.HCM"
}
```

> ✅ Response: booking status = `pending`
> ✅ Lưu lại `data._id` → gọi là `BOOKING_ID`
> ✅ Ghi nhớ `total_amount` và `deposit_amount`

---

### Bước 5: XEM ĐƠN CỦA TÔI (Customer)

```
GET /api/bookings/my-bookings
Authorization: Bearer <TOKEN_CUSTOMER>
```

> ✅ Kiểm tra thấy đơn vừa tạo

---

### Bước 6: STAFF XÁC NHẬN ĐƠN (Staff)

```
PUT /api/bookings/<BOOKING_ID>
Authorization: Bearer <TOKEN_STAFF>
```
```json
{
  "status": "confirmed"
}
```

> ✅ Response: booking status = `confirmed`

---

### Bước 7: CUSTOMER ĐẶT CỌC (Customer)

```
POST /api/payments/deposit
Authorization: Bearer <TOKEN_CUSTOMER>
```
```json
{
  "booking_id": "<BOOKING_ID>",
  "payment_method": "momo",
  "transaction_id": "MOMO-TEST-001"
}
```

> ✅ Response: payment status = `completed`, amount = deposit_amount

---

### Bước 8: STAFF LẬP BIÊN BẢN GIAO XE (Staff)

```
POST /api/handovers/delivery
Authorization: Bearer <TOKEN_STAFF>
```
```json
{
  "booking_id": "<BOOKING_ID>",
  "mileage": 5000,
  "battery_level_percentage": 100,
  "notes": "Xe pin đầy, tình trạng tốt, đủ giấy tờ",
  "customer_signature": "data:image/png;base64,test123"
}
```

> ✅ Response: booking_status = `in_progress`, vehicle_status = `rented`
> ✅ Lưu lại `data.handover._id` → gọi là `DELIVERY_HANDOVER_ID`

---

### Bước 9: STAFF LẬP BIÊN BẢN TRẢ XE (Staff)

> ⏰ Giả sử khách đã dùng xe xong, trả lại

```
POST /api/handovers/return
Authorization: Bearer <TOKEN_STAFF>
```
```json
{
  "booking_id": "<BOOKING_ID>",
  "return_mileage": 5350,
  "battery_level_percentage": 40,
  "notes": "Xe tình trạng bình thường, pin còn 40%",
  "penalty_amount": 0,
  "customer_signature": "data:image/png;base64,test456"
}
```

> ✅ Response sẽ có:
> - `charging_fee`: Phí sạc pin = `(100 - 40) / 100 × 82 kWh × 3,500 VND/kWh` = **172,200 VND**
> - `penalty_amount`: 0
> - `final_amount_to_pay`: total_amount + charging_fee + penalty - deposit_amount
> - `booking_status`: `vehicle_returned`
> - `vehicle_status`: `available`

---

### Bước 10: CUSTOMER THANH TOÁN CUỐI (Customer)

```
POST /api/payments/final
Authorization: Bearer <TOKEN_CUSTOMER>
```
```json
{
  "booking_id": "<BOOKING_ID>",
  "payment_method": "cash"
}
```

> ✅ Response: payment status = `completed`
> ✅ Booking chuyển sang `completed`

---

### Bước 11: XEM BIÊN BẢN BÀN GIAO (Tuỳ chọn)

**Customer hoặc Staff xem biên bản theo booking:**

```
GET /api/handovers/booking/<BOOKING_ID>
Authorization: Bearer <TOKEN_CUSTOMER hoặc TOKEN_STAFF>
```

> ✅ Thấy cặp delivery + return, `km_driven`, battery info

**Staff xem tất cả biên bản:**

```
GET /api/handovers?page=1&limit=10
Authorization: Bearer <TOKEN_STAFF>
```

**Staff xem chi tiết 1 biên bản:**

```
GET /api/handovers/<DELIVERY_HANDOVER_ID>
Authorization: Bearer <TOKEN_STAFF>
```

---

### Bước 12: XEM LỊCH SỬ THANH TOÁN (Tuỳ chọn)

**Customer xem payments của mình:**

```
GET /api/payments/my-payments
Authorization: Bearer <TOKEN_CUSTOMER>
```

**Staff xem payments theo booking:**

```
GET /api/payments/booking/<BOOKING_ID>
Authorization: Bearer <TOKEN_STAFF>
```

**Staff xem tất cả payments:**

```
GET /api/payments?page=1
Authorization: Bearer <TOKEN_STAFF>
```

---

## 4. Luồng test phụ: Có tài xế (with_driver)

> Dùng 3 account: **customer3@test.com** (Customer không bằng lái), **staff@test.com** (Staff), **driver@test.com** (Driver)

---

### Bước 1: Login cả 3 account

Login như Bước 1 ở trên, lưu 3 token:
- `TOKEN_CUSTOMER3` (customer3@test.com)
- `TOKEN_STAFF` (staff@test.com)
- `TOKEN_DRIVER` (driver@test.com)

---

### Bước 2: CUSTOMER3 ĐẶT XE CÓ TÀI XẾ

```
POST /api/bookings
Authorization: Bearer <TOKEN_CUSTOMER3>
```
```json
{
  "vehicle_id": "<VEHICLE_ID bất kỳ>",
  "rental_type": "with_driver",
  "start_date": "2026-03-10T07:00:00",
  "end_date": "2026-03-12T20:00:00",
  "pickup_location": "789 Đường Võ Văn Tần, Quận 3, TP.HCM",
  "return_location": "789 Đường Võ Văn Tần, Quận 3, TP.HCM"
}
```

> ✅ Lưu `BOOKING_ID_2`
> ✅ Lưu ý `total_amount` có cộng thêm phí tài xế 500,000/ngày

---

### Bước 3: STAFF XÁC NHẬN ĐƠN

```
PUT /api/bookings/<BOOKING_ID_2>
Authorization: Bearer <TOKEN_STAFF>
```
```json
{
  "status": "confirmed"
}
```

---

### Bước 4: STAFF PHÂN CÔNG TÀI XẾ

```
POST /api/driver-assignments
Authorization: Bearer <TOKEN_STAFF>
```
```json
{
  "booking_id": "<BOOKING_ID_2>",
  "driver_id": "<DRIVER_ID>"
}
```

> ✅ Lưu `ASSIGNMENT_ID`
> 💡 **driver_id**: Lấy từ GET assignments hoặc dùng ID từ database

**Xem danh sách tài xế (tuỳ chọn):**
```
GET /api/driver-assignments
Authorization: Bearer <TOKEN_STAFF>
```

---

### Bước 5: TÀI XẾ XÁC NHẬN / TỪ CHỐI

**Tài xế xem danh sách phân công:**
```
GET /api/driver-assignments/my-assignments
Authorization: Bearer <TOKEN_DRIVER>
```

**Tài xế chấp nhận:**
```
PUT /api/driver-assignments/<ASSIGNMENT_ID>/respond
Authorization: Bearer <TOKEN_DRIVER>
```
```json
{
  "status": "accepted",
  "response_note": "OK, tôi sẵn sàng"
}
```

> Hoặc từ chối:
> ```json
> {
>   "status": "rejected",
>   "response_note": "Tôi bận ngày đó"
> }
> ```

---

### Bước 6: TIẾP TỤC NHƯ LUỒNG TỰ LÁI

Customer đặt cọc → Staff giao xe → ... → Staff nhận xe → Customer thanh toán

(Giống Bước 7 → Bước 12 ở Luồng 3)

---

## 5. Luồng gia hạn

> Áp dụng khi booking đang `in_progress` (đã giao xe, chưa trả)

---

### Bước 1: CUSTOMER XIN GIA HẠN

```
POST /api/extensions/request
Authorization: Bearer <TOKEN_CUSTOMER>
```
```json
{
  "booking_id": "<BOOKING_ID đang in_progress>",
  "new_end_date": "2026-03-10T18:00:00"
}
```

> ✅ Lưu `EXTENSION_ID`

---

### Bước 2: STAFF DUYỆT GIA HẠN

**Xem danh sách yêu cầu:**
```
GET /api/extensions?status=pending
Authorization: Bearer <TOKEN_STAFF>
```

**Duyệt:**
```
PUT /api/extensions/<EXTENSION_ID>/approve
Authorization: Bearer <TOKEN_STAFF>
```

> ✅ Booking `end_date` tự cập nhật
> ✅ `additional_amount` được tính dựa trên số ngày gia hạn × daily_rate

**Hoặc từ chối:**
```
PUT /api/extensions/<EXTENSION_ID>/reject
Authorization: Bearer <TOKEN_STAFF>
```

---

### Bước 3: CUSTOMER XEM YÊU CẦU CỦA MÌNH

```
GET /api/extensions/my-requests
Authorization: Bearer <TOKEN_CUSTOMER>
```

---

## 6. Xe seed sẵn

| # | Model | Loại | Giá/ngày | Pin (kWh) | Biển số | Status |
|---|-------|------|----------|-----------|---------|--------|
| 1 | VinFast VF8 | SUV 5 chỗ | 900,000đ | 82 | 51F-00001 | ✅ available |
| 2 | VinFast VF8 | SUV 5 chỗ | 900,000đ | 82 | 51F-00002 | ✅ available |
| 3 | VinFast VF9 | SUV 7 chỗ | 1,300,000đ | 92 | 51F-00003 | ✅ available |
| 4 | VinFast VF7 | Sedan 5 chỗ | 750,000đ | 59.6 | 51F-00004 | ✅ available |
| 5 | VinFast VF5 | Mini EV 4 chỗ | 500,000đ | 42 | 51F-00005 | ✅ available |
| 6 | VinFast VF9 | SUV 7 chỗ | 1,200,000đ | 92 | 51F-00006 | 🔧 maintenance |

**Phí sạc pin:** 3,500 VND/kWh — tính tự động khi trả xe dựa trên % pin hao hụt.

**Công thức:** `charging_fee = (pin_giao% - pin_trả%) / 100 × battery_capacity_kwh × 3,500`

**Ví dụ:** Pin giao 100%, trả 40%, xe VF8 (82kWh):
`(100-40)/100 × 82 × 3500 = 0.6 × 82 × 3500 = 172,200 VND`

---

## 📌 Quick Checklist

- [  ] Seed database thành công
- [  ] Login Customer → lưu token
- [  ] Login Staff → lưu token
- [  ] Login Driver → lưu token
- [  ] Xem xe available
- [  ] Customer tạo booking (self_drive)
- [  ] Staff confirm booking
- [  ] Customer đặt cọc
- [  ] Staff giao xe (delivery handover)
- [  ] Staff nhận xe (return handover) — xem charging_fee
- [  ] Customer thanh toán cuối
- [  ] Xem biên bản bàn giao
- [  ] Test luồng with_driver + phân công tài xế
- [  ] Test luồng gia hạn
- [  ] Xem lịch sử thanh toán
