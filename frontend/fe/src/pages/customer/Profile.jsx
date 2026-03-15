import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    User,
    Phone,
    Mail,
    MapPin,
    CreditCard,
    Calendar,
    Camera,
    Save,
    Edit2,
    X,
    TrendingUp,
    Car,
    DollarSign,
    Star,
    Award,
} from "lucide-react";
import {
    getMyProfile,
    updateUserInfo,
    updateCustomerProfile,
    getToken,
    saveUser,
    getUser,
} from "../../services/api";

const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [activeTab, setActiveTab] = useState("info");
    const [editMode, setEditMode] = useState(false);

    // Profile data
    const [profile, setProfile] = useState(null);
    const [userData, setUserData] = useState({
        full_name: "",
        phone: "",
        avatar_url: "",
    });
    const [customerData, setCustomerData] = useState({
        id_card: "",
        driver_license: "",
        date_of_birth: "",
        address: "",
    });

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate("/login");
            return;
        }
        fetchProfile();
    }, [navigate]);

    const fetchProfile = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getMyProfile();
            setProfile(response.data);

            // Set user data
            setUserData({
                full_name: response.data.user.full_name || "",
                phone: response.data.user.phone || "",
                avatar_url: response.data.user.avatar_url || "",
            });

            // Set customer data if exists
            if (response.data.customer) {
                setCustomerData({
                    id_card: response.data.customer.id_card || "",
                    driver_license: response.data.customer.driver_license || "",
                    date_of_birth: response.data.customer.date_of_birth
                        ? new Date(response.data.customer.date_of_birth)
                            .toISOString()
                            .split("T")[0]
                        : "",
                    address: response.data.customer.address || "",
                });
            }
        } catch (err) {
            setError(err.message || "Không thể tải thông tin cá nhân");
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError("");
        setSuccess("");

        try {
            // Update user info
            const userResponse = await updateUserInfo(userData);

            // Update customer info if customer exists
            if (profile?.customer) {
                await updateCustomerProfile(profile.customer._id, {
                    ...userData,
                    ...customerData,
                });
            }

            // Update localStorage
            const currentUser = getUser();
            saveUser({
                ...currentUser,
                full_name: userData.full_name,
                phone: userData.phone,
                avatar_url: userData.avatar_url,
            });

            setSuccess("Cập nhật thông tin thành công!");
            setEditMode(false);
            setTimeout(() => {
                fetchProfile();
            }, 1000);
        } catch (err) {
            setError(err.message || "Không thể cập nhật thông tin");
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        // Reset to original values
        setUserData({
            full_name: profile.user.full_name || "",
            phone: profile.user.phone || "",
            avatar_url: profile.user.avatar_url || "",
        });
        if (profile?.customer) {
            setCustomerData({
                id_card: profile.customer.id_card || "",
                driver_license: profile.customer.driver_license || "",
                date_of_birth: profile.customer.date_of_birth
                    ? new Date(profile.customer.date_of_birth).toISOString().split("T")[0]
                    : "",
                address: profile.customer.address || "",
            });
        }
        setEditMode(false);
        setError("");
        setSuccess("");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center py-20">
                        <p className="text-gray-600">Không tìm thấy thông tin cá nhân</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header with Avatar */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 shadow-lg">
                    <div className="flex items-center gap-6">
                        <div className="relative">
                            {userData.avatar_url ? (
                                <img
                                    src={userData.avatar_url}
                                    alt={userData.full_name}
                                    className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center">
                                    <User className="w-12 h-12 text-gray-400" />
                                </div>
                            )}
                            {editMode && (
                                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition">
                                    <Camera className="w-4 h-4 text-gray-600" />
                                </button>
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {profile.user.full_name}
                            </h1>
                            <p className="text-blue-100 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                {profile.user.email}
                            </p>
                            {profile.roles && (
                                <div className="flex gap-2 mt-3">
                                    {profile.roles.map((role) => (
                                        <span
                                            key={role}
                                            className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold text-white uppercase"
                                        >
                                            {role === "customer"
                                                ? "Khách hàng"
                                                : role === "driver"
                                                    ? "Tài xế"
                                                    : role}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div>
                            {!editMode ? (
                                <button
                                    onClick={() => setEditMode(true)}
                                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg"
                                >
                                    <Edit2 className="w-4 h-4" />
                                    Chỉnh sửa
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="flex items-center gap-2 px-6 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition shadow-lg disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? "Đang lưu..." : "Lưu"}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition"
                                    >
                                        <X className="w-4 h-4" />
                                        Hủy
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-600 rounded-lg flex items-center gap-2">
                        <Save className="w-5 h-5" />
                        {success}
                    </div>
                )}

                {/* Tabs */}
                <div className="flex gap-4 mb-8 border-b">
                    <button
                        onClick={() => setActiveTab("info")}
                        className={`pb-4 px-6 font-semibold transition relative ${activeTab === "info"
                                ? "text-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                            }`}
                    >
                        Thông tin cá nhân
                        {activeTab === "info" && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                        )}
                    </button>
                    {profile.customer && (
                        <button
                            onClick={() => setActiveTab("stats")}
                            className={`pb-4 px-6 font-semibold transition relative ${activeTab === "stats"
                                    ? "text-blue-600"
                                    : "text-gray-500 hover:text-gray-700"
                                }`}
                        >
                            Thống kê
                            {activeTab === "stats" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
                            )}
                        </button>
                    )}
                </div>

                {/* Tab Content */}
                {activeTab === "info" && (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* User Info Card */}
                        <div className="bg-white rounded-xl shadow-lg p-8">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                <User className="w-6 h-6 text-blue-600" />
                                Thông tin tài khoản
                            </h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Họ và tên
                                    </label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={userData.full_name}
                                            onChange={(e) =>
                                                setUserData({ ...userData, full_name: e.target.value })
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                                            {userData.full_name || "-"}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Email
                                    </label>
                                    <p className="text-gray-500 text-sm bg-gray-50 px-4 py-3 rounded-lg">
                                        {profile.user.email || "-"}
                                    </p>
                                    <span className="text-xs text-gray-400 mt-1 block">
                                        Email không thể thay đổi
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        Số điện thoại
                                    </label>
                                    {editMode ? (
                                        <input
                                            type="tel"
                                            value={userData.phone}
                                            onChange={(e) =>
                                                setUserData({ ...userData, phone: e.target.value })
                                            }
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                                            {userData.phone || "-"}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                        <Camera className="w-4 h-4" />
                                        URL Avatar
                                    </label>
                                    {editMode ? (
                                        <input
                                            type="url"
                                            value={userData.avatar_url}
                                            onChange={(e) =>
                                                setUserData({ ...userData, avatar_url: e.target.value })
                                            }
                                            placeholder="https://example.com/avatar.jpg"
                                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    ) : (
                                        <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg break-all">
                                            {userData.avatar_url || "-"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Customer Info Card */}
                        {profile.customer && (
                            <div className="bg-white rounded-xl shadow-lg p-8">
                                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                    Thông tin khách hàng
                                </h2>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <CreditCard className="w-4 h-4" />
                                            CMND/CCCD
                                        </label>
                                        <p className="text-gray-500 text-sm bg-gray-50 px-4 py-3 rounded-lg">
                                            {profile.customer.id_card || "-"}
                                        </p>
                                        <span className="text-xs text-gray-400 mt-1 block">
                                            CMND/CCCD không thể thay đổi
                                        </span>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Car className="w-4 h-4" />
                                            Giấy phép lái xe
                                        </label>
                                        {editMode ? (
                                            <input
                                                type="text"
                                                value={customerData.driver_license}
                                                onChange={(e) =>
                                                    setCustomerData({
                                                        ...customerData,
                                                        driver_license: e.target.value,
                                                    })
                                                }
                                                placeholder="Nhập số GPLX (nếu có)"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                                                {customerData.driver_license || "Chưa cập nhật"}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" />
                                            Ngày sinh
                                        </label>
                                        {editMode ? (
                                            <input
                                                type="date"
                                                value={customerData.date_of_birth}
                                                onChange={(e) =>
                                                    setCustomerData({
                                                        ...customerData,
                                                        date_of_birth: e.target.value,
                                                    })
                                                }
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                                                {customerData.date_of_birth
                                                    ? new Date(
                                                        customerData.date_of_birth
                                                    ).toLocaleDateString("vi-VN")
                                                    : "Chưa cập nhật"}
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                                            <MapPin className="w-4 h-4" />
                                            Địa chỉ
                                        </label>
                                        {editMode ? (
                                            <textarea
                                                value={customerData.address}
                                                onChange={(e) =>
                                                    setCustomerData({
                                                        ...customerData,
                                                        address: e.target.value,
                                                    })
                                                }
                                                rows="3"
                                                placeholder="Nhập địa chỉ của bạn"
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg min-h-[100px]">
                                                {customerData.address || "Chưa cập nhật"}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Statistics Tab */}
                {activeTab === "stats" && profile.customer && (
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <Car className="w-10 h-10 opacity-80" />
                                <TrendingUp className="w-6 h-6 opacity-60" />
                            </div>
                            <h3 className="text-3xl font-bold mb-2">
                                {profile.customer.total_bookings || 0}
                            </h3>
                            <p className="text-blue-100 text-sm font-medium">
                                Tổng số lượt thuê
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <DollarSign className="w-10 h-10 opacity-80" />
                                <TrendingUp className="w-6 h-6 opacity-60" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">
                                {formatCurrency(profile.customer.total_spent)}
                            </h3>
                            <p className="text-green-100 text-sm font-medium">
                                Tổng chi tiêu
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <Award className="w-10 h-10 opacity-80" />
                                <TrendingUp className="w-6 h-6 opacity-60" />
                            </div>
                            <h3 className="text-3xl font-bold mb-2">
                                {profile.customer.loyalty_points || 0}
                            </h3>
                            <p className="text-purple-100 text-sm font-medium">Điểm tích lũy</p>
                        </div>

                        <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
                            <div className="flex items-center justify-between mb-4">
                                <Star className="w-10 h-10 opacity-80" />
                                <TrendingUp className="w-6 h-6 opacity-60" />
                            </div>
                            <h3 className="text-3xl font-bold mb-2">
                                {profile.customer.rating
                                    ? profile.customer.rating.toFixed(1)
                                    : "0.0"}
                                <span className="text-xl ml-1">⭐</span>
                            </h3>
                            <p className="text-yellow-100 text-sm font-medium">
                                Đánh giá trung bình
                            </p>
                        </div>

                        {/* Additional Info Cards */}
                        <div className="md:col-span-2 lg:col-span-4 grid md:grid-cols-2 gap-6 mt-4">
                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <Star className="w-5 h-5 text-yellow-500" />
                                    Thành tích
                                </h3>
                                <div className="space-y-3">
                                    {profile.customer.total_bookings >= 10 && (
                                        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                                            <Award className="w-8 h-8 text-blue-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    Khách hàng thân thiết
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Đã thuê xe hơn 10 lần
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.customer.total_spent >= 10000000 && (
                                        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                            <Award className="w-8 h-8 text-green-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    VIP Member
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Chi tiêu trên 10 triệu
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {(profile.customer.rating || 0) >= 4.5 && (
                                        <div className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                                            <Award className="w-8 h-8 text-yellow-600" />
                                            <div>
                                                <p className="font-semibold text-gray-800">
                                                    Khách hàng uy tín
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Đánh giá cao từ tài xế
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    {profile.customer.total_bookings === 0 && (
                                        <p className="text-gray-500 text-sm py-4 text-center">
                                            Hoàn thành các chuyến đi để nhận thành tích
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white rounded-xl shadow-lg p-6">
                                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    Lịch sử hoạt động
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600 text-sm">Số lượt thuê</span>
                                        <span className="font-bold text-gray-900">
                                            {profile.customer.total_bookings || 0} lần
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600 text-sm">Chi tiêu TB</span>
                                        <span className="font-bold text-gray-900">
                                            {profile.customer.total_bookings > 0
                                                ? formatCurrency(
                                                    profile.customer.total_spent /
                                                    profile.customer.total_bookings
                                                )
                                                : formatCurrency(0)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span className="text-gray-600 text-sm">Điểm tích lũy</span>
                                        <span className="font-bold text-gray-900">
                                            {profile.customer.loyalty_points || 0} điểm
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
