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
import StaffDashboard from "./pages/staff/StaffDashboard";

// Shared Pages
import Profile from "./pages/shared/Profile";
import Unauthorized from "./pages/shared/Unauthorized";

// Driver Pages
import DriverAssignments from "./pages/driver/DriverAssignments";
import AssignmentDetail from "./pages/driver/AssignmentDetail";

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Staff Routes - Protected */}
        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="/staff" element={<StaffLayout />}>
            <Route path="bookings" element={<StaffDashboard />} />
            <Route path="assignments" element={<StaffDashboard />} />
            <Route path="handovers" element={<StaffDashboard />} />
            <Route path="extensions" element={<StaffDashboard />} />
            <Route path="payments" element={<StaffDashboard />} />
          </Route>
        </Route>

        {/* Driver Routes - Protected */}
        <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
          <Route path="/driver">
            <Route path="assignments" element={<DriverAssignments />} />
            <Route path="assignments/:id" element={<AssignmentDetail />} />
          </Route>
        </Route>

        {/* Shared Protected Routes (Any role) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/profile" element={
            <>
              <Navbar />
              <Profile />
            </>
          } />
        </Route>

        {/* Main Public Routes */}
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
    </>
  );
}

export default App;
