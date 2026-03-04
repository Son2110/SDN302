import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  { title: "DỊCH VỤ", to: "/#services", type: "anchor" },
  { title: "ĐỘI XE", to: "/fleet", type: "route" },
  { title: "VỀ CHÚNG TÔI", to: "/#about", type: "anchor" },
  { title: "LIÊN HỆ", to: "/#contact", type: "anchor" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { isAuthenticated, user, logout } = useAuth();

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

  // Đóng user menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.relative')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu]);

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

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="ml-4 relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 rounded-full bg-blue-600 px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                >
                  <span>{user?.full_name || user?.email || "User"}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-black/90 backdrop-blur-lg rounded-lg border border-white/20 shadow-lg z-50">
                    <div className="py-2">
                      <div className="px-4 py-2 text-sm text-gray-300 border-b border-white/10">
                        <div className="font-medium text-white">{user?.full_name || "User"}</div>
                        <div className="text-xs text-gray-400">{user?.email}</div>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        Dashboard
                      </Link>
                      <Link
                        to="/bookings"
                        onClick={() => setShowUserMenu(false)}
                        className="block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        Bookings của tôi
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setShowUserMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="ml-4 text-[13px] font-bold tracking-[0.2em] text-gray-300 hover:text-blue-400 transition-colors"
                >
                  ĐĂNG NHẬP
                </Link>
                <Link
                  to="/register"
                  className="ml-4 rounded-full bg-blue-600 px-8 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white
              hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                >
                  ĐĂNG KÝ NGAY
                </Link>
              </>
            )}
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
