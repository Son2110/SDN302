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
      alert("Delivery record created successfully!");
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
          <h1 className="text-2xl font-bold text-gray-900">Delivery Handover Record</h1>
          <p className="text-gray-500 text-sm mt-1">Handover vehicle to customer and start the trip</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="p-4 bg-red-50 text-red-600 rounded-lg">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking ID <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="booking_id"
              required
              value={formData.booking_id}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g. 665c..."
            />
            <p className="text-xs text-gray-500 mt-1">Booking must be in 'confirmed' status</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current ODO (km)</label>
              <input
                type="number"
                name="mileage"
                value={formData.mileage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 35000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Battery % (For electric vehicles)</label>
              <input
                type="number"
                name="battery_level_percentage"
                min="0"
                max="100"
                value={formData.battery_level_percentage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 95"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Condition Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Minor scratches on front bumper, all papers included..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition flex items-center disabled:opacity-50 w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <KeyRound className="w-5 h-5 mr-2" />}
              Create Delivery Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
