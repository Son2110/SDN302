import { Routes, Route } from "react-router-dom";

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

function App() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

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
  );
}

export default App;
