import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    AlertCircle,
    ClipboardCheck,
    BatteryCharging,
    Gauge,
    User,
    CheckCircle,
    ArrowRightLeft,
} from "lucide-react";
import { getBookingById } from "../../services/bookingApi";
import {
    getHandoversByBookingId,
    confirmDeliveryReceipt,
} from "../../services/handoverApi";

const HandoverReceipt = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [booking, setBooking] = useState(null);
    const [deliveryHandover, setDeliveryHandover] = useState(null);
    const [returnHandover, setReturnHandover] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState("");

    const loadData = async () => {
        try {
            setLoading(true);
            setError("");

            const [bookingRes, handoverRes] = await Promise.all([
                getBookingById(id),
                getHandoversByBookingId(id),
            ]);

            setBooking(bookingRes.data);
            setDeliveryHandover(handoverRes?.data?.delivery || null);
            setReturnHandover(handoverRes?.data?.return || null);
        } catch (err) {
            setError(err.message || "Unable to load handover data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const handleConfirmReceipt = async (handoverId) => {
        if (!handoverId) return;

        try {
            setConfirming(true);
            await confirmDeliveryReceipt(handoverId);
            await loadData();
        } catch (err) {
            setError(err.message || "Unable to confirm receipt");
        } finally {
            setConfirming(false);
        }
    };

    const formatDateTime = (date) => {
        return new Date(date).toLocaleString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error && !booking) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20 flex items-center justify-center px-6">
                <div className="max-w-xl w-full bg-white border border-red-200 rounded-2xl p-6 text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                    <p className="text-red-600 font-semibold">{error}</p>
                    <button
                        onClick={() => navigate("/my-bookings")}
                        className="mt-4 text-blue-600 hover:text-blue-700 underline"
                    >
                        Back to my bookings
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="max-w-4xl mx-auto px-6 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                    <h1 className="text-2xl font-bold text-gray-900">Vehicle pickup & return reports</h1>
                    <p className="text-gray-600 mt-1 text-sm">
                        Booking #{booking?._id?.slice(-8).toUpperCase()} • {booking?.vehicle?.brand} {booking?.vehicle?.model}
                    </p>
                </div>

                {!deliveryHandover ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                                <p className="text-red-700 font-semibold">Pickup report is not available yet</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Staff has not created the pickup handover report for this booking yet.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900">Pickup handover details</h2>
                            </div>
                            {deliveryHandover.confirmed_by_customer ? (
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                    Pickup confirmed
                                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                                    Waiting for pickup confirmation
                                </span>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">Handover time</p>
                                <p className="font-bold text-gray-900">
                                    {formatDateTime(deliveryHandover.handover_time)}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">Handled by</p>
                                <p className="font-bold text-gray-900 flex items-center gap-1">
                                    <User className="w-4 h-4 text-blue-600" />
                                    {deliveryHandover.staff?.user?.full_name || "Staff"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">ODO mileage</p>
                                <p className="font-bold text-gray-900 flex items-center gap-1">
                                    <Gauge className="w-4 h-4 text-blue-600" />
                                    {deliveryHandover.mileage ?? "N/A"} km
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">Battery level</p>
                                <p className="font-bold text-gray-900 flex items-center gap-1">
                                    <BatteryCharging className="w-4 h-4 text-blue-600" />
                                    {deliveryHandover.battery_level_percentage ?? "N/A"}%
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Vehicle notes</p>
                            <p className="text-sm text-gray-700">
                                {deliveryHandover.notes || "No additional notes."}
                            </p>
                        </div>

                        {!deliveryHandover.confirmed_by_customer ? (
                            <button
                                onClick={() => handleConfirmReceipt(deliveryHandover._id)}
                                disabled={confirming}
                                className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {confirming ? "Confirming..." : "Confirm vehicle pickup"}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-blue-700 font-semibold">
                                <CheckCircle className="w-5 h-5" />
                                You have confirmed this pickup report.
                            </div>
                        )}
                    </div>
                )}

                {!returnHandover ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <div className="flex items-start gap-3">
                            <ArrowRightLeft className="w-5 h-5 text-gray-500 mt-0.5" />
                            <div>
                                <p className="text-gray-800 font-semibold">Return report is not available yet</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    This report appears after staff completes the return handover at the end of your rental.
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <ArrowRightLeft className="w-5 h-5 text-blue-600" />
                                <h2 className="text-lg font-bold text-gray-900">Return handover details</h2>
                            </div>
                            {returnHandover.confirmed_by_customer ? (
                                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200">
                                    Return confirmed
                                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold border border-red-200">
                                    Waiting for return confirmation
                                </span>
                            )}
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">Return time</p>
                                <p className="font-bold text-gray-900">
                                    {formatDateTime(returnHandover.handover_time)}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">Handled by</p>
                                <p className="font-bold text-gray-900 flex items-center gap-1">
                                    <User className="w-4 h-4 text-blue-600" />
                                    {returnHandover.staff?.user?.full_name || "Staff"}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">ODO mileage</p>
                                <p className="font-bold text-gray-900 flex items-center gap-1">
                                    <Gauge className="w-4 h-4 text-blue-600" />
                                    {returnHandover.mileage ?? "N/A"} km
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-4">
                                <p className="text-gray-500 mb-1">Battery level</p>
                                <p className="font-bold text-gray-900 flex items-center gap-1">
                                    <BatteryCharging className="w-4 h-4 text-blue-600" />
                                    {returnHandover.battery_level_percentage ?? "N/A"}%
                                </p>
                            </div>
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Return notes</p>
                            <p className="text-sm text-gray-700">
                                {returnHandover.notes || "No additional notes."}
                            </p>
                        </div>

                        {!returnHandover.confirmed_by_customer ? (
                            <button
                                onClick={() => handleConfirmReceipt(returnHandover._id)}
                                disabled={confirming}
                                className="w-full md:w-auto px-6 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                {confirming ? "Confirming..." : "Confirm vehicle return"}
                            </button>
                        ) : (
                            <div className="flex items-center gap-2 text-blue-700 font-semibold">
                                <CheckCircle className="w-5 h-5" />
                                You have confirmed this return report.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex gap-3">
                    <Link
                        to={`/bookings/${id}`}
                        className="px-5 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:border-blue-300"
                    >
                        Back to booking details
                    </Link>
                    <Link
                        to="/my-bookings"
                        className="px-5 py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-black"
                    >
                        Back to my bookings
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default HandoverReceipt;
