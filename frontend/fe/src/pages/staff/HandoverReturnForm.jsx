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
    
    // Validation
    const bookingId = formData.booking_id.trim();
    if (!bookingId) {
      setError("Booking ID cannot be empty or contain only whitespace.");
      return;
    }

    if (!formData.return_mileage || Number(formData.return_mileage) < 0 || isNaN(Number(formData.return_mileage))) {
      setError("Return mileage must be a positive number.");
      return;
    }

    if (formData.battery_level_percentage !== "") {
      const battery = Number(formData.battery_level_percentage);
      if (battery < 0 || battery > 100 || isNaN(battery)) {
        setError("Battery level must be between 0 and 100.");
        return;
      }
    }

    if (formData.penalty_amount !== "" && (Number(formData.penalty_amount) < 0 || isNaN(Number(formData.penalty_amount)))) {
      setError("Penalty amount cannot be negative.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccessData(null);
      
      const payload = {
        booking_id: bookingId,
        return_mileage: Number(formData.return_mileage),
        battery_level_percentage: formData.battery_level_percentage ? Number(formData.battery_level_percentage) : undefined,
        penalty_amount: formData.penalty_amount ? Number(formData.penalty_amount) : undefined,
        notes: formData.notes.trim()
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vehicle Return Successful!</h2>
          <p className="text-gray-600 mb-6">Return record has been saved to the system.</p>
          
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
              <span className="font-bold text-gray-800">Total amount due from customer:</span>
              <span className="font-bold text-red-600 text-lg">{formatCurrency(successData.final_amount_to_pay)}</span>
            </div>
          </div>
          
          <button
            onClick={() => navigate("/staff/handovers")}
            className="px-6 py-2.5 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition"
          >
            Back to List
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
          <h1 className="text-2xl font-bold text-gray-900">Return Handover Record</h1>
          <p className="text-gray-500 text-sm mt-1">Record vehicle condition upon trip completion</p>
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
            <p className="text-xs text-gray-500 mt-1">Booking must be in 'in_progress' status</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return ODO (km) <span className="text-red-500">*</span></label>
              <input
                type="number"
                name="return_mileage"
                required
                value={formData.return_mileage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 35500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Return Battery % (Electric)</label>
              <input
                type="number"
                name="battery_level_percentage"
                min="0"
                max="100"
                value={formData.battery_level_percentage}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 60"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Penalty Amount (VND - if applicable)</label>
              <input
                type="number"
                name="penalty_amount"
                min="0"
                value={formData.penalty_amount}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. 500000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Return Condition Notes</label>
            <textarea
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="Minor scratches on front bumper..."
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 font-medium transition flex items-center disabled:opacity-50 w-full md:w-auto justify-center"
            >
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ArrowRightLeft className="w-5 h-5 mr-2" />}
              Create Return Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
