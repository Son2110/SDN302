import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import NotificationDropdown from "./NotificationDropdown";

const menuItems = [
  { title: "FLEET", to: "/fleet", type: "route" },
  { title: "ABOUT US", to: "/about", type: "route" },
  { title: "CONTACT", to: "/contact", type: "route" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const { user, logout: handleLogoutContext } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const userMenuRef = useRef(null);

  // Change navbar background while scrolling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scroll for anchor links
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

  const handleLogout = () => {
    handleLogoutContext();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowUserMenu(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showUserMenu]);

  useEffect(() => {
    setShowUserMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300
        ${isHome
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
                  className={`text-[13px] font-bold tracking-[0.2em] transition-colors ${location.pathname === item.to
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
          </div>

          {/* User Menu or Auth Buttons + Mobile Icon */}
          <div className="flex items-center gap-2 md:gap-4">
            {user ? (
              <div className="flex items-center gap-2 md:gap-4">
                <NotificationDropdown isNavbar={true} />
                <div className="relative" ref={userMenuRef}>
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 rounded-full bg-blue-600 px-3 md:px-4 py-2 md:py-2.5 text-[10px] md:text-[12px] font-bold uppercase tracking-wider text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    <User size={16} />
                    <span className="hidden sm:inline">
                      {user.full_name || user.email.split("@")[0]}
                    </span>
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowUserMenu(false)}
                      >
                        My Profile
                      </Link>
                      {(!user.roles || user.roles.includes("customer")) && (
                        <>
                          <Link
                            to="/my-bookings"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowUserMenu(false)}
                          >
                            My Bookings
                          </Link>
                          <Link
                            to="/my-payments"
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                            onClick={() => setShowUserMenu(false)}
                          >
                            Payment History
                          </Link>
                          {!user.roles?.includes("driver") && (
                            <Link
                              to="/driver-registration"
                              className="block px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-semibold"
                              onClick={() => setShowUserMenu(false)}
                            >
                              Driver Registration
                            </Link>
                          )}
                        </>
                      )}
                      {user.roles?.includes("staff") && (
                        <Link
                          to="/staff/bookings"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Internal Management
                        </Link>
                      )}
                      {user.roles?.includes("driver") && (
                        <Link
                          to="/driver/assignments"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          My Trips
                        </Link>
                      )}
                      {user.roles?.includes("admin") && (
                        <Link
                          to="/admin/revenue"
                          className="block px-4 py-2 text-sm text-gray-900 hover:bg-gray-100 font-semibold"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 md:gap-3 ml-2">
                <Link
                  to="/login"
                  className="rounded-full border border-blue-600 px-3 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[12px] font-bold uppercase tracking-wider text-blue-600
                  hover:bg-blue-600 hover:text-white transition-all whitespace-nowrap"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:block rounded-full bg-blue-600 px-3 md:px-6 py-1.5 md:py-2 text-[10px] md:text-[12px] font-bold uppercase tracking-wider text-white
                  hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all whitespace-nowrap"
                >
                  SIGN UP
                </Link>
              </div>
            )}

            {/* Mobile Menu Icon */}
            <button
              className="md:hidden text-white cursor-pointer ml-2"
              onClick={() => setShowMobileMenu((prev) => !prev)}
              aria-label="Toggle mobile menu"
            >
              {showMobileMenu ? (
                <X className="w-8 h-8" />
              ) : (
                <Menu className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="md:hidden mt-4 rounded-2xl border border-white/10 bg-black/90 backdrop-blur-lg p-4 space-y-3">
            {menuItems.map((item) => (
              <Link
                key={item.title}
                to={item.to}
                className="block text-sm font-bold tracking-wider text-gray-200 hover:text-blue-300"
              >
                {item.title}
              </Link>
            ))}

            {user ? (
              <div className="space-y-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-3 px-3">
                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                    {user.full_name?.[0] || user.email[0].toUpperCase()}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-white truncate">{user.full_name || user.email}</p>
                    <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/profile"
                  className="block text-sm font-semibold text-gray-100 hover:text-blue-300"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left text-sm font-semibold text-red-400 hover:text-red-300"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link
                  to="/login"
                  className="flex-1 text-center rounded-xl border border-blue-500 px-4 py-2 text-sm font-bold text-blue-300"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/register"
                  className="flex-1 text-center rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white"
                >
                  SIGN UP
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav >
  );
};

export default Navbar;
