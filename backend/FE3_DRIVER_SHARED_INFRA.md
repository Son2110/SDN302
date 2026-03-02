# 🚗 FE3 — Driver Dashboard + Shared Infrastructure

> **Người phụ trách:** FE3
> **Phạm vi:** Driver UI + Hạ tầng chung (Auth, ProtectedRoute, Layout, Toast) dùng cho cả 3 FE
> **Base URL:** `http://localhost:<PORT>/api`
> **Auth:** Mọi API đều gửi Header `Authorization: Bearer <token>`

---

## ⚠️ QUAN TRỌNG: Shared Infrastructure phải làm TRƯỚC

FE1 và FE2 đều phụ thuộc vào các components chung mà FE3 build. **Hoàn thành phần A trước**, push lên git, rồi FE1 & FE2 mới bắt đầu code pages.

---

## 📋 Danh sách chức năng cần implement

| # | Chức năng | Route FE | Ưu tiên |
|---|-----------|----------|---------|
| **A1** | **Auth Context / State Management** | (global) | 🔴 Làm đầu tiên |
| **A2** | **ProtectedRoute component** | (global) | 🔴 Làm đầu tiên |
| **A3** | **Role-based Layout & Routing** | (global) | 🔴 Làm đầu tiên |
| **A4** | **Toast / Notification component** | (global) | 🔴 Làm đầu tiên |
| **A5** | **Cập nhật Login/Register flow** | `/login`, `/register` | 🔴 |
| J1 | Driver Dashboard - Danh sách phân công | `/driver/assignments` | 🔴 |
| J2 | Chấp nhận / Từ chối phân công | (actions trong J1) | 🔴 |
| J3 | Chi tiết phân công | `/driver/assignments/:id` | 🟡 |
| J4 | Xem biên bản bàn giao | (section trong J3) | 🟡 |
| J5 | Profile page | `/profile` | 🟡 |

---

## 🔌 Chi tiết API Endpoints

---

## PHẦN A: SHARED INFRASTRUCTURE

---

### A1. Auth Context / State Management

#### API: Đăng ký

```
POST /api/auth/register
```

**Header:**
```
Content-Type: application/json
```

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

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `email` | `string` | ✅ | Email đăng nhập |
| `password` | `string` | ✅ | Mật khẩu |
| `full_name` | `string` | ✅ | Họ tên |
| `phone` | `string` | ✅ | SĐT |
| `id_card` | `string` | ✅ | CMND/CCCD |

**Response 201:**
```json
{
  "success": true,
  "_id": "665a...",
  "email": "nguyenvana@gmail.com",
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Xử lý FE:** Lưu `token` vào `localStorage` → gọi `GET /auth/me` để lấy user info + role → lưu vào context → redirect theo role.

---

#### API: Đăng nhập

```
POST /api/auth/login
```

**Header:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "email": "nguyenvana@gmail.com",
  "password": "123456"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `email` | `string` | ✅ | Email |
| `password` | `string` | ✅ | Mật khẩu |

**Response 200:**
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

**Xử lý FE:**
1. Lưu `token` → `localStorage.setItem("token", token)`
2. Lưu `data` → `localStorage.setItem("user", JSON.stringify(data))`
3. Set vào Auth Context
4. Redirect theo role:
   - `roles` chứa `"customer"` → `/my-bookings`
   - `roles` chứa `"staff"` → `/staff/bookings`
   - `roles` chứa `"driver"` → `/driver/assignments`

---

#### API: Xem thông tin cá nhân

```
GET /api/auth/me
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
    "_id": "665a...",
    "email": "nguyenvana@gmail.com",
    "full_name": "Nguyễn Văn A",
    "roles": ["customer"]
  }
}
```

**Xử lý FE:** Gọi khi app load (nếu có token trong localStorage) để verify token còn valid → set user vào context. Nếu 401 → xoá token → redirect login.

---

### A1. Cần implement: AuthContext

```jsx
// src/context/AuthContext.jsx — Cần tạo mới

/**
 * State cần quản lý:
 * - user: { _id, email, full_name, roles } | null
 * - token: string | null
 * - isAuthenticated: boolean
 * - loading: boolean (đang verify token)
 * 
 * Functions cần expose:
 * - login(email, password) → gọi POST /auth/login → lưu token + user → redirect
 * - register(userData) → gọi POST /auth/register → lưu token → gọi getMe → redirect
 * - logout() → xoá localStorage → set user = null → redirect /login
 * - getMe() → gọi GET /auth/me → set user
 * 
 * Logic khi app load:
 * 1. Check localStorage có token?
 * 2. Có → gọi GET /auth/me → thành công → set user → loading = false
 * 3. Không hoặc lỗi 401 → xoá token → loading = false
 */
```

---

### A2. Cần implement: ProtectedRoute

```jsx
// src/components/auth/ProtectedRoute.jsx — Cần tạo mới

/**
 * Props:
 * - allowedRoles: string[] — VD: ["customer"], ["staff"], ["driver"]
 * - children: ReactNode
 * 
 * Logic:
 * 1. Lấy { user, loading, isAuthenticated } từ AuthContext
 * 2. Nếu loading → hiện spinner
 * 3. Nếu !isAuthenticated → redirect /login
 * 4. Nếu user.roles không nằm trong allowedRoles → redirect /unauthorized hoặc /
 * 5. OK → render children
 * 
 * Sử dụng:
 * <Route path="/my-bookings" element={
 *   <ProtectedRoute allowedRoles={["customer"]}>
 *     <MyBookings />
 *   </ProtectedRoute>
 * } />
 */
```

---

### A3. Cần implement: App Routing cập nhật

```jsx
// src/App.jsx — Cần cập nhật

/**
 * Cấu trúc routes mới:
 * 
 * Public:
 *   /              → Home
 *   /fleet          → Fleet (danh sách xe)
 *   /fleet/:id      → FleetDetail
 *   /login          → Login
 *   /register       → Register
 * 
 * Customer (ProtectedRoute role="customer"):
 *   /my-bookings          → Danh sách đơn của tôi (FE1)
 *   /bookings/:id         → Chi tiết đơn (FE1)
 *   /booking/create       → Tạo đơn (FE1)
 *   /my-payments          → Lịch sử thanh toán (FE1)
 *   /my-extensions        → Yêu cầu gia hạn của tôi (FE1)
 *   /extensions/:id       → Chi tiết gia hạn (FE1)
 * 
 * Staff (ProtectedRoute role="staff"):
 *   /staff/bookings       → Quản lý đơn (FE2)
 *   /staff/bookings/:id   → Chi tiết đơn (FE2)
 *   /staff/assignments    → Quản lý phân công (FE2)
 *   /staff/handovers      → Quản lý bàn giao (FE2)
 *   /staff/extensions     → Quản lý gia hạn (FE2)
 *   /staff/payments       → Quản lý thanh toán (FE2)
 * 
 * Driver (ProtectedRoute role="driver"):
 *   /driver/assignments      → Phân công của tôi (FE3)
 *   /driver/assignments/:id  → Chi tiết phân công (FE3)
 * 
 * Shared:
 *   /profile            → Trang cá nhân (FE3)
 *   /unauthorized       → 403 page (FE3)
 */
```

---

### A4. Toast / Notification

```jsx
// src/components/shared/Toast.jsx — Cần tạo mới

/**
 * Toast component hiển thị thông báo:
 * - success: "Đã tạo đơn thành công"
 * - error: "Xe đã có người đặt trong khoảng thời gian này"
 * - info: "Đang xử lý..."
 * 
 * Có thể dùng thư viện: react-hot-toast, react-toastify, hoặc tự build.
 * 
 * Export helper function để dùng ở mọi nơi:
 * import { toast } from "../components/shared/Toast";
 * toast.success("Thành công!");
 * toast.error(error.message);
 */
```

---

### A5. Cập nhật Login/Register

Cập nhật file Login.jsx và Register.jsx hiện có để:
1. Dùng AuthContext thay vì gọi API trực tiếp
2. Redirect theo role sau login
3. Hiện toast khi lỗi
4. Loading state trên button

---

## PHẦN B: DRIVER DASHBOARD

---

### J1. Danh sách phân công của tôi

```
GET /api/driver-assignment/my-assignments
```

**Header:**
```
Authorization: Bearer <token>
```

**Query Params (tuỳ chọn):**

| Param | Type | Mặc định | Mô tả |
|---|---|---|---|
| `status` | `string` | Tất cả | `pending`, `accepted`, `rejected` |

**Ví dụ:**
```
GET /api/driver-assignment/my-assignments?status=pending
GET /api/driver-assignment/my-assignments?status=accepted
```

**Response 200:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "assignment1...",
      "status": "pending",
      "assigned_at": "2026-03-01T10:00:00Z",
      "booking": {
        "_id": "booking1...",
        "start_date": "2026-03-10",
        "end_date": "2026-03-15",
        "pickup_location": "123 Lê Lợi, Q.1",
        "return_location": "123 Lê Lợi, Q.1",
        "vehicle": { "brand": "Toyota", "model": "Camry" },
        "customer": {
          "user": { "full_name": "Nguyễn Văn A", "phone": "090..." }
        }
      }
    }
  ]
}
```

**UI gợi ý:** 
- Cards layout (mobile-friendly vì tài xế dùng điện thoại)
- Filter tabs: Chờ phản hồi | Đã nhận | Đã từ chối
- Mỗi card hiện: Xe, Khách, Ngày đi-về, Điểm đón/trả, Trạng thái
- Card pending → hiện 2 nút: ✅ Nhận | ❌ Từ chối

---

### J2. Chấp nhận / Từ chối phân công

```
PUT /api/driver-assignment/:id/respond
```

**Header:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

#### Body khi NHẬN chuyến:
```json
{
  "status": "accepted",
  "response_note": "Tôi nhận chuyến này"
}
```

#### Body khi TỪ CHỐI:
```json
{
  "status": "rejected",
  "response_note": "Tôi bận rồi"
}
```

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `status` | `string` | ✅ | `"accepted"` hoặc `"rejected"` |
| `response_note` | `string` | ❌ | Ghi chú phản hồi |

#### Response 200 — Nhận chuyến:
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

> Khi `accepted`: booking.driver = tài xế này, driver.status → `"busy"`

#### Response 200 — Từ chối:
```json
{
  "success": true,
  "message": "Đã từ chối phân công.",
  "data": {
    "_id": "assignment1...",
    "status": "rejected"
  }
}
```

**UI gợi ý:** 
- Nút "Nhận chuyến" → confirm dialog → call API `status: "accepted"` → toast success → refresh list
- Nút "Từ chối" → popup nhập lý do (optional) → call API `status: "rejected"` → toast → refresh list

---

### J3. Chi tiết phân công

```
GET /api/driver-assignment/:id
```

**Header:**
```
Authorization: Bearer <token>
```

> Driver chỉ xem được assignment của chính mình

**Response 200:**
```json
{
  "success": true,
  "data": {
    "_id": "assignment1...",
    "status": "accepted",
    "assigned_at": "2026-03-01T10:00:00Z",
    "response_note": "Tôi nhận chuyến này",
    "booking": {
      "_id": "booking1...",
      "rental_type": "with_driver",
      "start_date": "2026-03-10",
      "end_date": "2026-03-15",
      "pickup_location": "123 Nguyễn Huệ, Q1",
      "return_location": "456 Lê Lợi, Q1",
      "status": "in_progress",
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

**Lỗi 403:**
```json
{ "message": "Bạn không có quyền xem phân công này." }
```

**UI gợi ý:** Page chi tiết với:
- **Card Thông tin chuyến:** Xe, biển số, loại xe
- **Card Thông tin khách:** Tên, SĐT (có nút gọi), email
- **Card Lịch trình:** Ngày đi, ngày về, điểm đón, điểm trả
- **Card Trạng thái:** Badge status + ghi chú phản hồi
- Nếu status = `pending` → hiện 2 nút Nhận/Từ chối

---

### J4. Xem biên bản bàn giao theo booking

```
GET /api/handovers/booking/:bookingId
```

**Header:**
```
Authorization: Bearer <token>
```

> Lấy `bookingId` từ assignment.booking._id

**Response 200:**
```json
{
  "success": true,
  "data": {
    "booking_id": "665c...",
    "booking_status": "in_progress",
    "delivery": {
      "_id": "handover1...",
      "handover_type": "delivery",
      "handover_time": "2026-03-10T08:00:00.000Z",
      "mileage": 35000,
      "battery_level_percentage": 95,
      "notes": "Xe tình trạng tốt",
      "staff": { "user": { "full_name": "Lê Thị C" } }
    },
    "return": null,
    "km_driven": null
  }
}
```

> Nếu chưa trả xe: `return = null`, `km_driven = null`

**UI gợi ý:** Section collapse trong trang chi tiết phân công (J3):
- **Giao xe:** Thời gian, Km, % Pin, Ghi chú
- **Trả xe:** Thời gian, Km, % Pin, Ghi chú (nếu đã trả)
- **Đã chạy:** xxx km

---

### J5. Profile page

```
GET /api/auth/me
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
    "_id": "665a...",
    "email": "driver@gmail.com",
    "full_name": "Trần Văn B",
    "roles": ["driver"]
  }
}
```

**UI gợi ý:** Page đơn giản hiện thông tin cá nhân + nút Đăng xuất. Dùng chung cho cả 3 role.

---

## 📁 Cấu trúc thư mục gợi ý

```
src/
  context/
    AuthContext.jsx            ← A1 (SHARED)
  
  components/
    auth/
      AuthLayout.jsx           ← Đã có
      ProtectedRoute.jsx       ← A2 (SHARED - TẠO MỚI)
    shared/
      Toast.jsx                ← A4 (SHARED)
      LoadingSpinner.jsx       ← (SHARED)
      StatusBadge.jsx          ← (SHARED)
      Pagination.jsx           ← (SHARED)
    layout/
      Navbar.jsx               ← Cập nhật: hiện menu theo role
      Footer.jsx               ← Đã có
      StaffSidebar.jsx         ← (SHARED - sidebar cho staff pages)
      DriverSidebar.jsx        ← Sidebar cho driver pages
  
  pages/
    driver/
      DriverAssignments.jsx    ← J1 + J2
      AssignmentDetail.jsx     ← J3 + J4
    shared/
      Profile.jsx              ← J5
      Unauthorized.jsx         ← 403 page
  
  services/
    api.js                     ← Cập nhật: thêm interceptor auto attach token
    authApi.js                 ← Extract từ api.js
    driverAssignmentApi.js
    handoverApi.js
```

---

## 🔧 Checklist cho FE3

### Phase 1: Shared Infrastructure (Làm trước — FE1 & FE2 đợi)

- [ ] Tạo `AuthContext.jsx` với login/register/logout/getMe
- [ ] Tạo `ProtectedRoute.jsx` component
- [ ] Cập nhật `App.jsx` routing structure (khai báo routes cho cả 3 role, nhưng pages placeholder)
- [ ] Tạo Toast/Notification component
- [ ] Cập nhật `Navbar.jsx` hiện menu theo role (links khác nhau cho customer/staff/driver)
- [ ] Cập nhật `Login.jsx` & `Register.jsx` dùng AuthContext
- [ ] Cập nhật `services/api.js` thêm auto attach token
- [ ] Push lên git → **thông báo FE1 & FE2 bắt đầu**

### Phase 2: Driver Pages

- [ ] `DriverAssignments.jsx` — list + filter + accept/reject
- [ ] `AssignmentDetail.jsx` — chi tiết + handover info
- [ ] `Profile.jsx` — thông tin cá nhân

---

## 🔄 Driver Assignment Status & Actions

| Status | Hiển thị | Actions |
|--------|---------|---------|
| `pending` | 🟡 Chờ phản hồi | Nhận chuyến, Từ chối |
| `accepted` | 🟢 Đã nhận | Xem chi tiết (không action) |
| `rejected` | ❌ Đã từ chối | Xem chi tiết (không action) |

---

## 📱 Lưu ý UX cho Driver

- Driver thường dùng **điện thoại** → thiết kế **mobile-first**
- Cards layout thay vì tables
- Nút bấm lớn, dễ touch
- Thông tin khách có nút **gọi điện** trực tiếp (`tel:` link)
- Badge status dễ nhận biết bằng màu
