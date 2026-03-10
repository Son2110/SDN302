import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { getUser, logout } from "../../services/api";
import {
    ClipboardList,
    Users,
    ArrowLeftRight,
    Clock,
    CreditCard,
    LogOut,
    Menu,
    X,
    ChevronRight,
} from "lucide-react";

const sidebarItems = [
    {
        title: "Quản lý đơn",
        to: "/staff/bookings",
        icon: ClipboardList,
    },
    {
        title: "Phân công tài xế",
        to: "/staff/assignments",
        icon: Users,
    },
    {
        title: "Bàn giao xe",
        to: "/staff/handovers",
        icon: ArrowLeftRight,
    },
    {
        title: "Gia hạn",
        to: "/staff/extensions",
        icon: Clock,
    },
    {
        title: "Thanh toán",
        to: "/staff/payments",
        icon: CreditCard,
    },
];

const StaffLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const user = getUser();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={`${sidebarOpen ? "w-64" : "w-20"
                    } bg-gray-900 text-white transition-all duration-300 flex flex-col`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
                    {sidebarOpen && (
                        <span className="text-lg font-bold tracking-wider">
                            LUXEDRIVE
                        </span>
                    )}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Staff badge */}
                {sidebarOpen && (
                    <div className="px-4 py-3">
                        <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-600 rounded-full uppercase tracking-wider">
                            Staff Panel
                        </span>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                                    : "text-gray-300 hover:bg-gray-800 hover:text-white"
                                }`
                            }
                        >
                            <item.icon size={20} />
                            {sidebarOpen && (
                                <>
                                    <span className="flex-1">{item.title}</span>
                                    <ChevronRight size={16} className="opacity-50" />
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* User info + Logout */}
                <div className="border-t border-gray-700 px-3 py-4">
                    {sidebarOpen && (
                        <div className="mb-3 px-3">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.full_name || user?.email}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-all"
                    >
                        <LogOut size={20} />
                        {sidebarOpen && <span>Đăng xuất</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto">
                <div className="p-6">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default StaffLayout;
