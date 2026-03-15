import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, DollarSign, Clock, Car, ChevronRight } from "lucide-react";
import { getMyBookings } from "../../services/bookingApi";
import { getToken } from "../../services/api";

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [activeTab, setActiveTab] = useState("all");
    const [pagination, setPagination] = useState({
        page: 1,
        totalPages: 1,
        total: 0,
    });

    const tabs = [
        { key: "all", label: "Tất cả", count: 0 },
        { key: "pending", label: "Chờ xác nhận", count: 0 },
        { key: "confirmed", label: "Đã xác nhận", count: 0 },
        { key: "in_progress", label: "Đang thuê", count: 0 },
        { key: "completed", label: "Hoàn thành", count: 0 },
        { key: "cancelled", label: "Đã hủy", count: 0 },
    ];

    useEffect(() => {
        const token = getToken();
        if (!token) {
            navigate("/login");
            return;
        }
        fetchBookings();
    }, [activeTab, pagination.page]);

    const fetchBookings = async () => {
        setLoading(true);
        setError("");
        try {
            const params = {
                page: pagination.page,
                limit: 10,
            };
            if (activeTab !== "all") {
                params.status = activeTab;
            }

            const response = await getMyBookings(params);
            setBookings(response.data || []);
            setPagination({
                page: response.page || 1,
                totalPages: response.totalPages || 1,
                total: response.total || 0,
            });
        } catch (err) {
            setError(err.message || "Không thể tải danh sách đơn đặt xe");
        } finally {
            setLoading(false);
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
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND",
        }).format(amount);
    };

    return (
        <div className="min-h-screen bg-gray-50 pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900">Đơn đặt xe của tôi</h1>
                    <p className="text-gray-500 mt-2">Quản lý và theo dõi tất cả các đơn thuê xe của bạn</p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-2 mb-6">
                    <div className="flex gap-2 overflow-x-auto">
                        {tabs.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => {
                                    setActiveTab(tab.key);
                                    setPagination({ ...pagination, page: 1 });
                                }}
                                className={`px-6 py-3 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeTab === tab.key
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl mb-6">
                        {error}
                    </div>
                )}

                {/* Loading State */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : bookings.length === 0 ? (
                    // Empty State
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                        <Car className="mx-auto mb-4 text-gray-300" size={64} />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Chưa có đơn đặt xe</h3>
                        <p className="text-gray-500 mb-6">Bắt đầu khám phá và thuê xe điện ngay hôm nay!</p>
                        <Link
                            to="/fleet"
                            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
                        >
                            Xem danh sách xe
                        </Link>
                    </div>
                ) : (
                    // Bookings List
                    <div className="space-y-4">
                        {bookings.map((booking) => (
                            <Link
                                key={booking._id}
                                to={`/bookings/${booking._id}`}
                                className="block bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg hover:border-blue-200 transition-all group"
                            >
                                <div className="flex items-start gap-6">
                                    {/* Vehicle Image */}
                                    <div className="w-48 h-32 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0">
                                        {(booking.vehicle?.image_url || booking.vehicle?.image_urls?.[0]) ? (
                                            <img
                                                src={booking.vehicle.image_url || booking.vehicle.image_urls[0]}
                                                alt={`${booking.vehicle.brand} ${booking.vehicle.model}`}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <Car className="text-gray-300" size={48} />
                                            </div>
                                        )}
                                    </div>

                                    {/* Booking Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {booking.vehicle?.brand} {booking.vehicle?.model}
                                                </h3>
                                                <p className="text-sm text-gray-500">
                                                    Mã đơn: <span className="font-mono font-semibold">{booking._id?.slice(-8)}</span>
                                                </p>
                                            </div>
                                            {getStatusBadge(booking.status)}
                                        </div>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={16} className="text-blue-500" />
                                                <span>
                                                    {formatDate(booking.start_date)} - {formatDate(booking.end_date)}
                                                </span>
                                            </div>
                                            <div className="flex items-start gap-2 text-sm text-gray-600">
                                                <DollarSign size={16} className="text-green-500 mt-0.5" />
                                                <div>
                                                    <span className="font-bold text-gray-900 block">{formatCurrency(booking.total_amount)}</span>
                                                    {booking.rental_type === "with_driver" && (
                                                        <span className="text-xs text-gray-500">(Bao gồm tài xế)</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <MapPin size={16} className="text-red-500" />
                                                <span className="truncate">{booking.pickup_location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Clock size={16} className="text-gray-400" />
                                                <span>
                                                    {booking.rental_type === "self_drive" ? "Tự lái" : "Có tài xế"}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Action Buttons Based on Status */}
                                        <div className="flex gap-3">
                                            {booking.status === "pending" && (
                                                <button className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-all">
                                                    Thanh toán cọc
                                                </button>
                                            )}
                                            {booking.status === "confirmed" && (
                                                <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-bold rounded-lg hover:bg-gray-200 transition-all">
                                                    Xem chi tiết
                                                </button>
                                            )}
                                            {booking.status === "vehicle_returned" && (
                                                <button className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-all">
                                                    Thanh toán còn lại
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Arrow Icon */}
                                    <ChevronRight className="text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {/* Pagination */}
                {!loading && pagination.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 mt-8">
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                            disabled={pagination.page === 1}
                            className="px-4 py-2 rounded-lg font-bold bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-600 transition-all"
                        >
                            Trước
                        </button>
                        <span className="px-4 py-2 text-sm text-gray-600">
                            Trang {pagination.page} / {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                            disabled={pagination.page === pagination.totalPages}
                            className="px-4 py-2 rounded-lg font-bold bg-white border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-600 transition-all"
                        >
                            Tiếp
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyBookings;
