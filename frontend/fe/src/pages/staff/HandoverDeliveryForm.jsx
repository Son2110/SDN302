import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDeliveryHandover } from "../../services/handoverApi";
import { ArrowLeft, Loader2, KeyRound } from "lucide-react";

export default function HandoverDeliveryForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    booking_id: "",
    mileage: "",
    battery_level_percentage: "",
    notes: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      
      const payload = {
        booking_id: formData.booking_id,
        mileage: formData.mileage ? Number(formData.mileage) : undefined,
        battery_level_percentage: formData.battery_level_percentage ? Number(formData.battery_level_percentage) : undefined,
        notes: formData.notes
      };

      await createDeliveryHandover(payload);
      alert("Lập biên bản giao xe thành công!");
      navigate("/staff/handovers");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biên bản Giao xe (Delivery)</h1>
          <p className="text-gray-500 text-sm mt-1">Bàn giao xe cho khách hàng và bắt đầu chuyến đi</p>
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
            <p className="text-xs text-gray-500 mt-1">Đơn phải ở trạng thái "confirmed"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Số Km ODO hiện tại</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: 35000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">% Pin (Nếu là xe điện)</label>
              <input
                type="number"
                name="battery_level_percentage"
                min="0"
                max="100"
                value={formData.battery_level_percentage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="VD: 95"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú tình trạng xe</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Xe bị trầy xước nhẹ ở cản trước, đủ giấy tờ..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition flex items-center disabled:opacity-50 w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <KeyRound className="w-5 h-5 mr-2" />}
              Tạo Biên Bản Giao Xe
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
