import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { title: "DỊCH VỤ", to: "/#services", type: "anchor" },
  { title: "ĐỘI XE", to: "/fleet", type: "route" },
  { title: "VỀ CHÚNG TÔI", to: "/#about", type: "anchor" },
  { title: "LIÊN HỆ", to: "/#contact", type: "anchor" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Đổi nền khi scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Scroll mượt khi click anchor
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  return (
    <nav
  className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
    ${
      isHome
        ? isScrolled
          ? "bg-black/80 backdrop-blur-lg border-b border-white/10 py-4"
          : "bg-transparent py-6"
        : "bg-black/90 backdrop-blur-lg border-b border-white/10 py-4"
    }
  `}
>
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-auto flex items-center justify-center transition-transform group-hover:rotate-6">
              <img
                src="/logo.png"
                alt="LuxeDrive Logo"
                className="h-12 w-auto object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-widest uppercase text-white">
              Luxedrive
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-10">
            {menuItems.map((item) =>
              item.type === "route" ? (
                <Link
                  key={item.title}
                  to={item.to}
                  className={`text-[13px] font-bold tracking-[0.2em] transition-colors ${
                    location.pathname === item.to
                      ? "text-blue-400"
                      : "text-gray-300 hover:text-blue-400"
                  }`}
                >
                  {item.title}
                </Link>
              ) : (
                <a
                  key={item.title}
                  href={item.to}
                  className="text-[13px] font-bold tracking-[0.2em] text-gray-300 hover:text-blue-400 transition-colors"
                >
                  {item.title}
                </a>
              )
            )}

            {/* CTA */}
            <Link
              to="/register"
              className="ml-4 rounded-full bg-blue-600 px-8 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white
              hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
            >
              ĐĂNG KÝ NGAY
            </Link>
          </div>

          {/* Mobile Menu Icon */}
          <div className="md:hidden text-white cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-8 h-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
