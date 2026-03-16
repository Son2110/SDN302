import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Car,
  Users,
  Clock,
  CreditCard,
  LogOut,
  FileText,
  Home as HomeIcon,
  Truck,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { logout } from "../../services/api";

const StaffLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Đơn đặt xe",
      icon: <Car className="w-5 h-5" />,
      path: "/staff/bookings",
    },
    {
      label: "Đơn quá hạn",
      icon: <AlertTriangle className="w-5 h-5" />,
      path: "/staff/overdue-bookings",
    },
    {
      label: "Quản lý xe",
      icon: <Truck className="w-5 h-5" />,
      path: "/staff/vehicles",
    },
    {
      label: "Quản lý tài xế",
      icon: <UserCheck className="w-5 h-5" />,
      path: "/staff/drivers",
    },
    {
      label: "Phân công tài xế",
      icon: <Users className="w-5 h-5" />,
      path: "/staff/assignments",
    },
    {
      label: "Biên bản bàn giao",
      icon: <FileText className="w-5 h-5" />,
      path: "/staff/handovers",
    },
    {
      label: "Yêu cầu gia hạn",
      icon: <Clock className="w-5 h-5" />,
      path: "/staff/extensions",
    },
    {
      label: "Thanh toán",
      icon: <CreditCard className="w-5 h-5" />,
      path: "/staff/payments",
    },
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
            Staff Panel
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-100 flex flex-col gap-2">
          <NavLink
            to="/"
            className="flex items-center space-x-3 text-gray-700 hover:bg-gray-100 w-full px-4 py-3 rounded-xl transition-colors font-medium border border-gray-200"
          >
            <HomeIcon className="w-5 h-5" />
            <span>Trở về Trang chủ</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-600 hover:bg-red-50 w-full px-4 py-3 rounded-xl transition-colors font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Đăng xuất</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-gray-200 h-16 flex items-center px-4 justify-between">
          <h2 className="text-lg font-bold text-blue-600">Staff Panel</h2>
          <button onClick={handleLogout} className="text-red-500">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffLayout;
