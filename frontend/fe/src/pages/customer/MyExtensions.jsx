import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  AlertCircle,
  Eye,
  CheckCircle,
  XCircle,
  Hourglass,
} from "lucide-react";
import { getMyExtensions } from "../../services/extensionApi";
import { getToken } from "../../services/api";
import toast from "react-hot-toast";

const MyExtensions = () => {
  const navigate = useNavigate();
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchExtensions();
  }, []);

  const fetchExtensions = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await getMyExtensions();
      setExtensions(response.data || []);
    } catch (err) {
      setError(err.message || "Không thể tải danh sách yêu cầu gia hạn");
      toast.error("Không thể tải danh sách yêu cầu gia hạn");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return (
          <span className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 text-sm font-bold rounded-full">
            <Hourglass size={16} />
            Đang chờ
          </span>
        );
      case "approved":
        return (
          <span className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 text-sm font-bold rounded-full">
            <CheckCircle size={16} />
            Đã duyệt
          </span>
        );
      case "rejected":
        return (
          <span className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-800 text-sm font-bold rounded-full">
            <XCircle size={16} />
            Từ chối
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const calculateExtensionDays = (originalEnd, newEnd) => {
    const current = new Date(originalEnd);
    const newDate = new Date(newEnd);
    current.setHours(0, 0, 0, 0);
    newDate.setHours(0, 0, 0, 0);
    const diffTime = newDate - current;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const filteredExtensions = extensions.filter((ext) => {
    if (activeFilter === "all") return true;
    return ext.status === activeFilter;
  });

  const filterButtons = [
    { key: "all", label: "Tất cả", count: extensions.length },
    {
      key: "pending",
      label: "Đang chờ",
      count: extensions.filter((e) => e.status === "pending").length,
    },
    {
      key: "approved",
      label: "Đã duyệt",
      count: extensions.filter((e) => e.status === "approved").length,
    },
    {
      key: "rejected",
      label: "Từ chối",
      count: extensions.filter((e) => e.status === "rejected").length,
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Yêu cầu gia hạn của tôi
          </h1>
          <p className="text-gray-600">
            Quản lý tất cả yêu cầu gia hạn thuê xe của bạn
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-3 mb-8">
          {filterButtons.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeFilter === filter.key
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {filter.label} ({filter.count})
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-3">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Extensions List */}
        {filteredExtensions.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-lg p-12 text-center">
            <Calendar className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {activeFilter === "all"
                ? "Chưa có yêu cầu gia hạn nào"
                : `Chưa có yêu cầu gia hạn ${filterButtons.find((f) => f.key === activeFilter)?.label.toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-6">
              Khi bạn gửi yêu cầu gia hạn thuê xe, chúng sẽ xuất hiện ở đây
            </p>
            <Link
              to="/my-bookings"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Xem đơn đặt xe
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredExtensions.map((extension) => (
              <div
                key={extension._id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all p-6 border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  {/* Left: Extension Info */}
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="shrink-0">
                        <img
                          src={
                            extension.booking?.vehicle?.images?.[0] ||
                            "/placeholder-car.jpg"
                          }
                          alt="Vehicle"
                          className="w-24 h-24 object-cover rounded-xl"
                          onError={(e) => {
                            e.target.src = "/placeholder-car.jpg";
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {extension.booking?.vehicle?.brand}{" "}
                          {extension.booking?.vehicle?.model}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">
                          Biển số: {extension.booking?.vehicle?.license_plate}
                        </p>
                        {getStatusBadge(extension.status)}
                      </div>
                    </div>

                    {/* Date Details */}
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-xl p-4">
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Ngày kết thúc cũ
                        </p>
                        <p className="font-bold text-gray-900">
                          {formatDate(extension.original_end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Ngày kết thúc mới
                        </p>
                        <p className="font-bold text-blue-600">
                          {formatDate(extension.new_end_date)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Số ngày gia hạn
                        </p>
                        <p className="font-bold text-purple-600">
                          {calculateExtensionDays(
                            extension.original_end_date,
                            extension.new_end_date,
                          )}{" "}
                          ngày
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">
                          Ngày yêu cầu
                        </p>
                        <p className="font-bold text-gray-900">
                          {formatDate(extension.requested_at)}
                        </p>
                      </div>
                    </div>

                    {/* Rejection/Approval Note */}
                    {extension.status === "rejected" &&
                      extension.reject_reason && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl">
                          <p className="text-sm font-bold text-red-800 mb-1">
                            Lý do từ chối:
                          </p>
                          <p className="text-sm text-red-700">
                            {extension.reject_reason}
                          </p>
                        </div>
                      )}
                    {extension.status === "approved" &&
                      extension.reject_reason && (
                        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                          <p className="text-sm font-bold text-green-800 mb-1">
                            Ghi chú:
                          </p>
                          <p className="text-sm text-green-700">
                            {extension.reject_reason}
                          </p>
                        </div>
                      )}
                  </div>

                  {/* Right: Actions */}
                  <div className="lg:border-l lg:border-gray-200 lg:pl-6">
                    <Link
                      to={`/extensions/${extension._id}`}
                      className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 whitespace-nowrap"
                    >
                      <Eye size={18} />
                      Xem chi tiết
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyExtensions;
