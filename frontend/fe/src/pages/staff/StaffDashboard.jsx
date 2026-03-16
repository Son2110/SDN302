import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  CreditCard,
  Car,
  Users,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  FileText,
  Truck,
  UserCheck,
} from "lucide-react";
import { getPaymentsList } from "../../services/paymentApiStaff";
import { formatCurrency, formatDate } from "../../utils/formatters";

const TYPE_LABELS = {
  deposit: "Deposit",
  rental_fee: "Rental Fee",
  extension_fee: "Extension Fee",
  penalty: "Penalty",
  refund: "Refund",
};

const STATUS_LABELS = {
  pending: "Pending",
  completed: "Completed",
  failed: "Failed",
  refunded: "Refunded",
};

const STATUS_BADGES = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

const quickLinks = [
  {
    label: "Bookings",
    to: "/staff/bookings",
    icon: Car,
    color: "bg-blue-50 text-blue-600 hover:bg-blue-100",
  },
  {
    label: "Vehicles",
    to: "/staff/vehicles",
    icon: Truck,
    color: "bg-teal-50 text-teal-600 hover:bg-teal-100",
  },
  {
    label: "Drivers",
    to: "/staff/drivers",
    icon: UserCheck,
    color: "bg-cyan-50 text-cyan-600 hover:bg-cyan-100",
  },
  {
    label: "Driver Assignments",
    to: "/staff/assignments",
    icon: Users,
    color: "bg-purple-50 text-purple-600 hover:bg-purple-100",
  },
  {
    label: "Handovers",
    to: "/staff/handovers",
    icon: FileText,
    color: "bg-orange-50 text-orange-600 hover:bg-orange-100",
  },
  {
    label: "Extension Requests",
    to: "/staff/extensions",
    icon: Clock,
    color: "bg-green-50 text-green-600 hover:bg-green-100",
  },
];

const StaffDashboard = () => {
  const [recentPayments, setRecentPayments] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    pending: 0,
    revenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await getPaymentsList({ page: 1, limit: 50 });
      const all = res.data || [];
      const completed = all.filter((p) => p.status === "completed");
      const pending = all.filter((p) => p.status === "pending");
      const revenue = completed.reduce((sum, p) => sum + p.amount, 0);
      setStats({
        total: res.total || all.length,
        completed: completed.length,
        pending: pending.length,
        revenue,
      });
      setRecentPayments(all.slice(0, 5));
    } catch {
      // silently fail — dashboard is non-critical
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Overview of activities and recent transactions
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  Total Transactions
                </span>
                <span className="p-2 bg-blue-50 rounded-xl">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                </span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {stats.total}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  Completed
                </span>
                <span className="p-2 bg-green-50 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </span>
              </div>
              <div className="text-2xl font-bold text-green-700">
                {stats.completed}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  Pending
                </span>
                <span className="p-2 bg-yellow-50 rounded-xl">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                </span>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-500">
                  Revenue (Last 50)
                </span>
                <span className="p-2 bg-indigo-50 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-indigo-600" />
                </span>
              </div>
              <div className="text-lg font-bold text-indigo-700 truncate">
                {formatCurrency(stats.revenue)}
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-4">
              Quick Access
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickLinks.map(({ label, to, icon: Icon, color }) => (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-colors font-medium text-sm text-center ${color}`}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Recent Payments */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">
                Recent Payments
              </h2>
              <Link
                to="/staff/payments"
                className="text-sm text-blue-600 font-medium flex items-center gap-1 hover:underline"
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {recentPayments.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                No transactions yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-600">
                  <thead className="bg-gray-50 text-gray-700 text-xs uppercase tracking-wide">
                    <tr>
                      <th>Date</th>
                      <th>Customer</th>
                      <th>Transaction Type</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recentPayments.map((p) => (
                      <tr
                        key={p._id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-5 py-3.5 font-medium text-gray-800 whitespace-nowrap">
                          {formatDate(p.payment_date, true)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-gray-800">
                            {p.customer?.user?.full_name || "—"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {p.customer?.user?.phone || ""}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-700">
                          {TYPE_LABELS[p.payment_type] || p.payment_type}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-gray-900">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_BADGES[p.status] || "bg-gray-100 text-gray-700"}`}
                          >
                            {STATUS_LABELS[p.status] || p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default StaffDashboard;
