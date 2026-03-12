import { Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";
import VehicleDetail from "./pages/FleetDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Profile from "./pages/customer/Profile";
import CustomerInfo from "./pages/customer/CustomerInfo";
import DepositPayment from "./pages/customer/DepositPayment";
import ExtensionRequest from "./pages/customer/ExtensionRequest";
import MyExtensions from "./pages/customer/MyExtensions";
import ExtensionDetail from "./pages/customer/ExtensionDetail";
import CreateBooking from "./pages/customer/CreateBooking";
import MyBookings from "./pages/customer/MyBookings";
import BookingDetail from "./pages/customer/BookingDetail";
import PaymentPage from "./pages/customer/PaymentPage";
import Payment from "./pages/Payment";
import PaymentSuccess from "./pages/PaymentSuccess";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes */}
        <Route path="/profile" element={<Profile />} />
        <Route path="/booking/customer-info" element={<CustomerInfo />} />
        <Route path="/booking/deposit/:id" element={<DepositPayment />} />
        <Route path="/bookings/:bookingId/extend" element={<ExtensionRequest />} />
        <Route path="/my-extensions" element={<MyExtensions />} />
        <Route path="/extensions/:id" element={<ExtensionDetail />} />
        <Route path="/booking/create" element={<CreateBooking />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/bookings/:id" element={<BookingDetail />} />
        <Route path="/payment" element={<Payment />} />
        <Route path="/payment/deposit/:id" element={<PaymentPage type="deposit" />} />
        <Route path="/payment/final/:id" element={<PaymentPage type="final" />} />
        <Route path="/payment/success" element={<PaymentSuccess />} />

        {/* Main Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/fleet" element={<FleetPage />} />
        <Route path="/fleet/:id" element={<VehicleDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
