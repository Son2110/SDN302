import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  LogOut,
  Home as HomeIcon,
  ShieldCheck,
} from "lucide-react";
import { logout } from "../../services/api";
import NotificationDropdown from "./NotificationDropdown";

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Doanh thu",
      icon: <TrendingUp className="w-5 h-5" />,
      path: "/admin/revenue",
    },
    {
      label: "Quản lý người dùng",
      icon: <Users className="w-5 h-5" />,
      path: "/admin/users",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-gray-800" />
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
          </div>
          <p className="text-xs text-gray-400">LuxeDrive Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150 ${
                  isActive
                    ? "bg-gray-900 text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                }`
              }
            >
              {item.icon}
              <span className="font-medium text-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 flex flex-col gap-1">
          <NavLink
            to="/"
            className="flex items-center space-x-3 text-gray-500 hover:bg-gray-100 hover:text-gray-900 w-full px-4 py-3 rounded-lg transition-colors text-sm font-medium"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Trở về Trang chủ</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-500 hover:bg-red-50 w-full px-4 py-3 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center px-4 md:px-8 justify-between">
          <div className="flex items-center gap-2 md:hidden">
            <ShieldCheck className="w-5 h-5 text-gray-800" />
            <h2 className="text-lg font-bold text-gray-900">Admin Panel</h2>
          </div>
          <div className="hidden md:block"></div>
          <div className="flex items-center gap-4">
            <NotificationDropdown isNavbar={false} />
            <button onClick={handleLogout} className="text-red-500 md:hidden">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="p-6 md:p-8">
          <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
