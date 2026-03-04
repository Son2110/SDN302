import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";
import VehicleDetail from "./pages/VehicleDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import BookingNew from "./pages/BookingNew";
import BookingDetail from "./pages/BookingDetail";
import BookingsList from "./pages/BookingsList";
import CustomerDashboard from "./pages/CustomerDashboard";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <AuthProvider>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/vehicles/:id" element={<VehicleDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Booking Routes */}
        <Route
          path="/bookings/new"
          element={
            <ProtectedRoute>
              <BookingNew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <BookingsList />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bookings/:id"
          element={
            <ProtectedRoute>
              <BookingDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <CustomerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <Payment />
            </ProtectedRoute>
          }
        />
        <Route path="/payments/success" element={<PaymentSuccess />} />
      </Routes>

      <Footer />
    </AuthProvider>
  );
}

export default App;
