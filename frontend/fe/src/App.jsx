import { Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";
import VehicleDetail from "./pages/FleetDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

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
      <Footer />
    </>
  );
}

export default App;
