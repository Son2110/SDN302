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
  Edit,
  Check,
  X,
} from "lucide-react";
import * as userApi from "../../services/userApi";

const StaffDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    loadDrivers();
  }, [statusFilter, pagination.page]);

  const loadDrivers = async () => {
    try {
      setLoading(true);
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
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    loadDrivers();
  };

  const handleApprove = async (driverId) => {
    if (!window.confirm("Bạn có chắc muốn duyệt tài xế này?")) return;
    try {
      await userApi.approveDriver(driverId);
      alert("Đã duyệt tài xế thành công!");
      loadDrivers(); // Reload danh sách
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const handleReject = async (driverId) => {
    const reason = window.prompt(
      "Nhập lý do từ chối (hoặc để trống):",
      "Không đáp ứng yêu cầu",
    );
    if (reason === null) return; // User cancelled

    try {
      await userApi.rejectDriver(driverId, reason);
      alert("Đã từ chối tài xế");
      loadDrivers(); // Reload danh sách
    } catch (err) {
      alert("Lỗi: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-700",
      available: "bg-green-100 text-green-700",
      busy: "bg-blue-100 text-blue-700",
      offline: "bg-gray-100 text-gray-700",
      rejected: "bg-red-100 text-red-700",
    };
    const labels = {
      pending: "Chờ duyệt",
      available: "Sẵn sàng",
      busy: "Đang bận",
      offline: "Offline",
      rejected: "Đã từ chối",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("vi-VN");
  };

  if (loading && drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
          <Users size={32} className="text-blue-600" />
          Quản Lý Tài Xế
        </h1>
        <p className="text-gray-600">
          Danh sách tài xế đã đăng ký - Tổng:{" "}
          <strong>{pagination.total}</strong> tài xế
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <form
          onSubmit={handleSearch}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="md:col-span-2 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email, số điện thoại..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((prev) => ({ ...prev, page: 1 }));
              }}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="pending">Chờ duyệt</option>
              <option value="available">Sẵn sàng</option>
              <option value="busy">Đang bận</option>
              <option value="offline">Offline</option>
              <option value="rejected">Đã từ chối</option>
            </select>
            <button
              type="submit"
              className="px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Tìm
            </button>
          </div>
        </form>
      </div>

      {/* Driver List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {drivers.map((driver) => (
          <div
            key={driver._id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold">
                    {driver.user?.full_name || "N/A"}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Star size={14} fill="gold" color="gold" />
                    <span className="text-sm font-semibold">
                      {driver.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-blue-100">
                      ({driver.total_trips} chuyến)
                    </span>
                  </div>
                </div>
                {getStatusBadge(driver.status)}
              </div>
            </div>

            <div className="p-4 space-y-3">
              {/* License Info */}
              <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <IdCard size={16} className="text-gray-600" />
                  <span className="text-gray-700">
                    <strong>GPLX:</strong> {driver.license_number}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award size={16} className="text-gray-600" />
                  <span className="text-gray-700">
                    <strong>Hạng:</strong> {driver.license_type}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-gray-600" />
                  <span className="text-gray-700">
                    <strong>Hết hạn:</strong>{" "}
                    {formatDate(driver.license_expiry)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Award size={16} className="text-gray-600" />
                  <span className="text-gray-700">
                    <strong>Kinh nghiệm:</strong> {driver.experience_years} năm
                  </span>
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={16} className="text-gray-500" />
                  <span className="truncate">
                    {driver.user?.email || "N/A"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={16} className="text-gray-500" />
                  <span>{driver.user?.phone || "N/A"}</span>
                </div>
              </div>

              {/* Check License Expiry */}
              {new Date(driver.license_expiry) < new Date() && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>Giấy phép đã hết hạn</span>
                </div>
              )}

              {/* Stats */}
              <div className="flex justify-between pt-3 border-t border-gray-200 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {driver.total_trips}
                  </div>
                  <div className="text-xs text-gray-500">Chuyến đi</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {driver.rating.toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-500">Đánh giá</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {driver.experience_years}
                  </div>
                  <div className="text-xs text-gray-500">Năm KN</div>
                </div>
              </div>

              {/* Action Buttons for Pending Drivers */}
              {driver.status === "pending" && (
                <div className="flex gap-2 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => handleApprove(driver._id)}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <Check size={18} />
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleReject(driver._id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 transition"
                  >
                    <X size={18} />
                    Từ chối
                  </button>
                </div>
              )}

              {/* Show Rejection Reason if Rejected */}
              {driver.status === "rejected" && driver.rejection_reason && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs">
                  <strong>Lý do từ chối:</strong> {driver.rejection_reason}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {drivers.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users size={48} className="mx-auto mb-4 text-gray-400" />
          <p>Không tìm thấy tài xế nào</p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-8">
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.max(1, prev.page - 1),
              }))
            }
            disabled={pagination.page === 1}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Trước
          </button>
          <span className="text-gray-700 font-semibold">
            Trang {pagination.page} / {pagination.pages}
          </span>
          <button
            onClick={() =>
              setPagination((prev) => ({
                ...prev,
                page: Math.min(prev.pages, prev.page + 1),
              }))
            }
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffDrivers;
