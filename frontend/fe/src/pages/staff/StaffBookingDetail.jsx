import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingDetail, updateBooking, deleteBooking } from "../../services/bookingApi";
import { getPaymentsByBookingId } from "../../services/paymentApiStaff";
import { getHandoversByBookingId } from "../../services/handoverApi";
import { formatDate, formatCurrency } from "../../utils/formatters";
import { ArrowLeft, Loader2, Edit, Trash2, X, Save, Car } from "lucide-react";

export default function StaffBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState(null);
  const [handovers, setHandovers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    vehicle_id: "",
    start_date: "",
    end_date: "",
    rental_type: "",
    pickup_location: "",
    return_location: ""
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const bRes = await getBookingDetail(id);
      setBooking(bRes.data);
      
      try {
        const pRes = await getPaymentsByBookingId(id);
        setPayments(pRes);
      } catch (e) {
        console.error("Failed to fetch payments", e);
      }
      
      try {
        const hRes = await getHandoversByBookingId(id);
        setHandovers(hRes.data);
      } catch (e) {
        console.error("Failed to fetch handovers", e);
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const startEditing = () => {
    setEditForm({
      vehicle_id: booking.vehicle?._id || "",
      start_date: booking.start_date ? booking.start_date.split("T")[0] : "",
      end_date: booking.end_date ? booking.end_date.split("T")[0] : "",
      rental_type: booking.rental_type || "",
      pickup_location: booking.pickup_location || "",
      return_location: booking.return_location || ""
    });
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      const payload = Object.fromEntries(
        Object.entries(editForm).filter(([_, v]) => v !== "")
      );
      if (payload.start_date) payload.start_date = new Date(payload.start_date).toISOString();
      if (payload.end_date) payload.end_date = new Date(payload.end_date).toISOString();
      
      await updateBooking(id, payload);
      setIsEditing(false);
      fetchData();
    } catch (err) {
      alert("Lỗi khi cập nhật: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Bạn có chắc chắn muốn xoá đơn đặt xe này?")) return;
    try {
      await deleteBooking(id);
      navigate("/staff/bookings");
    } catch (err) {
      alert("Lỗi khi xoá: " + err.message);
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (error) return <div className="p-10 text-red-600 text-center bg-red-50 rounded-lg">{error}</div>;
  if (!booking) return <div className="p-10 text-gray-500 text-center">Không tìm thấy đơn đặt xe.</div>;

  const canEdit = booking.status === "pending" || booking.status === "confirmed";
  const canDelete = booking.status === "pending" || booking.status === "cancelled";

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate("/staff/bookings")} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-100">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Chi tiết đơn #{booking._id.slice(-6).toUpperCase()}</h1>
            <p className="text-gray-500 text-sm mt-1">Trạng thái hiện tại: <span className="font-semibold uppercase text-blue-600">{booking.status}</span></p>
          </div>
        </div>
        <div className="flex space-x-3">
          {canEdit && !isEditing && (
            <button onClick={startEditing} className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition">
              <Edit className="w-4 h-4" />
              <span>Sửa đơn</span>
            </button>
          )}
          {canDelete && !isEditing && (
            <button onClick={handleDelete} className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition">
              <Trash2 className="w-4 h-4" />
              <span>Xoá đơn</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Form Edit or Detail */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin chuyến đi</h2>
            {isEditing ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Loại thuê</label>
                    <select name="rental_type" value={editForm.rental_type} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition">
                      <option value="">(Bỏ qua nếu không đổi)</option>
                      <option value="self_drive">Tự lái</option>
                      <option value="with_driver">Có tài xế</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Xe cần đổi</label>
                    <input type="text" name="vehicle_id" value={editForm.vehicle_id} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="Nhập ID Xe..." />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                    <input type="date" name="start_date" value={editForm.start_date} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                    <input type="date" name="end_date" value={editForm.end_date} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm nhận xe</label>
                    <input type="text" name="pickup_location" value={editForm.pickup_location} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Điểm trả xe</label>
                    <input type="text" name="return_location" value={editForm.return_location} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition" />
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button onClick={() => setIsEditing(false)} className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center transition font-medium">
                    <X className="w-4 h-4 mr-2" /> Huỷ
                  </button>
                  <button onClick={handleUpdate} disabled={saving} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition font-medium disabled:opacity-50">
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Lưu thay đổi
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                <div>
                  <p className="text-sm text-gray-500">Ngày bắt đầu</p>
                  <p className="font-semibold text-gray-900 mt-1">{formatDate(booking.start_date, true)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày kết thúc</p>
                  <p className="font-semibold text-gray-900 mt-1">{formatDate(booking.end_date, true)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loại thuê</p>
                  <p className="font-medium text-gray-800 mt-1 uppercase text-xs bg-gray-100 inline-block px-2.5 py-1 rounded">{booking.rental_type}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tài xế</p>
                  <p className="font-medium text-gray-900 mt-1">{booking.driver?.user?.full_name || "Chưa phân công / Không có"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Điểm nhận xe</p>
                  <p className="font-medium text-gray-900 mt-1">{booking.pickup_location || "Không có thông tin"}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-500">Điểm trả xe</p>
                  <p className="font-medium text-gray-900 mt-1">{booking.return_location || "Không có thông tin"}</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Thông tin xe</h2>
            {booking.vehicle ? (
              <div className="flex items-start md:items-center space-x-5 flex-col md:flex-row space-y-4 md:space-y-0">
                <div className="w-32 h-24 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                   {booking.vehicle.images?.[0] ? 
                    <img src={booking.vehicle.images[0]} alt="Car" className="object-cover w-full h-full" /> 
                    : <Car className="w-10 h-10 text-gray-400" />}
                </div>
                <div>
                  <h3 className="font-bold text-xl text-gray-900">{booking.vehicle.brand} {booking.vehicle.model}</h3>
                  <div className="flex items-center space-x-3 mt-2">
                    <span className="text-sm font-bold text-gray-700 uppercase border-2 border-dashed border-gray-300 px-3 py-1 rounded bg-gray-50">
                      {booking.vehicle.license_plate}
                    </span>
                    {booking.vehicle.vehicle_type?.type_name && (
                      <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">{booking.vehicle.vehicle_type.type_name}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Không có dữ liệu xe</p>
            )}
          </div>
        </div>

        {/* Sidebar Data */}
        <div className="space-y-6">
          {/* Customer */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Khách hàng</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Họ tên</p>
                <p className="font-semibold text-gray-900 mt-0.5">{booking.customer?.user?.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Số điện thoại</p>
                <p className="font-semibold text-gray-900 mt-0.5">{booking.customer?.user?.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-semibold text-gray-900 mt-0.5">{booking.customer?.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Payment Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Tài chính</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Tổng tiền</span>
                <span className="font-bold text-gray-900">{formatCurrency(booking.total_amount)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">Tiền cọc</span>
                <span className="font-bold text-gray-900">{formatCurrency(booking.deposit_amount)}</span>
              </div>
              {payments?.summary && (
                <>
                  <div className="border-t border-gray-100 pt-3 mt-3" />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 font-medium">Đã thanh toán</span>
                    <span className="font-bold text-green-600">{formatCurrency(payments.summary.total_paid)}</span>
                  </div>
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mt-2">
                    <span className="text-gray-800 font-bold">Còn lại</span>
                    <span className="font-bold text-red-600 text-lg">{formatCurrency(payments.summary.remaining)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Handovers */}
          {handovers && handovers.delivery && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Biên bản bàn giao</h2>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-blue-400"></div>
                  <p className="text-sm font-bold text-blue-900">Giao xe</p>
                  <p className="text-sm font-medium text-gray-700 mt-1">{formatDate(handovers.delivery.handover_time, true)}</p>
                  <p className="text-xs text-gray-500 mt-1 flex justify-between">
                    <span>Nhân viên: {handovers.delivery.staff?.user?.full_name}</span>
                    <span className="font-medium text-gray-700">{handovers.delivery.mileage} km</span>
                  </p>
                </div>
                {handovers.return && (
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-green-400"></div>
                    <p className="text-sm font-bold text-green-900">Trả xe</p>
                    <p className="text-sm font-medium text-gray-700 mt-1">{formatDate(handovers.return.handover_time, true)}</p>
                    <p className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>Nhân viên: {handovers.return.staff?.user?.full_name}</span>
                      <span className="font-medium text-gray-700">Chạy: {handovers.km_driven} km</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
