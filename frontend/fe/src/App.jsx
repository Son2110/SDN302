import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StaffLayout from "./components/layout/StaffLayout";
import DriverLayout from "./components/layout/DriverLayout";
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";
import VehicleDetail from "./pages/FleetDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";

import StaffBookings from "./pages/staff/StaffBookings";
import StaffBookingDetail from "./pages/staff/StaffBookingDetail";
import StaffAssignments from "./pages/staff/StaffAssignments";
import StaffHandovers from "./pages/staff/StaffHandovers";
import HandoverDeliveryForm from "./pages/staff/HandoverDeliveryForm";
import HandoverReturnForm from "./pages/staff/HandoverReturnForm";
import StaffExtensions from "./pages/staff/StaffExtensions";
import StaffPayments from "./pages/staff/StaffPayments";
import StaffDashboard from "./pages/staff/StaffDashboard";

// Shared Pages
import Profile from "./pages/shared/Profile";
import Unauthorized from "./pages/shared/Unauthorized";

// Driver Pages
import DriverAssignments from "./pages/driver/DriverAssignments";
import AssignmentDetail from "./pages/driver/AssignmentDetail";

function App() {
  return (
    <Routes>
      {/* ============================== */}
      {/* 1. PUBLIC ROUTES (No Login Required) */}
      {/* ============================== */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      
      {/* Main Public Pages (With Navbar & Footer) */}
      <Route element={
        <>
          <Navbar />
          <Outlet />
          <Footer />
        </>
      }>
        <Route path="/" element={<Home />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/:id" element={<VehicleDetail />} />
      </Route>

      {/* ============================== */}
      {/* 2. SHARED PROTECTED ROUTES (Any Login) */}
      {/* ============================== */}
      <Route element={<ProtectedRoute />}>
        {/* Profile uses standard Navbar but no Footer */}
        <Route path="/profile" element={
          <>
            <Navbar />
            <Profile />
          </>
        } />
      </Route>

      {/* ============================== */}
      {/* 3. STAFF ROUTES (Staff Only) */}
      {/* ============================== */}
      <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<Navigate to="bookings" replace />} />
          <Route path="bookings" element={<StaffBookings />} />
          <Route path="bookings/:id" element={<StaffBookingDetail />} />
          <Route path="assignments" element={<StaffAssignments />} />
          <Route path="handovers" element={<StaffHandovers />} />
          <Route path="handovers/delivery" element={<HandoverDeliveryForm />} />
          <Route path="handovers/return" element={<HandoverReturnForm />} />
          <Route path="extensions" element={<StaffExtensions />} />
          <Route path="payments" element={<StaffPayments />} />
        </Route>
      </Route>

      {/* ============================== */}
      {/* 4. DRIVER ROUTES (Driver Only) */}
      {/* ============================== */}
      <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
        <Route path="/driver" element={<DriverLayout />}>
          <Route index element={<Navigate to="assignments" replace />} />
          <Route path="assignments" element={<DriverAssignments />} />
          <Route path="assignments/:id" element={<AssignmentDetail />} />
        </Route>
      </Route>

      {/* Catch All - Redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
