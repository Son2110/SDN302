import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createReturnHandover } from "../../services/handoverApi";
import { formatCurrency } from "../../utils/formatters";
import { ArrowLeft, Loader2, ArrowRightLeft } from "lucide-react";

export default function HandoverReturnForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    booking_id: "",
    return_mileage: "",
    battery_level_percentage: "",
    penalty_amount: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccessData(null);
      
      const payload = {
        booking_id: formData.booking_id,
        return_mileage: formData.return_mileage ? Number(formData.return_mileage) : undefined,
        battery_level_percentage: formData.battery_level_percentage ? Number(formData.battery_level_percentage) : undefined,
        penalty_amount: formData.penalty_amount ? Number(formData.penalty_amount) : undefined,
        notes: formData.notes
      };

      const res = await createReturnHandover(payload);
      setSuccessData(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="max-w-xl mx-auto space-y-6 mt-10">
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-green-200 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Nhận lại xe thành công!</h2>
          <p className="text-gray-600 mb-6">Biên bản thu hồi xe đã được lưu hệ thống.</p>
          
          <div className="bg-gray-50 rounded-xl p-4 text-left space-y-3 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-500">Phí sạc pin (Charging Fee):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(successData.charging_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Tiền phạt (Penalty):</span>
              <span className="font-semibold text-gray-900">{formatCurrency(successData.penalty_amount)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between">
              <span className="font-bold text-gray-800">Số tiền khách cần thanh toán thêm:</span>
              <span className="font-bold text-red-600 text-lg">{formatCurrency(successData.final_amount_to_pay)}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate("/staff/handovers")}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition"
          >
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biên bản Thu xe (Return)</h1>
          <p className="text-gray-500 text-sm mt-1">Ghi nhận tình trạng xe khi hoàn tất chuyến đi</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ID Đơn đặt xe (Booking ID) <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="booking_id"
              required
              value={formData.booking_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="VD: 665c..."
            />
            <p className="text-xs text-gray-500 mt-1">Đơn phải ở trạng thái "in_progress"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số Km ODO lúc trả <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="return_mileage"
                required
                value={formData.return_mileage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: 35500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">% Pin lúc trả (Xe điện)</label>
              <input
                type="number"
                name="battery_level_percentage"
                min="0"
                max="100"
                value={formData.battery_level_percentage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: 60"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiền phạt (VNĐ - nếu có)</label>
              <input
                type="number"
                name="penalty_amount"
                min="0"
                value={formData.penalty_amount}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: 500000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú tình trạng xe lúc trả</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Xước nhẹ cản trước..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition flex items-center disabled:opacity-50 w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRightLeft className="w-5 h-5 mr-2" />}
              Tạo Biên Bản Thu Xe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
