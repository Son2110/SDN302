import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  User,
  LogOut,
  Menu,
  Bell,
  CheckCheck,
  CalendarClock,
  AlertTriangle,
  ShieldCheck,
  CreditCard,
  X,
} from "lucide-react";
import {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/notificationApi";
import NotificationDropdown from "./NotificationDropdown";

const menuItems = [
  { title: "FLEET", to: "/fleet", type: "route" },
  { title: "ABOUT US", to: "/about", type: "route" },
  { title: "CONTACT", to: "/contact", type: "route" },
];

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { user, logout: handleLogoutContext } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const isHome = location.pathname === "/";
  const isCustomer = !!(
    user &&
    (!user.roles || user.roles.includes("customer"))
  );
  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

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
    setShowNotifMenu(false);
    setShowMobileMenu(false);
    navigate("/");
  };

  const fetchNotifications = async () => {
    if (!isCustomer) return;

    try {
      setLoadingNotifications(true);
      const data = await getMyNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Failed to load notifications", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  useEffect(() => {
    if (!isCustomer) return;

    fetchNotifications();

    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchNotifications();
      }
    }, 30000);

    return () => clearInterval(timer);
  }, [isCustomer]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showUserMenu &&
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target)
      ) {
        setShowUserMenu(false);
      }

      if (
        showNotifMenu &&
        notifMenuRef.current &&
        !notifMenuRef.current.contains(event.target)
      ) {
        setShowNotifMenu(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setShowUserMenu(false);
        setShowNotifMenu(false);
        setShowMobileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [showUserMenu, showNotifMenu]);

  useEffect(() => {
    setShowUserMenu(false);
    setShowNotifMenu(false);
    setShowMobileMenu(false);
  }, [location.pathname]);

  const getNotificationIcon = (type) => {
    if (["booking_created", "booking_approved", "pickup_reminder"].includes(type)) {
      return <CalendarClock size={16} className="text-blue-600" />;
    }
    if (["payment_success"].includes(type)) {
      return <CreditCard size={16} className="text-blue-600" />;
    }
    if (["payment_overdue", "return_overdue"].includes(type)) {
      return <AlertTriangle size={16} className="text-red-600" />;
    }
    if (["return_reminder"].includes(type)) {
      return <AlertTriangle size={16} className="text-blue-600" />;
    }
    return <ShieldCheck size={16} className="text-blue-600" />;
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleOpenNotificationMenu = () => {
    setShowNotifMenu((prev) => !prev);
    setShowUserMenu(false);
    setShowMobileMenu(false);
    if (!showNotifMenu) {
      fetchNotifications();
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.is_read) {
        await markNotificationAsRead(notification._id);
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, is_read: true } : n,
          ),
        );
      }

      if (notification.related_model === "Booking" && notification.related_id) {
        navigate(`/bookings/${notification.related_id}`);
      }
      setShowNotifMenu(false);
    } catch (error) {
      console.error("Failed to mark notification as read", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Failed to mark all notifications as read", error);
    }
  };

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
              ),
            )}

            {/* User Menu or Auth Buttons */}
            {user ? (
              <div className="flex items-center gap-4 ml-4">
                <NotificationDropdown isNavbar={true} />
                <div className="relative flex items-center gap-3">
                {isCustomer && (
                  <div className="relative" ref={notifMenuRef}>
                    <button
                      onClick={handleOpenNotificationMenu}
                      className="relative flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/40 bg-white/10 text-white transition hover:bg-white/20"
                      aria-label="Notifications"
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 min-w-[18px] px-1 h-[18px] rounded-full bg-red-600 text-[10px] leading-[18px] font-bold text-white text-center">
                          {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                      )}
                    </button>

                    {showNotifMenu && (
                      <div className="absolute right-0 mt-2 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                          <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
                          <button
                            onClick={handleMarkAllRead}
                            disabled={unreadCount === 0}
                            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
                          >
                            <CheckCheck size={14} />
                            Mark all read
                          </button>
                        </div>

                        <div className="max-h-[420px] overflow-y-auto">
                          {loadingNotifications ? (
                            <div className="px-4 py-6 text-sm text-gray-500">Loading notifications...</div>
                          ) : notifications.length === 0 ? (
                            <div className="px-4 py-8 text-sm text-gray-500 text-center">No notifications yet</div>
                          ) : (
                            notifications.slice(0, 20).map((notification) => (
                              <button
                                key={notification._id}
                                onClick={() => handleNotificationClick(notification)}
                                className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition ${notification.is_read ? "bg-white" : "bg-blue-50/50"}`}
                              >
                                <div className="flex items-start gap-3">
                                  <div className="mt-0.5">{getNotificationIcon(notification.type)}</div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-semibold text-gray-900 truncate">{notification.title}</p>
                                      {!notification.is_read && <span className="w-2 h-2 rounded-full bg-blue-600" />}
                                    </div>
                                    <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{notification.message}</p>
                                    <p className="text-[11px] text-gray-400 mt-1">{formatDateTime(notification.createdAt)}</p>
                                  </div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white
                    hover:bg-blue-700 transition-all"
                    >
                      <User size={16} />
                      {user.full_name || user.email}
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
              <div className="flex items-center gap-3 ml-4">
                <Link
                  to="/login"
                  className="rounded-full border-2 border-blue-600 px-6 py-2 text-[12px] font-bold uppercase tracking-wider text-blue-600
                  hover:bg-blue-600 hover:text-white transition-all"
                >
                  SIGN IN
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-blue-600 px-6 py-2 text-[12px] font-bold uppercase tracking-wider text-white
                  hover:bg-blue-700 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all"
                >
                  SIGN UP
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Icon */}
          <button
            className="md:hidden text-white cursor-pointer"
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
              <>
                {isCustomer && (
                  <button
                    onClick={handleOpenNotificationMenu}
                    className="w-full flex items-center justify-between rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white"
                  >
                    <span className="flex items-center gap-2">
                      <Bell size={16} /> Notifications
                    </span>
                    {unreadCount > 0 && (
                      <span className="min-w-[18px] px-1 h-[18px] rounded-full bg-red-600 text-[10px] leading-[18px] font-bold text-white text-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                )}
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
              </>
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
    </nav>
  );
};

export default Navbar;
