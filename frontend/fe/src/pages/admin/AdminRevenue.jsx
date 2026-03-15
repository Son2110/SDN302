import { useState, useEffect } from "react";
import {
  TrendingUp,
  CreditCard,
  Users,
  Car,
  DollarSign,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getToken } from "../../services/api";
import { formatCurrency } from "../../utils/formatters";

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_LABELS = {
  deposit: "Đặt cọc",
  rental_fee: "Phí thuê xe",
  extension_fee: "Phí gia hạn",
  penalty: "Tiền phạt",
  refund: "Hoàn tiền",
};

const TYPE_COLORS = {
  deposit: "bg-blue-500",
  rental_fee: "bg-green-500",
  extension_fee: "bg-orange-500",
  penalty: "bg-red-500",
  refund: "bg-purple-500",
};

const TYPE_TEXT = {
  deposit: "text-blue-600",
  rental_fee: "text-green-600",
  extension_fee: "text-orange-600",
  penalty: "text-red-600",
  refund: "text-purple-600",
};

const MONTH_NAMES = [
  "Th1",
  "Th2",
  "Th3",
  "Th4",
  "Th5",
  "Th6",
  "Th7",
  "Th8",
  "Th9",
  "Th10",
  "Th11",
  "Th12",
];

const AdminRevenue = () => {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRevenue();
  }, [year]);

  const fetchRevenue = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/admin/revenue?year=${year}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok)
        throw new Error(json.message || "Không thể tải dữ liệu doanh thu");
      setData(json.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Build 12-month array padded with 0s
  const monthlyFull = Array.from({ length: 12 }, (_, i) => {
    const found = data?.monthly?.find((m) => m.month === i + 1);
    return found ? found : { month: i + 1, revenue: 0, count: 0 };
  });

  const maxRevenue = Math.max(...monthlyFull.map((m) => m.revenue), 1);

  const totalByType = data?.byType?.reduce((s, t) => s + t.revenue, 0) || 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Doanh thu & Thống kê
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Tổng quan tài chính toàn hệ thống
          </p>
        </div>

        {/* Year picker */}
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2 shadow-sm">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="text-gray-400 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-bold text-gray-900 px-3 min-w-16 text-center">
            {year}
          </span>
          <button
            onClick={() => setYear((y) => Math.min(y + 1, currentYear))}
            disabled={year >= currentYear}
            className="text-gray-400 hover:text-gray-900 transition-colors disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-5 py-4 rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-gray-800" />
        </div>
      ) : data ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  Doanh thu toàn thời gian
                </span>
                <DollarSign className="w-5 h-5 text-gray-400" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(data.totalRevenue)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {data.totalTransactions} giao dịch
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  Doanh thu năm {year}
                </span>
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {formatCurrency(data.yearRevenue)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {data.yearTransactions} giao dịch
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">Tổng đơn đặt xe</span>
                <Car className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {data.totalBookings}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                <CheckCircle className="inline w-3 h-3 text-green-500 mr-1" />
                {data.completedBookings} hoàn thành
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">
                  Người dùng hoạt động
                </span>
                <Users className="w-5 h-5 text-orange-500" />
              </div>
              <div className="text-xl font-bold text-gray-900">
                {data.totalUsers}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {data.totalCustomers} KH · {data.totalDriversActive} tài xế
                active
              </div>
            </div>
          </div>

          {/* Monthly Bar Chart */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-6">
              Doanh thu theo tháng — {year}
            </h2>
            <div className="flex items-end gap-2 h-48">
              {monthlyFull.map((m) => {
                const pct = maxRevenue > 0 ? (m.revenue / maxRevenue) * 100 : 0;
                return (
                  <div
                    key={m.month}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    {/* Tooltip */}
                    {m.revenue > 0 && (
                      <div className="absolute bottom-full mb-2 bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 left-1/2 -translate-x-1/2">
                        <div className="font-bold">
                          {formatCurrency(m.revenue)}
                        </div>
                        <div className="text-gray-300">{m.count} giao dịch</div>
                      </div>
                    )}
                    <div
                      className="w-full flex items-end"
                      style={{ height: "160px" }}
                    >
                      <div
                        className="w-full rounded-t-lg bg-gray-800 hover:bg-gray-600 transition-colors cursor-default"
                        style={{
                          height: `${Math.max(pct, m.revenue > 0 ? 2 : 0)}%`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {MONTH_NAMES[m.month - 1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue by Type */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-base font-bold text-gray-900 mb-5">
              Phân loại doanh thu
            </h2>
            {data.byType.length === 0 ? (
              <p className="text-gray-500 text-sm">Chưa có dữ liệu</p>
            ) : (
              <div className="space-y-4">
                {data.byType.map((t) => {
                  const pct = ((t.revenue / totalByType) * 100).toFixed(1);
                  return (
                    <div key={t.type}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className={`text-sm font-medium ${TYPE_TEXT[t.type] || "text-gray-700"}`}
                        >
                          {TYPE_LABELS[t.type] || t.type}
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">
                            {t.count} giao dịch
                          </span>
                          <span className="font-bold text-gray-900">
                            {formatCurrency(t.revenue)}
                          </span>
                          <span className="text-gray-400 w-12 text-right">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${TYPE_COLORS[t.type] || "bg-gray-400"}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Monthly Table */}
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-bold text-gray-900">
                Chi tiết theo tháng — {year}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                  <tr>
                    <th className="px-5 py-3.5">Tháng</th>
                    <th className="px-5 py-3.5 text-right">Số giao dịch</th>
                    <th className="px-5 py-3.5 text-right">Doanh thu</th>
                    <th className="px-5 py-3.5">Tỷ trọng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyFull.map((m) => {
                    const pct =
                      data.yearRevenue > 0
                        ? ((m.revenue / data.yearRevenue) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <tr
                        key={m.month}
                        className={`hover:bg-gray-50 transition-colors ${m.revenue === 0 ? "opacity-40" : ""}`}
                      >
                        <td className="px-5 py-3.5 font-medium text-gray-700">
                          Tháng {m.month}
                        </td>
                        <td className="px-5 py-3.5 text-right text-gray-500">
                          {m.count}
                        </td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-900">
                          {formatCurrency(m.revenue)}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gray-800 rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-10 text-right">
                              {pct}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      Tổng năm {year}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      {data.yearTransactions}
                    </td>
                    <td className="px-5 py-4 text-right font-bold text-gray-900">
                      {formatCurrency(data.yearRevenue)}
                    </td>
                    <td className="px-5 py-4" />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminRevenue;
