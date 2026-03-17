import { useState, useEffect } from "react";
import {
  Users,
  Search,
  Star,
  Phone,
  Mail,
  IdCard,
  Calendar,
  Award,
  AlertCircle,
  Check,
  X,
  Clock,
} from "lucide-react";
import * as userApi from "../../services/userApi";

const STATUS_BADGE = {
  pending: { label: "Chờ duyệt", cls: "bg-yellow-100 text-yellow-700" },
  available: { label: "Sẵn sàng", cls: "bg-green-100 text-green-700" },
  busy: { label: "Đang bận", cls: "bg-blue-100 text-blue-700" },
  offline: { label: "Offline", cls: "bg-gray-100 text-gray-600" },
  rejected: { label: "Đã từ chối", cls: "bg-red-100 text-red-700" },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_BADGE[status] || {
    label: status,
    cls: "bg-gray-100 text-gray-600",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
};

const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN");

// ─── Driver Card ─────────────────────────────────────────────────────────────
const DriverCard = ({
  driver,
  onApprove,
  onReject,
}) => {
  const licenseExpired = new Date(driver.license_expiry) < new Date();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition">
      {/* Header strip */}
      <div className="bg-gray-900 px-4 py-3 flex justify-between items-center">
        <div>
          <p className="text-white font-bold text-sm">
            {driver.user?.full_name || "N/A"}
          </p>
          <div className="flex items-center gap-1 mt-0.5">
            <Star size={12} fill="gold" color="gold" />
            <span className="text-xs text-gray-300 font-medium">
              {driver.rating?.toFixed(1)} · {driver.total_trips} chuyến
            </span>
          </div>
        </div>
        <StatusBadge status={driver.status} />
      </div>

      <div className="p-4 space-y-3">
        {/* License info */}
        <div className="bg-gray-50 rounded-lg p-3 space-y-1.5 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <IdCard size={14} className="text-gray-400 shrink-0" />
            <span>
              <strong>GPLX:</strong> {driver.license_number}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Award size={14} className="text-gray-400 shrink-0" />
            <span>
              <strong>Hạng:</strong> {driver.license_type} ·{" "}
              {driver.experience_years} năm KN
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 shrink-0" />
            <span
              className={licenseExpired ? "text-red-600 font-semibold" : ""}
            >
              <strong>Hết hạn:</strong> {formatDate(driver.license_expiry)}
              {licenseExpired && " ⚠️"}
            </span>
          </div>
        </div>

        {/* Contact */}
        <div className="space-y-1 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Mail size={14} className="shrink-0" />
            <span className="truncate">{driver.user?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Phone size={14} className="shrink-0" />
            <span>{driver.user?.phone}</span>
          </div>
        </div>

        {/* Rejection reason */}
        {driver.status === "rejected" && driver.rejection_reason && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
            <strong>Lý do từ chối:</strong> {driver.rejection_reason}
          </div>
        )}

        {/* Pending: approve / reject */}
        {driver.status === "pending" && (
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button
              onClick={() => onApprove(driver._id)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Check size={15} /> Duyệt
            </button>
            <button
              onClick={() => onReject(driver._id)}
              className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <X size={15} /> Từ chối
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const StaffDrivers = () => {
  const [activeTab, setActiveTab] = useState("list");
  const [stats, setStats] = useState(null);

  // List tab
  const [drivers, setDrivers] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [errorList, setErrorList] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Pending tab
  const [pendingDrivers, setPendingDrivers] = useState([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [errorPending, setErrorPending] = useState(null);
  const [pendingPage, setPendingPage] = useState({
    page: 1,
    pages: 1,
    total: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);
  useEffect(() => {
    if (activeTab === "list") loadDrivers();
  }, [activeTab, statusFilter, pagination.page]);
  useEffect(() => {
    if (activeTab === "pending") loadPendingDrivers();
  }, [activeTab, pendingPage.page]);

  const loadStats = async () => {
    try {
      setStats(await userApi.getDriverStats());
    } catch { }
  };

  const loadDrivers = async () => {
    try {
      setLoadingList(true);
      const result = await userApi.getAllDrivers({
        page: pagination.page,
        limit: 12,
        search: searchTerm,
        status: statusFilter,
      });
      setDrivers(result.data);
      setPagination({
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
      setErrorList(null);
    } catch (err) {
      setErrorList(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const loadPendingDrivers = async () => {
    try {
      setLoadingPending(true);
      const result = await userApi.getPendingDrivers({
        page: pendingPage.page,
        limit: 12,
      });
      setPendingDrivers(result.data);
      setPendingPage({
        page: result.page,
        pages: result.pages,
        total: result.total,
      });
      setErrorPending(null);
    } catch (err) {
      setErrorPending(err.message);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((p) => ({ ...p, page: 1 }));
    loadDrivers();
  };

  const handleApprove = async (driverId) => {
    if (!window.confirm("Duyệt tài xế này?")) return;
    try {
      await userApi.approveDriver(driverId);
      loadPendingDrivers();
      loadStats();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleReject = async (driverId) => {
    const reason = window.prompt("Lý do từ chối:", "Không đáp ứng yêu cầu");
    if (reason === null) return;
    try {
      await userApi.rejectDriver(driverId, reason);
      loadPendingDrivers();
      loadStats();
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const Pagination = ({ state, setPage }) =>
    state.pages > 1 ? (
      <div className="flex justify-center items-center gap-4 mt-8">
        <button
          onClick={() =>
            setPage((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
          }
          disabled={state.page === 1}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
        >
          Trước
        </button>
        <span className="text-sm text-gray-500 font-medium">
          Trang {state.page} / {state.pages}
        </span>
        <button
          onClick={() =>
            setPage((p) => ({ ...p, page: Math.min(p.pages, p.page + 1) }))
          }
          disabled={state.page === state.pages}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition"
        >
          Sau
        </button>
      </div>
    ) : null;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users size={24} /> Quản Lý Tài Xế
        </h1>
      </div>

      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: "Tổng", value: stats.total, cls: "text-gray-900" },
            {
              label: "Chờ duyệt",
              value: stats.pending,
              cls: "text-yellow-600",
            },
            {
              label: "Sẵn sàng",
              value: stats.available,
              cls: "text-green-600",
            },
            { label: "Đang bận", value: stats.busy, cls: "text-blue-600" },
            { label: "Offline", value: stats.offline, cls: "text-gray-500" },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white border border-gray-200 rounded-xl p-3 text-center shadow-sm"
            >
              <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px ${activeTab === "list"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          Danh sách tài xế
          {stats && (
            <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
              {pagination.total || stats.total}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition -mb-px flex items-center gap-2 ${activeTab === "pending"
            ? "border-gray-900 text-gray-900"
            : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
        >
          <Clock size={14} /> Chờ duyệt
          {stats?.pending > 0 && (
            <span className="bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {stats.pending}
            </span>
          )}
        </button>
      </div>

      {/* ── Tab: Danh sách ── */}
      {activeTab === "list" && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-3"
            >
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  size={16}
                />
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none"
              >
                <option value="">Tất cả (đã duyệt)</option>
                <option value="available">Sẵn sàng</option>
                <option value="busy">Đang bận</option>
                <option value="offline">Offline</option>
                <option value="rejected">Đã từ chối</option>
              </select>
              <button
                type="submit"
                className="px-5 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition"
              >
                Tìm
              </button>
            </form>
          </div>

          {errorList && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {errorList}
            </div>
          )}

          {loadingList && drivers.length === 0 ? (
            <div className="flex justify-center py-20 text-gray-400">
              Đang tải...
            </div>
          ) : drivers.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <Users size={40} className="mb-3 text-gray-300" />
              Không tìm thấy tài xế nào
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {drivers.map((d) => (
                <DriverCard
                  key={d._id}
                  driver={d}
                  onApprove={handleApprove}
                  onReject={handleReject}
                />
              ))}
            </div>
          )}
          <Pagination state={pagination} setPage={setPagination} />
        </>
      )}

      {/* ── Tab: Chờ duyệt ── */}
      {activeTab === "pending" && (
        <>
          {errorPending && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle size={16} /> {errorPending}
            </div>
          )}

          {loadingPending && pendingDrivers.length === 0 ? (
            <div className="flex justify-center py-20 text-gray-400">
              Đang tải...
            </div>
          ) : pendingDrivers.length === 0 ? (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <Check size={40} className="mb-3 text-green-300" />
              <p className="font-medium">Không có tài xế nào đang chờ duyệt</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-500">
                {pendingPage.total} tài xế đang chờ xét duyệt
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingDrivers.map((d) => (
                  <DriverCard
                    key={d._id}
                    driver={d}
                    onApprove={handleApprove}
                    onReject={handleReject}
                  />
                ))}
              </div>
            </>
          )}
          <Pagination state={pendingPage} setPage={setPendingPage} />
        </>
      )}
    </div>
  );
};

export default StaffDrivers;
