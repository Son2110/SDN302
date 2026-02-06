import { Routes, Route } from "react-router-dom";



import Navbar from "./components/layout/Navbar";
import Footer from "./components/layout/Footer";
import Home from "./pages/Home";
import FleetPage from "./pages/Fleet";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fleet" element={<FleetPage />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
