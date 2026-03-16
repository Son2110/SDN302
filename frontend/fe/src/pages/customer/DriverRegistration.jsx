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
      // Re-apply uses PUT, new registration uses POST
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
    // Pre-fill form with existing data
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
            Requirements to become a driver
          </h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Valid car driving license (B1 or higher)</li>
            <li>• License must be valid (not expired)</li>
            <li>• At least 1 year of driving experience</li>
          </ul>
        </div>
      )}

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <IdCard size={18} /> Driver license number *
        </label>
        <input
          type="text"
          name="license_number"
          required
          value={formData.license_number}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          placeholder="Example: 012345678"
        />
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <IdCard size={18} /> License class *
        </label>
        <select
          name="license_type"
          required
          value={formData.license_type}
          onChange={handleChange}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
        >
          <option value="">Select license class</option>
          <option value="B1">B1 - Under 9 seats (automatic)</option>
          <option value="B2">B2 - Under 9 seats</option>
          <option value="C">C - Trucks and tractors</option>
          <option value="D">D - 9 seats or more</option>
          <option value="E">E - Vehicles with trailer/semi-trailer</option>
        </select>
      </div>

      <div>
        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
          <Calendar size={18} /> Expiry date *
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
          <Award size={18} /> Years of driving experience *
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
          placeholder="Example: 5"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading
            ? "Processing..."
            : isReapply
              ? "Re-apply"
              : "Driver Registration"}
        </button>
        {isReapply && (
          <button
            type="button"
            onClick={() => setShowReapplyForm(false)}
            className="px-6 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );

  if (pageLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  // === Registered: show current status ===
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
              className={`p-6 text-white ${isPending ? "bg-blue-600" : isApproved ? "bg-blue-700" : "bg-red-600"}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  {isPending && <Clock size={30} />}
                  {isApproved && <CheckCircle size={30} />}
                  {isRejected && <XCircle size={30} />}
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {isPending && "Pending approval"}
                    {isApproved && "Profile approved!"}
                    {isRejected && "Profile rejected"}
                  </h1>
                  <p className="text-sm opacity-90 mt-1">
                    {isPending &&
                      "Our staff will review your profile as soon as possible"}
                    {isApproved && "You are already a driver and can receive assignments"}
                    {isRejected &&
                      "See the reason below and re-apply if you want"}
                  </p>
                </div>
              </div>
            </div>

            {/* Application information */}
            <div className="p-6">
              <h3 className="font-bold text-gray-800 mb-4">
                Submitted information
              </h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">License number</span>
                  <p className="font-semibold mt-1">
                    {existingStatus.license_number}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">License class</span>
                  <p className="font-semibold mt-1">
                    {existingStatus.license_type}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">License expiry</span>
                  <p className="font-semibold mt-1">
                    {formatDate(existingStatus.license_expiry)}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <span className="text-gray-500 text-xs">Experience</span>
                  <p className="font-semibold mt-1">
                    {existingStatus.experience_years} years
                  </p>
                </div>
              </div>

              {/* Rejection reason */}
              {isRejected && existingStatus.rejection_reason && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-800 mb-1">
                    Rejection reason:
                  </p>
                  <p className="text-red-700">
                    {existingStatus.rejection_reason}
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex gap-3">
                {isRejected && !showReapplyForm && (
                  <button
                    onClick={handleOpenReapply}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition"
                  >
                    <RefreshCw size={18} />
                    Re-apply
                  </button>
                )}
                <button
                  onClick={() => navigate("/")}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition"
                >
                  Back to home
                </button>
              </div>
            </div>
          </div>

          {/* Re-apply form (only for rejected status) */}
          {isRejected && showReapplyForm && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
                <RefreshCw size={22} className="text-blue-600" />
                Re-apply
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Update your information and submit for review again
              </p>
              <DriverForm isReapply={true} />
            </div>
          )}
        </div>
      </div>
    );
  }

  // === After successful submit ===
  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center px-6">
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={48} className="text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {existingStatus?.status === "rejected"
              ? "Re-application submitted!"
              : "Registration successful!"}
          </h1>
          <p className="text-gray-600 mb-6">
            Your application is waiting for staff review.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 font-semibold">
              ⏳ Status: Pending review
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Back to home
          </button>
        </div>
      </div>
    );
  }

  // === Not registered yet: new registration form ===
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 pt-28 pb-16 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <UserPlus size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Driver Registration</h1>
                <p className="text-blue-100 mt-1">
                  Start earning by driving customers
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
            Benefits of becoming a driver
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">High income</h3>
              <p className="text-sm text-gray-600">
                Flexible income by schedule
              </p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">
                Flexible schedule
              </h3>
              <p className="text-sm text-gray-600">Control your working time</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle size={24} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">24/7 Support</h3>
              <p className="text-sm text-gray-600">Support team is always available</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverRegistration;
