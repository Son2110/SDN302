import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
    Calendar,
    MapPin,
    DollarSign,
    Clock,
    Car,
    User,
    Phone,
    Mail,
    CreditCard,
    ChevronLeft,
    AlertCircle,
    CheckCircle,
} from "lucide-react";
import { getBookingById, cancelBooking } from "../../services/bookingApi";
import { getToken } from "../../services/api";

const BookingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [booking, setBooking] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate("/login");
            return;
        }
        fetchBookingDetail();
    }, [id]);

    const fetchBookingDetail = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await getBookingById(id);
            setBooking(response.data);
        } catch (err) {
            setError(err.message || "Không thể tải thông tin đơn đặt xe");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelBooking = async () => {
        setCancelling(true);
        try {
            await cancelBooking(id);
            alert("Đã hủy đơn thành công!");
            navigate("/my-bookings");
        } catch (err) {
            alert(err.message || "Không thể hủy đơn. Vui lòng thử lại.");
        } finally {
            setCancelling(false);
            setShowCancelModal(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: "Chờ xác nhận", color: "bg-yellow-50 text-yellow-600 border-yellow-200" },
            confirmed: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-600 border-blue-200" },
            in_progress: { label: "Đang thuê", color: "bg-green-50 text-green-600 border-green-200" },
            vehicle_returned: { label: "Đã trả xe", color: "bg-purple-50 text-purple-600 border-purple-200" },
            completed: { label: "Hoàn thành", color: "bg-gray-50 text-gray-600 border-gray-200" },
            cancelled: { label: "Đã hủy", color: "bg-red-50 text-red-600 border-red-200" },
        };

        const config = statusConfig[status] || { label: status, color: "bg-gray-50 text-gray-600" };
        return (
            <span className={`px-4 py-2 rounded-full text-sm font-bold border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !booking) {
        return (
            <div className="min-h-screen bg-gray-50 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-6">
                    <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
                        {error || "Không tìm thấy đơn đặt xe"}
                    </div>
                    <Link
                        to="/my-bookings"
                        className="inline-flex items-center gap-2 mt-6 text-blue-600 font-semibold hover:gap-3 transition-all"
                    >
                        <ChevronLeft size={20} />
                        Quay lại danh sách
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="max-w-6xl mx-auto px-6">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/my-bookings")}
                    className="flex items-center gap-2 text-gray-500 hover:text-blue-600 font-semibold mb-6 transition-colors group"
                >
                    <div className="p-2 bg-white rounded-full shadow-sm group-hover:bg-blue-50 transition-colors">
                        <ChevronLeft size={20} />
                    </div>
                    Quay lại danh sách
                </button>

                {/* Header */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chi tiết đơn đặt xe</h1>
                            <p className="text-gray-500">
                                Mã đơn: <span className="font-mono font-bold">{booking._id}</span>
                            </p>
                        </div>
                        {getStatusBadge(booking.status)}
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Main Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Vehicle Info */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin xe</h2>
                            <div className="flex gap-6">
                                <div className="w-48 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                    {(booking.vehicle?.image_url || booking.vehicle?.image_urls?.[0]) ? (
                                        <img
                                            src={booking.vehicle.image_url || booking.vehicle.image_urls[0]}
                                            alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Car className="text-gray-300" size={48} />
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {booking.vehicle?.brand} {booking.vehicle?.model}
                                    </h3>
                                    <p className="text-gray-500 mb-1">
                                        Biển số: <span className="font-bold">{booking.vehicle?.license_plate || "N/A"}</span>
                                    </p>
                                    <p className="text-gray-500">
                                        Loại xe: {booking.vehicle?.vehicle_type?.type_name || "N/A"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Booking Details */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Chi tiết đặt xe</h2>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <Calendar className="text-blue-500 mt-1 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500">Thời gian thuê</p>
                                        <p className="font-bold text-gray-900">
                                            {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-red-500 mt-1 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500">Điểm đón</p>
                                        <p className="font-bold text-gray-900">{booking.pickup_location}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="text-green-500 mt-1 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500">Điểm trả</p>
                                        <p className="font-bold text-gray-900">{booking.return_location}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Clock className="text-purple-500 mt-1 flex-shrink-0" size={20} />
                                    <div>
                                        <p className="text-sm text-gray-500">Loại thuê</p>
                                        <p className="font-bold text-gray-900">
                                            {booking.rental_type === "self_drive" ? "Tự lái" : "Có tài xế"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Driver Info (if with_driver) */}
                        {booking.driver && (
                            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                                <h2 className="text-xl font-bold text-gray-900 mb-6">Thông tin tài xế</h2>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                                        <User className="text-blue-600" size={32} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{booking.driver?.user?.full_name}</h3>
                                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <Phone size={14} />
                                                {booking.driver?.user?.phone}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Mail size={14} />
                                                {booking.driver?.user?.email}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column - Payment & Actions */}
                    <div className="space-y-6">
                        {/* Payment Summary */}
                        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sticky top-32">
                            <h2 className="text-xl font-bold text-gray-900 mb-6">Thanh toán</h2>
                            <div className="space-y-3 mb-6">
                                {(() => {
                                    // Tính số ngày thuê
                                    const startDate = new Date(booking.start_date);
                                    const endDate = new Date(booking.end_date);
                                    const diffTime = Math.abs(endDate - startDate);
                                    const rentalDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

                                    // Tính tiền xe
                                    const vehicleDailyRate = booking.vehicle?.daily_rate || 0;
                                    const vehicleTotal = rentalDays * vehicleDailyRate;

                                    // Tính tiền tài xế (nếu có)
                                    const DRIVER_FEE_PER_DAY = 500000;
                                    const driverTotal = booking.rental_type === "with_driver" ? rentalDays * DRIVER_FEE_PER_DAY : 0;

                                    return (
                                        <>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tiền xe ({rentalDays} ngày × {formatCurrency(vehicleDailyRate)})</span>
                                                <span className="font-semibold text-gray-900">{formatCurrency(vehicleTotal)}</span>
                                            </div>
                                            {driverTotal > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-gray-500">Tiền tài xế ({rentalDays} ngày × {formatCurrency(DRIVER_FEE_PER_DAY)})</span>
                                                    <span className="font-semibold text-gray-900">{formatCurrency(driverTotal)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                                                <span className="font-semibold text-gray-700">Tổng tiền</span>
                                                <span className="font-bold text-gray-900">{formatCurrency(booking.total_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-500">Tiền cọc (30% gốc)</span>
                                                <span className="font-bold text-orange-600">{formatCurrency(booking.deposit_amount)}</span>
                                            </div>
                                            <div className="flex justify-between text-sm pt-3 border-t border-gray-200">
                                                <span className="font-semibold text-gray-700">Còn lại</span>
                                                <span className="font-bold text-blue-600">
                                                    {formatCurrency(booking.total_amount - booking.deposit_amount)}
                                                </span>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>

                            {/* Payment Status */}
                            {booking.status === "confirmed" || booking.status === "in_progress" || booking.status === "vehicle_delivered" || booking.status === "vehicle_returned" || booking.status === "completed" ? (
                                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-4 py-3 rounded-xl mb-4">
                                    <CheckCircle size={20} />
                                    <span className="text-sm font-bold">Đã thanh toán cọc</span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-3 rounded-xl mb-4">
                                    <AlertCircle size={20} />
                                    <span className="text-sm font-bold">Chưa thanh toán cọc</span>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                {booking.status === "pending" && (
                                    <button
                                        onClick={() => navigate(`/payment/deposit/${booking._id}`)}
                                        className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CreditCard size={20} />
                                        Thanh toán cọc
                                    </button>
                                )}

                                {booking.status === "vehicle_returned" && (
                                    <button
                                        onClick={() => navigate(`/payment/final/${booking._id}`)}
                                        className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <CreditCard size={20} />
                                        Thanh toán còn lại
                                    </button>
                                )}

                                {(booking.status === "confirmed" || booking.status === "in_progress") && (
                                    <Link
                                        to={`/bookings/${booking._id}/extend`}
                                        className="w-full bg-purple-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Clock size={20} />
                                        Yêu cầu gia hạn
                                    </Link>
                                )}

                                {(booking.status === "pending" || booking.status === "confirmed") && (
                                    <button
                                        onClick={() => setShowCancelModal(true)}
                                        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-bold hover:bg-red-100 transition-all border border-red-200"
                                    >
                                        Hủy đơn
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cancel Confirmation Modal */}
                {showCancelModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="text-red-600" size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Xác nhận hủy đơn</h3>
                                <p className="text-gray-500">
                                    Bạn có chắc chắn muốn hủy đơn đặt xe này không?
                                    {(booking.status === "confirmed" || booking.status === "in_progress") && (
                                        <span className="block mt-2 text-green-600 font-semibold">
                                            Tiền cọc sẽ được hoàn lại.
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowCancelModal(false)}
                                    disabled={cancelling}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
                                >
                                    Quay lại
                                </button>
                                <button
                                    onClick={handleCancelBooking}
                                    disabled={cancelling}
                                    className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                                >
                                    {cancelling ? "Đang hủy..." : "Xác nhận hủy"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingDetail;
