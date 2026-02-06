import { Routes, Route } from "react-router-dom";

import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";
import VehicleDetail from "./pages/FleetDetail"; // Import trang detail bạn vừa tạo

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fleet" element={<FleetPage />} />
        {/* Route cho trang chi tiết xe với tham số id */}
        <Route path="/fleet/:id" element={<VehicleDetail />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;