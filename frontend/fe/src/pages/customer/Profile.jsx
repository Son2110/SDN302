import { useState, useEffect, useRef } from "react";
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
  Award,
  Hourglass,
  Power,
} from "lucide-react";
import {
  getMyProfile,
  updateUserInfo,
  updateCustomerProfile,
  updateDriverProfile,
  toggleDriverDuty,
  getToken,
  saveUser,
  getUser,
} from "../../services/api";
import {
  Wifi,
  WifiOff,
  IdCard,
  Clock,
  Activity,
  Shield as ShieldIcon,
} from "lucide-react";

import { getMyBookings } from "../../services/bookingApi";

const Profile = () => {
  const navigate = useNavigate();
  // Refs
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [editMode, setEditMode] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
  });
  const [togglingDuty, setTogglingDuty] = useState(false);

  // Profile data
  const [profile, setProfile] = useState(null);
  const [userData, setUserData] = useState({
    full_name: "",
    phone: "",
    avatar_url: "",
    avatar: null, // File to upload
  });
  const [customerData, setCustomerData] = useState({
    id_card: "",
    driver_license: "",
    date_of_birth: "",
    address: "",
  });
  const [driverData, setDriverData] = useState({
    license_number: "",
    license_type: "",
    license_expiry: "",
    experience_years: 0,
    status: "",
  });
  const [statusLoading, setStatusLoading] = useState(false);


  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
    fetchRealtimeStats();
  }, [navigate]);

  const fetchRealtimeStats = async () => {
    try {
      // Total bookings placed
      const allBookingsRes = await getMyBookings({ page: 1, limit: 1 });
      const totalBookingsPlaced = allBookingsRes.total || 0;

      // Total spent from completed trips
      const completedRes = await getMyBookings({
        status: "completed",
        page: 1,
        limit: 200,
      });

      let completedBookings = completedRes.data || [];
      const totalPages = completedRes.totalPages || 1;

      if (totalPages > 1) {
        const pagePromises = [];
        for (let page = 2; page <= totalPages; page += 1) {
          pagePromises.push(getMyBookings({ status: "completed", page, limit: 200 }));
        }
        const pageResults = await Promise.all(pagePromises);
        pageResults.forEach((res) => {
          completedBookings = completedBookings.concat(res.data || []);
        });
      }

      const totalSpentFromCompleted = completedBookings.reduce(
        (sum, booking) => sum + (booking.total_amount || 0),
        0,
      );

      setStats({
        totalBookings: totalBookingsPlaced,
        totalSpent: totalSpentFromCompleted,
      });
    } catch {
      // Fallback to profile.customer values if realtime fetch fails
    }
  };

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

      // Set driver data if exists
      if (response.data.driver) {
        setDriverData({
          license_number: response.data.driver.license_number || "",
          license_type: response.data.driver.license_type || "",
          license_expiry: response.data.driver.license_expiry
            ? new Date(response.data.driver.license_expiry)
              .toISOString()
              .split("T")[0]
            : "",
          experience_years: response.data.driver.experience_years || 0,
          status: response.data.driver.status || "",
        });
      }
    } catch (err) {
      setError(err.message || "Unable to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUserData((prev) => ({
        ...prev,
        avatar: file,
        avatar_url: URL.createObjectURL(file), // Preview
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // 1. Prepare User Data (JSON or FormData)
      let userPayload = userData;

      if (userData.avatar) {
        // Use FormData if avatar is selected
        const formData = new FormData();
        formData.append("full_name", userData.full_name);
        formData.append("phone", userData.phone);
        formData.append("avatar", userData.avatar);
        userPayload = formData;
      } else {
        // Use JSON if only text fields
        userPayload = {
          full_name: userData.full_name,
          phone: userData.phone,
        };
      }

      // Update user info
      const userResponse = await updateUserInfo(userPayload);
      const updatedUser = userResponse.data;

      // Update customer info if customer exists
      if (profile?.customer) {
        await updateCustomerProfile(profile.customer._id, {
          ...userData, // contains phone, full_name which might be redundant but safe
          ...customerData,
        });
      }

      // Update driver info if driver exists
      if (profile?.driver) {
        await updateDriverProfile(profile.driver._id, {
          ...userData,
          ...driverData,
        });
      }

      // Update localStorage
      const currentUser = getUser();
      saveUser({
        ...currentUser,
        full_name: updatedUser.full_name,
        phone: updatedUser.phone,
        avatar_url: updatedUser.avatar_url,
      });

      setSuccess("Profile updated successfully!");
      setEditMode(false);
      setUserData((prev) => ({ ...prev, avatar: null })); // Clear file after upload
      setTimeout(() => {
        fetchProfile();
      }, 1000);
    } catch (err) {
      setError(err.message || "Unable to update profile");
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
      avatar: null,
    });
    if (fileInputRef.current) fileInputRef.current.value = ""; // Clear file input
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
    if (profile?.driver) {
      setDriverData({
        license_number: profile.driver.license_number || "",
        license_type: profile.driver.license_type || "",
        license_expiry: profile.driver.license_expiry
          ? new Date(profile.driver.license_expiry).toISOString().split("T")[0]
          : "",
        experience_years: profile.driver.experience_years || 0,
        status: profile.driver.status || "",
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
            <p className="text-gray-600">Profile information not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header with Avatar */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex items-center gap-6">
            <div className="relative">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              {userData.avatar_url ? (
                <img
                  src={userData.avatar_url}
                  alt={userData.full_name}
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover"
                  onClick={() => editMode && fileInputRef.current?.click()}
                  style={{ cursor: editMode ? "pointer" : "default" }}
                />
              ) : (
                <div
                  className="w-24 h-24 rounded-full border-4 border-white shadow-lg bg-white flex items-center justify-center"
                  onClick={() => editMode && fileInputRef.current?.click()}
                  style={{ cursor: editMode ? "pointer" : "default" }}
                >
                  <User className="w-12 h-12 text-gray-400" />
                </div>
              )}
              {editMode && (
                <button
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
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
                        ? "Customer"
                        : role === "driver"
                          ? "Driver"
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
                  Edit profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition"
                  >
                    <X className="w-4 h-4" />
                    Cancel
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
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 text-blue-600 rounded-lg flex items-center gap-2">
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
            Personal information
            {activeTab === "info" && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          {profile.customer && (
            <button
              onClick={() => setActiveTab("customer-stats")}
              className={`pb-4 px-6 font-semibold transition relative ${activeTab === "customer-stats"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Thống kê Thuê xe
              {activeTab === "customer-stats" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
              )}
            </button>
          )}
          {profile.driver && (
            <button
              onClick={() => setActiveTab("driver-stats")}
              className={`pb-4 px-6 font-semibold transition relative ${activeTab === "driver-stats"
                ? "text-blue-600"
                : "text-gray-500 hover:text-gray-700"
                }`}
            >
              Thống kê Tài xế
              {activeTab === "driver-stats" && (
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
                Account information
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Full name
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
                    Email cannot be changed
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Phone number
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
              </div>
            </div>

            {/* Customer Info Card */}
            {profile.customer && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  Customer information
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
                      ID card cannot be changed
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Car className="w-4 h-4" />
                      Driver license
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
                        placeholder="Enter license number (if any)"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                        {customerData.driver_license || "Not updated"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date of birth
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
                            customerData.date_of_birth,
                          ).toLocaleDateString("vi-VN")
                          : "Not updated"}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Address
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
                        placeholder="Enter your address"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 px-4 py-3 rounded-lg min-h-[100px]">
                        {customerData.address || "Not updated"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Driver Info Card */}
            {profile.driver && (
              <div className="bg-white rounded-xl shadow-lg p-8">
                <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                  <Car className="w-6 h-6 text-blue-600" />
                  Thông tin tài xế
                </h2>

                <div className="space-y-5">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <label className="text-sm font-semibold text-gray-700">
                      Trạng thái hoạt động
                    </label>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${profile.driver.status === 'available' ? 'bg-green-100 text-green-700' :
                      profile.driver.status === 'busy' ? 'bg-yellow-100 text-yellow-700' :
                        profile.driver.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                          profile.driver.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                      }`}>
                      {profile.driver.status === 'available' ? 'Sẵn sàng' :
                        profile.driver.status === 'busy' ? 'Đang bận' :
                          profile.driver.status === 'pending' ? 'Chờ duyệt' :
                            profile.driver.status === 'rejected' ? 'Bị từ chối' : 'Ngoại tuyến'}
                    </span>
                  </div>

                  {/* Toggle Duty Button */}
                  {['available', 'offline'].includes(profile.driver.status) && (
                    <div className="mt-6 p-5 rounded-xl border-2 border-dashed" style={{
                      borderColor: profile.driver.status === 'available' ? '#22c55e' : '#94a3b8',
                      background: profile.driver.status === 'available'
                        ? 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)'
                        : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)'
                    }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${profile.driver.status === 'available'
                            ? 'bg-green-500 shadow-lg shadow-green-200'
                            : 'bg-gray-400'
                            }`}>
                            <Power className="text-white" />
                          </div>
                          <div>
                            <p className="font-bold text-gray-800 text-base">
                              Ca làm việc
                            </p>
                            <p className={`text-sm font-semibold ${profile.driver.status === 'available'
                              ? 'text-green-600'
                              : 'text-gray-500'
                              }`}>
                              {profile.driver.status === 'available'
                                ? '🟢 Đang hoạt động'
                                : '⚫ Nghỉ ca'}
                            </p>
                          </div>
                        </div>

                        {/* Toggle Switch */}
                        <button
                          onClick={async () => {
                            setTogglingDuty(true);
                            setError("");
                            setSuccess("");
                            try {
                              const res = await toggleDriverDuty();
                              setSuccess(res.message);
                              await fetchProfile();
                            } catch (err) {
                              setError(err.message || "Không thể chuyển đổi ca làm việc");
                            } finally {
                              setTogglingDuty(false);
                            }
                          }}
                          disabled={togglingDuty}
                          className="relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60"
                          style={{
                            backgroundColor: profile.driver.status === 'available' ? '#22c55e' : '#cbd5e1',
                          }}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-md transition-transform duration-300 ${profile.driver.status === 'available' ? 'translate-x-9' : 'translate-x-1'
                              }`}
                          >
                            {togglingDuty && (
                              <span className="flex items-center justify-center h-full">
                                <span className="animate-spin h-3 w-3 border-2 border-gray-300 border-t-gray-600 rounded-full"></span>
                              </span>
                            )}
                          </span>
                        </button>
                      </div>

                      <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                        {profile.driver.status === 'available'
                          ? 'Bạn đang trong ca làm việc (Staff có thể phân công cho bạn).'
                          : 'Bạn đang nghỉ ca (Bạn có thể sử dụng dịch vụ đặt xe).'}
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <IdCard className="w-4 h-4" />
                      Giấy phép lái xe
                    </label>
                    {editMode ? (
                      <input
                        type="text"
                        value={driverData.license_number}
                        onChange={(e) =>
                          setDriverData({ ...driverData, license_number: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                        {driverData.license_number || "-"}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        Hạng GPLX
                      </label>
                      {editMode ? (
                        <input
                          type="text"
                          value={driverData.license_type}
                          onChange={(e) =>
                            setDriverData({ ...driverData, license_type: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg text-center uppercase font-bold">
                          {driverData.license_type || "-"}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Kinh nghiệm
                      </label>
                      {editMode ? (
                        <input
                          type="number"
                          value={driverData.experience_years}
                          onChange={(e) =>
                            setDriverData({ ...driverData, experience_years: e.target.value })
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      ) : (
                        <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg text-center font-bold">
                          {driverData.experience_years} năm
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Ngày hết hạn GPLX
                    </label>
                    {editMode ? (
                      <input
                        type="date"
                        value={driverData.license_expiry}
                        onChange={(e) =>
                          setDriverData({ ...driverData, license_expiry: e.target.value })
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    ) : (
                      <p className="text-gray-900 text-lg bg-gray-50 px-4 py-3 rounded-lg">
                        {driverData.license_expiry
                          ? new Date(driverData.license_expiry).toLocaleDateString("vi-VN")
                          : "Chưa cập nhật"}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Customer Statistics Tab */}
        {activeTab === "customer-stats" && profile.customer && (
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Car className="w-10 h-10 opacity-80" />
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-3xl font-bold mb-2">
                {stats.totalBookings || profile.customer.total_bookings || 0}
              </h3>
              <p className="text-blue-100 text-sm font-medium">
                Total bookings
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <DollarSign className="w-10 h-10 opacity-80" />
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-2xl font-bold mb-2">
                {formatCurrency(stats.totalSpent || profile.customer.total_spent)}
              </h3>
              <p className="text-blue-100 text-sm font-medium">
                Total spending
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-10 h-10 opacity-80" />
                <Hourglass className="w-6 h-6 opacity-70" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Coming soon</h3>
              <p className="text-blue-100 text-sm font-medium">
                Loyalty points
              </p>
            </div>

            {/* Additional Info Cards */}
            <div className="md:col-span-2 lg:col-span-3 grid md:grid-cols-2 gap-6 mt-4">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-500" />
                  Achievements
                </h3>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
                  <Hourglass className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                  <p className="font-semibold text-blue-700">Coming soon</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Achievement system is being updated.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  Activity history
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Total bookings</span>
                    <span className="font-bold text-gray-900">
                      {stats.totalBookings || profile.customer.total_bookings || 0} trips
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Average spending</span>
                    <span className="font-bold text-gray-900">
                      {(stats.totalBookings || profile.customer.total_bookings) > 0
                        ? formatCurrency(
                          (stats.totalSpent || profile.customer.total_spent) /
                          (stats.totalBookings || profile.customer.total_bookings),
                        )
                        : formatCurrency(0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600 text-sm">Loyalty points</span>
                    <span className="font-bold text-blue-600">Coming soon</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Driver Statistics Tab */}
        {activeTab === "driver-stats" && profile.driver && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Car className="w-10 h-10 opacity-80" />
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-3xl font-bold mb-2">
                {profile.driver.total_trips || 0}
              </h3>
              <p className="text-blue-100 text-sm font-medium">
                Tổng số chuyến đi
              </p>
            </div>

            <div className="bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Star className="w-10 h-10 opacity-80" />
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-3xl font-bold mb-2">
                {profile.driver.rating
                  ? profile.driver.rating.toFixed(1)
                  : "0.0"}
                <span className="text-xl ml-1">⭐</span>
              </h3>
              <p className="text-yellow-100 text-sm font-medium">
                Đánh giá trung bình
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <Award className="w-10 h-10 opacity-80" />
                <TrendingUp className="w-6 h-6 opacity-60" />
              </div>
              <h3 className="text-3xl font-bold mb-2">
                {profile.driver.experience_years || 0}
              </h3>
              <p className="text-purple-100 text-sm font-medium">Năm kinh nghiệm</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;
