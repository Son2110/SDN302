import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getBookingDetail, updateBooking, deleteBooking } from "../../services/bookingApi";
import { getPaymentsByBookingId } from "../../services/paymentApiStaff";
import {
  getHandoversByBookingId,
  createDeliveryHandover,
  createReturnHandover,
} from "../../services/handoverApi";
import { formatDate, formatCurrency } from "../../utils/formatters";
import {
  ArrowLeft,
  Loader2,
  Edit,
  Trash2,
  X,
  Save,
  Car,
  KeyRound,
  ArrowRightLeft,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";

/* ─────────────────────────────────────────────────────────────
   Reusable Modal Wrapper
───────────────────────────────────────────────────────────── */
function Modal({ onClose, children }) {
  // Close on backdrop click
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg relative animate-fadeIn">
        {children}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Delivery Handover Modal
───────────────────────────────────────────────────────────── */
function DeliveryModal({ bookingId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    mileage: "",
    battery_level_percentage: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (form.mileage === "" || form.mileage === undefined) {
      setError("Current ODO Mileage is required.");
      return;
    }

    const mileageNum = Number(form.mileage);
    if (isNaN(mileageNum) || mileageNum < 0) {
      setError("Mileage must be a non-negative number.");
      return;
    }

    if (form.battery_level_percentage !== "") {
      const battery = Number(form.battery_level_percentage);
      if (battery < 0 || battery > 100 || isNaN(battery)) {
        setError("Battery level must be between 0 and 100.");
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);
      await createDeliveryHandover({
        booking_id: bookingId,
        mileage: mileageNum,
        battery_level_percentage: form.battery_level_percentage
          ? Number(form.battery_level_percentage)
          : undefined,
        notes: form.notes?.trim() || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Delivery Handover Record</h2>
            <p className="text-xs text-gray-500">Handing over vehicle to customer</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current ODO Mileage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="mileage"
              required
              value={form.mileage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. 35000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Battery % (EV only)
            </label>
            <input
              type="number"
              name="battery_level_percentage"
              min="0"
              max="100"
              value={form.battery_level_percentage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
              placeholder="e.g. 95"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle Condition Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            placeholder="Minor scratches on front bumper, all documents included..."
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm hover:bg-indigo-700 font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <KeyRound className="w-4 h-4" />
            )}
            Create Delivery Record
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   Return Handover Modal
───────────────────────────────────────────────────────────── */
function ReturnModal({ bookingId, onClose, onSuccess }) {
  const [form, setForm] = useState({
    return_mileage: "",
    battery_level_percentage: "",
    penalty_amount: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (form.return_mileage === "" || form.return_mileage === undefined) {
      setError("Return ODO Mileage is required.");
      return;
    }

    const returnMileageNum = Number(form.return_mileage);
    if (isNaN(returnMileageNum) || returnMileageNum < 0) {
      setError("Return mileage must be a non-negative number.");
      return;
    }

    if (form.battery_level_percentage !== "") {
      const battery = Number(form.battery_level_percentage);
      if (battery < 0 || battery > 100 || isNaN(battery)) {
        setError("Battery level must be between 0 and 100.");
        return;
      }
    }

    if (form.penalty_amount !== "" && (Number(form.penalty_amount) < 0 || isNaN(Number(form.penalty_amount)))) {
      setError("Penalty amount cannot be negative.");
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await createReturnHandover({
        booking_id: bookingId,
        return_mileage: returnMileageNum,
        battery_level_percentage: form.battery_level_percentage
          ? Number(form.battery_level_percentage)
          : undefined,
        penalty_amount: form.penalty_amount ? Number(form.penalty_amount) : undefined,
        notes: form.notes?.trim() || undefined,
      });
      onSuccess(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
            <ArrowRightLeft className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">Return Handover Record</h2>
            <p className="text-xs text-gray-500">Record vehicle condition upon completion</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return ODO Mileage <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="return_mileage"
              required
              value={form.return_mileage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="VD: 35500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return Battery % (EV only)
            </label>
            <input
              type="number"
              name="battery_level_percentage"
              min="0"
              max="100"
              value={form.battery_level_percentage}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="VD: 60"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Penalty Amount (VND – if any)
            </label>
            <input
              type="number"
              name="penalty_amount"
              min="0"
              value={form.penalty_amount}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="VD: 500000"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Return Vehicle Condition Notes
          </label>
          <textarea
            name="notes"
            rows={3}
            value={form.notes}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
            placeholder="Minor scratches on front bumper..."
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-700 hover:bg-gray-50 font-medium transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm hover:bg-emerald-700 font-medium transition flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="w-4 h-4" />
            )}
            Create Return Record
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   View Handover Details Modal
───────────────────────────────────────────────────────────── */
function ViewHandoverModal({ handover, onClose }) {
  if (!handover) return null;
  const isDelivery = handover.handover_type === "delivery";

  return (
    <Modal onClose={onClose}>
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-4 border-b border-gray-100 ${isDelivery ? 'bg-blue-50/30' : 'bg-emerald-50/30'}`}>
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDelivery ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
            {isDelivery ? <KeyRound className="w-4 h-4" /> : <ArrowRightLeft className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-900">
              {isDelivery ? "Delivery Record Detail" : "Return Record Detail"}
            </h2>
            <p className="text-xs text-gray-500">
              {isDelivery ? "Handed over to customer" : "Received from customer"}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-200 rounded-lg transition text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-6 space-y-6">
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Time</p>
            <p className="text-sm font-semibold text-gray-900">
              {formatDate(handover.handover_time, true)}
            </p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Staff in charge</p>
            <p className="text-sm font-semibold text-gray-900">
              {handover.staff?.user?.full_name || handover.staff_name || "N/A"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Odometer (ODO)</p>
            <p className="text-sm font-semibold text-gray-900">{handover.mileage} km</p>
          </div>
          <div className="space-y-1 text-right">
            <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Battery Level</p>
            <p className="text-sm font-semibold text-gray-900">{handover.battery_level_percentage}%</p>
          </div>
        </div>

        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 italic text-sm text-gray-600">
          <p className="text-xs text-gray-400 uppercase font-bold tracking-wider mb-2 not-italic">Notes</p>
          {handover.notes || "No additional notes provided."}
        </div>

        <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl">
           <span className="text-xs font-bold text-gray-500 uppercase">Customer Confirmation</span>
           <div className="flex items-center gap-1.5">
             <CheckCircle2 className={`w-4 h-4 ${handover.confirmed_by_customer ? 'text-green-500' : 'text-gray-300'}`} />
             <span className={`text-sm font-medium ${handover.confirmed_by_customer ? 'text-green-700' : 'text-gray-400'}`}>
               {handover.confirmed_by_customer ? "Confirmed by Customer" : "Unconfirmed"}
             </span>
           </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-gray-100 flex justify-end">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition shadow-lg shadow-gray-900/10"
        >
          Close Detail
        </button>
      </div>
    </Modal>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────────── */
export default function StaffBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [payments, setPayments] = useState(null);
  const [handovers, setHandovers] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Edit booking
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    vehicle_id: "",
    start_date: "",
    end_date: "",
    rental_type: "",
    pickup_location: "",
    return_location: "",
  });
  const [saving, setSaving] = useState(false);

  // Modals
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [viewHandover, setViewHandover] = useState(null);

  // Notifications
  const [deliverySuccess, setDeliverySuccess] = useState(false);
  const [returnSuccessData, setReturnSuccessData] = useState(null);

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

  // ── Edit handlers ────────────────────────────────────────────────────────
  const handleEditChange = (e) =>
    setEditForm({ ...editForm, [e.target.name]: e.target.value });

  const startEditing = () => {
    setEditForm({
      vehicle_id: booking.vehicle?._id || "",
      start_date: booking.start_date ? booking.start_date.split("T")[0] : "",
      end_date: booking.end_date ? booking.end_date.split("T")[0] : "",
      rental_type: booking.rental_type || "",
      pickup_location: booking.pickup_location || "",
      return_location: booking.return_location || "",
    });
    setIsEditing(true);
  };

  const handleUpdate = async () => {
    try {
      setSaving(true);
      
      // Validation
      if (editForm.start_date && editForm.end_date) {
        const start = new Date(editForm.start_date);
        const end = new Date(editForm.end_date);
        if (start > end) {
          toast.error("Error: Start date must be before or equal to end date.");
          setSaving(false);
          return;
        }
      }

      const payload = {};
      
      // Only include non-empty values after trimming
      if (editForm.vehicle_id?.trim()) payload.vehicle_id = editForm.vehicle_id.trim();
      if (editForm.start_date) payload.start_date = new Date(editForm.start_date).toISOString();
      if (editForm.end_date) payload.end_date = new Date(editForm.end_date).toISOString();
      if (editForm.rental_type) payload.rental_type = editForm.rental_type;
      if (editForm.pickup_location?.trim()) payload.pickup_location = editForm.pickup_location.trim();
      if (editForm.return_location?.trim()) payload.return_location = editForm.return_location.trim();

      if (Object.keys(payload).length === 0) {
        toast.error("No changes to save.");
        setSaving(false);
        return;
      }

      await updateBooking(id, payload);
      toast.success("Booking updated successfully");
      setIsEditing(false);
      fetchData();
    } catch (err) {
      toast.error("Error updating: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!window.confirm("Are you sure you want to delete this booking?")) return;
      await deleteBooking(id);
      toast.success("Booking deleted successfully");
      navigate("/staff/bookings");
    } catch (err) {
      toast.error("Error deleting: " + err.message);
    }
  };

  // ── Modal callbacks ──────────────────────────────────────────────────────
  const handleDeliverySuccess = () => {
    setShowDeliveryModal(false);
    setDeliverySuccess(true);
    fetchData();
  };

  const handleReturnSuccess = (data) => {
    setShowReturnModal(false);
    setReturnSuccessData(data);
    fetchData();
  };

  // ── Guards ───────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  if (error)
    return (
      <div className="p-10 text-red-600 text-center bg-red-50 rounded-lg">
        {error}
      </div>
    );
  if (!booking)
    return (
      <div className="p-10 text-gray-500 text-center">
        Booking not found.
      </div>
    );

  const canEdit =
    booking.status === "pending" || booking.status === "confirmed";
  const canDelete =
    booking.status === "pending" || booking.status === "cancelled";
  const canDelivery =
    booking.status === "confirmed" &&
    !handovers?.delivery &&
    (booking.rental_type !== "with_driver" || booking.driver);
  const canReturn =
    booking.status === "in_progress" &&
    handovers?.delivery &&
    !handovers?.return;

  return (
    <>
      {/* ── Modals ── */}
      {showDeliveryModal && (
        <DeliveryModal
          bookingId={id}
          onClose={() => setShowDeliveryModal(false)}
          onSuccess={handleDeliverySuccess}
        />
      )}
      {showReturnModal && (
        <ReturnModal
          bookingId={id}
          onClose={() => setShowReturnModal(false)}
          onSuccess={handleReturnSuccess}
        />
      )}

      {viewHandover && (
        <ViewHandoverModal
          handover={viewHandover}
          onClose={() => setViewHandover(null)}
        />
      )}

      {/* ── Page Content ── */}
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/staff/bookings")}
              className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 transition border border-gray-100"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Booking Details #{booking._id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                Status:{" "}
                <span className="font-semibold uppercase text-blue-600">
                  {booking.status}
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            {canEdit && !isEditing && (
              <button
                onClick={startEditing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition text-sm"
              >
                <Edit className="w-4 h-4" />
                Edit Booking
              </button>
            )}
            {canDelete && !isEditing && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition text-sm"
              >
                <Trash2 className="w-4 h-4" />
                Delete Booking
              </button>
            )}
            {canDelivery && !isEditing && (
              <button
                onClick={() => setShowDeliveryModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-lg hover:bg-indigo-100 transition text-sm"
              >
                <KeyRound className="w-4 h-4" />
                Create Delivery Record
              </button>
            )}
            {canReturn && !isEditing && (
              <button
                onClick={() => setShowReturnModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 font-medium rounded-lg hover:bg-emerald-100 transition text-sm"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Create Return Record
              </button>
            )}
          </div>
        </div>

        {/* ── Delivery success banner ── */}
        {deliverySuccess && (
          <div className="flex items-center gap-3 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0" />
            <p className="text-indigo-700 font-medium text-sm">
              Delivery record created successfully!
            </p>
          </div>
        )}

        {/* ── Return success card ── */}
        {returnSuccessData && (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-green-800">
                  Vehicle returned successfully!
                </h2>
                <p className="text-sm text-gray-500">
                  Return handover record has been saved.
                </p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Penalty Amount:</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(returnSuccessData.penalty_amount)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between">
                <span className="font-bold text-gray-800 text-sm">
                  Customer needs to pay extra:
                </span>
                <span className="font-bold text-red-600 text-base">
                  {formatCurrency(returnSuccessData.final_amount_to_pay)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main ── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip info */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Trip Information
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Service
                      </label>
                      <select
                        name="rental_type"
                        value={editForm.rental_type}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      >
                        <option value="">(Optional: Leave blank if no change)</option>
                        <option value="self_drive">Self-drive</option>
                        <option value="with_driver">With Driver</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Vehicle ID to Change
                      </label>
                      <input
                        type="text"
                        name="vehicle_id"
                        value={editForm.vehicle_id}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                        placeholder="Enter Vehicle ID..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={editForm.start_date}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={editForm.end_date}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        name="pickup_location"
                        value={editForm.pickup_location}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Return Location
                      </label>
                      <input
                        type="text"
                        name="return_location"
                        value={editForm.return_location}
                        onChange={handleEditChange}
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 flex items-center transition font-medium"
                    >
                      <X className="w-4 h-4 mr-2" /> Cancel
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={saving}
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center transition font-medium disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-6">
                  <div>
                    <p className="text-sm text-gray-500">Start Date</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatDate(booking.start_date, true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">End Date</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatDate(booking.end_date, true)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-800 mt-1 uppercase text-xs bg-gray-100 inline-block px-2.5 py-1 rounded">
                      {booking.rental_type === "with_driver"
                        ? "With Driver"
                        : booking.rental_type === "self_drive"
                        ? "Self-drive"
                        : booking.rental_type}
                    </p>
                  </div>
                  {booking.rental_type === "with_driver" && (
                    <div>
                      <p className="text-sm text-gray-500">Driver</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {booking.driver?.user?.full_name || "Not assigned"}
                      </p>
                    </div>
                  )}
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {booking.pickup_location || "No information"}
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-500">Return Location</p>
                    <p className="font-medium text-gray-900 mt-1">
                      {booking.return_location || "No information"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Vehicle */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Vehicle Information
              </h2>
              {booking.vehicle ? (
                <div className="flex items-start md:items-center space-x-5 flex-col md:flex-row space-y-4 md:space-y-0">
                  <div className="w-32 h-24 bg-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    {booking.vehicle.image_urls?.[0] ? (
                      <img
                        src={booking.vehicle.image_urls[0]}
                        alt="Car"
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <Car className="w-10 h-10 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">
                      {booking.vehicle.brand} {booking.vehicle.model}
                    </h3>
                    <div className="flex items-center space-x-3 mt-2">
                      <span className="text-sm font-bold text-gray-700 uppercase border-2 border-dashed border-gray-300 px-3 py-1 rounded bg-gray-50">
                        {booking.vehicle.license_plate}
                      </span>
                      {booking.vehicle.vehicle_type?.type_name && (
                        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {booking.vehicle.vehicle_type.type_name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">No vehicle data available</p>
              )}
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">
            {/* Customer */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Customer
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {booking.customer?.user?.full_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {booking.customer?.user?.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-semibold text-gray-900 mt-0.5">
                    {booking.customer?.user?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Finance */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 mb-4">Finance</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Total Amount</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(booking.total_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-medium">Deposit</span>
                  <span className="font-bold text-gray-900">
                    {formatCurrency(booking.deposit_amount)}
                  </span>
                </div>
                {payments?.summary && (
                  <>
                    <div className="border-t border-gray-100 pt-3 mt-3" />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-medium">
                        Total Paid
                      </span>
                      <span className="font-bold text-green-600">
                        {formatCurrency(payments.summary.total_paid)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mt-2">
                      <span className="text-gray-800 font-bold">Remaining Balance</span>
                      {booking.status === "completed" ? (
                        <span className="font-bold text-green-600 text-lg flex items-center gap-1">
                          <CheckCircle2 className="w-5 h-5" /> Paid Full
                        </span>
                      ) : (
                        <span className="font-bold text-red-600 text-lg">
                          {formatCurrency(
                            Math.max(0, booking.total_amount - payments.summary.total_paid)
                          )}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Handover summary */}
            {handovers?.delivery && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  Handover Records
                </h2>
                <div className="space-y-4">
                  <button 
                    onClick={() => setViewHandover(handovers.delivery)}
                    className="w-full text-left p-4 bg-blue-50 border border-blue-100 rounded-xl relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all active:scale-[0.98]"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-400 group-hover:bg-blue-600 transition-colors" />
                    <div className="flex justify-between items-start mb-1">
                      <p className="text-sm font-bold text-blue-900">Delivery Handover</p>
                    </div>
                    <p className="text-sm font-medium text-gray-700 mt-1">
                      {formatDate(handovers.delivery.handover_time, true)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex justify-between">
                      <span>
                        Staff: {handovers.delivery.staff?.user?.full_name}
                      </span>
                      <span className="font-medium text-gray-700">
                        {handovers.delivery.mileage} km
                      </span>
                    </p>
                  </button>
                  {handovers.return && (
                    <button 
                      onClick={() => setViewHandover(handovers.return)}
                      className="w-full text-left p-4 bg-green-50 border border-green-100 rounded-xl relative overflow-hidden group hover:border-green-300 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <div className="absolute top-0 left-0 w-1 h-full bg-green-400 group-hover:bg-green-600 transition-colors" />
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-sm font-bold text-green-900">Return Handover</p>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mt-1">
                        {formatDate(handovers.return.handover_time, true)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 flex justify-between">
                        <span>
                          Staff: {handovers.return.staff?.user?.full_name}
                        </span>
                        <span className="font-medium text-gray-700">
                          Driven: {handovers.km_driven} km
                        </span>
                      </p>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
