import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

// Layouts & Auth
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StaffLayout from "./components/layout/StaffLayout";
import DriverLayout from "./components/layout/DriverLayout";

// Public Pages
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";
import VehicleDetail from "./pages/FleetDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Shared Pages (Any authenticated user)
import CustomerProfile from "./pages/customer/Profile";
import Unauthorized from "./pages/shared/Unauthorized";

// Customer Pages
import MyBookings from "./pages/customer/MyBookings";
import BookingDetail from "./pages/customer/BookingDetail";
import MyPayments from "./pages/customer/MyPayments";
import DepositPayment from "./pages/customer/DepositPayment";
import PaymentPage from "./pages/customer/PaymentPage";
import ExtendBooking from "./pages/customer/ExtendBooking";
import DriverRegistration from "./pages/customer/DriverRegistration";

// Payment Pages (General)
import PaymentSuccess from "./pages/PaymentSuccess";

// Staff Pages
import StaffBookings from "./pages/staff/StaffBookings";
import StaffOverdueBookings from "./pages/staff/StaffOverdueBookings";
import StaffBookingDetail from "./pages/staff/StaffBookingDetail";
import StaffAssignments from "./pages/staff/StaffAssignments";
import StaffHandovers from "./pages/staff/StaffHandovers";
import HandoverDeliveryForm from "./pages/staff/HandoverDeliveryForm";
import HandoverReturnForm from "./pages/staff/HandoverReturnForm";
import StaffExtensions from "./pages/staff/StaffExtensions";
import StaffPayments from "./pages/staff/StaffPayments";
import StaffDashboard from "./pages/staff/StaffDashboard";

// Driver Pages
import DriverAssignments from "./pages/driver/DriverAssignments";
import AssignmentDetail from "./pages/driver/AssignmentDetail";

// Vehicle & Driver Management
import StaffVehicles from "./pages/staff/StaffVehicles";
import StaffDrivers from "./pages/staff/StaffDrivers";
import StaffAssignDriver from "./pages/staff/StaffAssignDriver";

// Admin Pages
import AdminLayout from "./components/layout/AdminLayout";
import AdminRevenue from "./pages/admin/AdminRevenue";
import AdminUsers from "./pages/admin/AdminUsers";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* ============================== */}
        {/* 1. PUBLIC ROUTES (No Login Required) */}
        {/* ============================== */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Main Public Pages (With Navbar & Footer) */}
        <Route
          element={
            <>
              <Navbar />
              <Outlet />
              <Footer />
            </>
          }
        >
          <Route path="/" element={<Home />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/fleet/:id" element={<VehicleDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Route>

        {/* ============================== */}
        {/* 2. SHARED PROTECTED ROUTES (Any Login) */}
        {/* ============================== */}
        <Route element={<ProtectedRoute />}>
          {/* Profile uses standard Navbar but no Footer */}
          <Route
            path="/profile"
            element={
              <>
                <Navbar />
                <CustomerProfile />
              </>
            }
          />
        </Route>

        {/* ============================== */}
        {/* 3. CUSTOMER ROUTES (Customer Only) */}
        {/* ============================== */}
        <Route element={<ProtectedRoute allowedRoles={["customer"]} />}>
          <Route
            element={
              <>
                <Navbar />
                <Outlet />
                <Footer />
              </>
            }
          >
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/my-payments" element={<MyPayments />} />
            <Route path="/bookings/:id" element={<BookingDetail />} />
            <Route path="/payment/success" element={<PaymentSuccess />} />
            <Route
              path="/payment/deposit/:id"
              element={<PaymentPage type="deposit" />}
            />
            <Route
              path="/payment/final/:id"
              element={<PaymentPage type="final" />}
            />
            <Route path="/booking/deposit/:id" element={<DepositPayment />} />
            <Route path="/bookings/:id/extend" element={<ExtendBooking />} />
            <Route
              path="/driver-registration"
              element={<DriverRegistration />}
            />
          </Route>
        </Route>

        {/* ============================== */}
        {/* 4. STAFF ROUTES (Staff Only) */}
        {/* ============================== */}
        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route index element={<Navigate to="bookings" replace />} />
            <Route path="bookings" element={<StaffBookings />} />
            <Route path="overdue-bookings" element={<StaffOverdueBookings />} />
            <Route path="bookings/:id" element={<StaffBookingDetail />} />
            <Route
              path="bookings/:id/assign-driver"
              element={<StaffAssignDriver />}
            />
            <Route path="assignments" element={<StaffAssignments />} />
            <Route path="handovers" element={<StaffHandovers />} />
            <Route
              path="handovers/delivery"
              element={<HandoverDeliveryForm />}
            />
            <Route path="handovers/return" element={<HandoverReturnForm />} />
            <Route path="extensions" element={<StaffExtensions />} />
            <Route path="payments" element={<StaffPayments />} />
            <Route path="dashboard" element={<StaffDashboard />} />
            <Route path="vehicles" element={<StaffVehicles />} />
            <Route path="drivers" element={<StaffDrivers />} />
          </Route>
        </Route>

        {/* ============================== */}
        {/* 5. DRIVER ROUTES (Driver Only) */}
        {/* ============================== */}
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver" element={<DriverLayout />}>
            <Route index element={<Navigate to="assignments" replace />} />
            <Route path="assignments" element={<DriverAssignments />} />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
          </Route>
        </Route>

        {/* ============================== */}
        {/* 6. ADMIN ROUTES (Admin Only)   */}
        {/* ============================== */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="revenue" replace />} />
            <Route path="revenue" element={<AdminRevenue />} />
            <Route path="users" element={<AdminUsers />} />
          </Route>
        </Route>

        {/* Catch All - Redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
