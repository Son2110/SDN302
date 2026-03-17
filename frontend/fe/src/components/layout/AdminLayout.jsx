import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Users,
  LogOut,
  Home as HomeIcon,
  ShieldCheck,
} from "lucide-react";
import { logout } from "../../services/api";

const AdminLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navItems = [
    {
      label: "Revenue",
      icon: <TrendingUp className="w-5 h-5" />,
      path: "/admin/revenue",
    },
    {
      label: "User Management",
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
            <span>Back to Home</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 text-red-500 hover:bg-red-50 w-full px-4 py-3 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
