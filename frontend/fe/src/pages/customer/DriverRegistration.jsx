import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UserPlus,
  IdCard,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";
import * as userApi from "../../services/userApi";

const DriverRegistration = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [existingStatus, setExistingStatus] = useState(null);
  const [showReapplyForm, setShowReapplyForm] = useState(false);
  const [formData, setFormData] = useState({
    license_number: "",
    license_type: "",
    license_expiry: "",
    experience_years: "",
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const data = await userApi.getMyDriverStatus();
        setExistingStatus(data);
      } catch (err) {
        // ignore
      } finally {
        setPageLoading(false);
      }
    };
    checkStatus();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        experience_years: parseInt(formData.experience_years),
      };
      // Nếu đang re-apply dùng PUT, còn đăng ký mới dùng POST
      if (existingStatus?.status === "rejected") {
        await userApi.reapplyAsDriver(payload);
      } else {
        await userApi.registerAsDriver(payload);
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenReapply = () => {
    // Pre-fill form với dữ liệu cũ
    setFormData({
      license_number: existingStatus.license_number || "",
      license_type: existingStatus.license_type || "",
      license_expiry: existingStatus.license_expiry
        ? new Date(existingStatus.license_expiry).toISOString().split("T")[0]
        : "",
      experience_years: existingStatus.experience_years?.toString() || "",
    });
    setError(null);
    setShowReapplyForm(true);
  };

  const formatDate = (date) => new Date(date).toLocaleDateString("vi-VN");

  const DriverForm = ({ isReapply = false }) => (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      {!isReapply && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle size={18} />
            Yêu cầu để trở thành tài xế
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Có giấy phép lái xe ô tô hợp lệ (B1 trở lên)</li>
            <li>• Giấy phép còn hạn sử dụng</li>
            <li>• Kinh nghiệm lái xe ít nhất 1 năm</li>
          </ul>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <IdCard size={18} /> Số giấy phép lái xe *
        </label>
        <input
          type="text"
          name="license_number"
          required
          value={formData.license_number}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="VD: 012345678"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <IdCard size={18} /> Hạng bằng lái *
        </label>
        <select
          name="license_type"
          required
          value={formData.license_type}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="">Chọn hạng bằng lái</option>
          <option value="B1">B1 - Xe ô tô dưới 9 chỗ ngồi (số tự động)</option>
          <option value="B2">B2 - Xe ô tô dưới 9 chỗ ngồi</option>
          <option value="C">C - Xe ô tô tải, máy kéo</option>
          <option value="D">D - Xe ô tô chở người từ 9 chỗ trở lên</option>
          <option value="E">E - Xe ô tô rơ moóc hoặc sơ mi rơ moóc</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <Calendar size={18} /> Ngày hết hạn *
        </label>
        <input
          type="date"
          name="license_expiry"
          required
          value={formData.license_expiry}
          onChange={handleChange}
          min={new Date().toISOString().split("T")[0]}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <Award size={18} /> Số năm kinh nghiệm lái xe *
        </label>
        <input
          type="number"
          name="experience_years"
          required
          min="1"
          max="50"
          value={formData.experience_years}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="VD: 5"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Đang xử lý..."
            : isReapply
              ? "Nộp Lại Hồ Sơ"
              : "Đăng Ký Làm Tài Xế"}
        </button>
        {isReapply && (
          <button
            type="button"
            onClick={() => setShowReapplyForm(false)}
            className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            Hủy
          </button>
        )}
      </div>
    </form>
  );

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Đang tải...</div>
      </div>
    );
  }

  // === Đã đăng ký - hiển thị trạng thái ===
  if (existingStatus && !success) {
    const isPending = existingStatus.status === "pending";
    const isApproved =
      existingStatus.status === "available" ||
      existingStatus.status === "busy" ||
      existingStatus.status === "offline";
    const isRejected = existingStatus.status === "rejected";

    return (
      <div className="min-h-screen bg-gray-50 pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div
              className={`p-6 text-white ${isPending ? "bg-yellow-500" : isApproved ? "bg-green-600" : "bg-red-600"}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {isPending && <Clock size={30} />}
                  {isApproved && <CheckCircle size={30} />}
                  {isRejected && <XCircle size={30} />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isPending && "Đang chờ xét duyệt"}
                    {isApproved && "Hồ sơ đã được duyệt!"}
                    {isRejected && "Hồ sơ bị từ chối"}
                  </h1>
                  <p className="text-sm opacity-90 mt-1">
                    {isPending &&
                      "Nhân viên sẽ xem xét hồ sơ của bạn sớm nhất có thể"}
                    {isApproved && "Bạn đã là tài xế và có thể nhận chuyến đi"}
                    {isRejected &&
                      "Xem lý do bên dưới và nộp lại hồ sơ nếu muốn"}
                  </p>
                </div>
              </div>
            </div>

            {/* Thông tin hồ sơ */}
            <div className="p-6">
              <h3 className="font-bold text-gray-800 mb-4">
                Thông tin đã đăng ký
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">Số GPLX</span>
                  <p className="font-semibold mt-1">
                    {existingStatus.license_number}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">Hạng bằng</span>
                  <p className="font-semibold mt-1">
                    {existingStatus.license_type}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">Hết hạn GPLX</span>
                  <p className="font-semibold mt-1">
                    {formatDate(existingStatus.license_expiry)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">Kinh nghiệm</span>
                  <p className="font-semibold mt-1">
                    {existingStatus.experience_years} năm
                  </p>
                </div>
              </div>

              {/* Lý do từ chối */}
              {isRejected && existingStatus.rejection_reason && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Lý do từ chối:
                  </p>
                  <p className="text-red-700">
                    {existingStatus.rejection_reason}
                  </p>
                </div>
              )}

              {/* Nút hành động */}
              <div className="mt-6 flex gap-3">
                {isRejected && !showReapplyForm && (
                  <button
                    onClick={handleOpenReapply}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                  >
                    <RefreshCw size={18} />
                    Nộp Lại Hồ Sơ
                  </button>
                )}
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition"
                >
                  Quay về trang chủ
                </button>
              </div>
            </div>
          </div>

          {/* Form nộp lại (chỉ hiện khi bị rejected và bấm nộp lại) */}
          {isRejected && showReapplyForm && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <RefreshCw size={22} className="text-blue-600" />
                Nộp Lại Hồ Sơ
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Cập nhật thông tin và gửi lại để được xét duyệt
              </p>
              <DriverForm isReapply={true} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // === Sau khi submit thành công ===
  if (success) {
    return (
      <div className="min-h-screen bg-yellow-50 pt-32 pb-20 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={48} className="text-yellow-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {existingStatus?.status === "rejected"
              ? "Đã nộp lại hồ sơ!"
              : "Đăng ký thành công!"}
          </h1>
          <p className="text-gray-600 mb-6">
            Hồ sơ của bạn đang chờ nhân viên xét duyệt.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-yellow-800 font-semibold">
              ⏳ Trạng thái: Đang chờ duyệt
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Quay về trang chủ
          </button>
        </div>
      </div>
    );
  }

  // === Chưa đăng ký - form đăng ký mới ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserPlus size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Đăng Ký Làm Tài Xế</h1>
                <p className="text-blue-100 mt-1">
                  Bắt đầu kiếm tiền bằng cách lái xe cho khách hàng
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <DriverForm isReapply={false} />
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Lợi ích khi trở thành tài xế
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Thu nhập cao</h3>
              <p className="text-sm text-gray-600">
                Kiếm tiền linh hoạt theo giờ
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Thời gian linh hoạt
              </h3>
              <p className="text-sm text-gray-600">Tự chủ lịch làm việc</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Hỗ trợ 24/7</h3>
              <p className="text-sm text-gray-600">Luôn có team hỗ trợ</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;
