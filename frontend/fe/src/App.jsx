import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import StaffLayout from "./components/layout/StaffLayout";
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";
import VehicleDetail from "./pages/FleetDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";

import StaffLayout from "./components/layout/StaffLayout";
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
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Staff Routes */}
      <Route path="/staff" element={<StaffLayout />}>
        <Route path="bookings" element={<StaffBookings />} />
        <Route path="bookings/:id" element={<StaffBookingDetail />} />
        <Route path="assignments" element={<StaffAssignments />} />
        <Route path="handovers" element={<StaffHandovers />} />
        <Route path="handovers/delivery" element={<HandoverDeliveryForm />} />
        <Route path="handovers/return" element={<HandoverReturnForm />} />
        <Route path="extensions" element={<StaffExtensions />} />
        <Route path="payments" element={<StaffPayments />} />
      </Route>

      {/* Main Routes - With Navbar/Footer */}
      <Route
        path="/*"
        element={
          <>
            <Navbar />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/fleet/:id" element={<VehicleDetail />} />
            </Routes>
            <Footer />
          </>
        }
      />
    </Routes>
  );
}

export default App;
