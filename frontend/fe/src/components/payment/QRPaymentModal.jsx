import { useState, useEffect } from "react";
import { X, CheckCircle, Copy, AlertCircle, RefreshCw } from "lucide-react";

const QRPaymentModal = ({ isOpen, onClose, bookingId, amount, type = "deposit", paymentMethod = "bank_transfer", onSuccess }) => {
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [success, setSuccess] = useState(false);

    // Thông tin ngân hàng nhận thanh toán
    const bankInfo = {
        bankId: "MB", // MB Bank
        accountNo: "0123456789",
        accountName: "CONG TY TNHH THUE XE",
        template: "compact2", // Gọn gàng hơn
    };

    // Generate description
    const paymentDescription = `${type === "deposit" ? "DEPOSIT" : "FINAL"} ${bookingId?.slice(-8).toUpperCase()}`;

    // Generate VietQR URL
    const qrCodeUrl = `https://img.vietqr.io/image/${bankInfo.bankId}-${bankInfo.accountNo}-${bankInfo.template}.png?amount=${amount}&addInfo=${encodeURIComponent(paymentDescription)}&accountName=${encodeURIComponent(bankInfo.accountName)}`;

    const formatPrice = (price) => {
        return new Intl.NumberFormat("vi-VN").format(price);
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Reset states when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setError(null);
            setSuccess(false);
            setConfirming(false);
        }
    }, [isOpen]);

    const handleConfirmPayment = async () => {
        setConfirming(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            const endpoint = type === "deposit" ? "/payments/deposit" : "/payments/final";

            const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    booking_id: bookingId,
                    payment_method: paymentMethod,
                    transaction_id: `QR_${paymentDescription}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Xác nhận thanh toán thất bại");
            }

            // Success - Hiển thị thông báo thành công
            setSuccess(true);
            setConfirming(false);

            // Đợi 2 giây để user thấy thông báo, sau đó đóng modal và redirect
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(data);
                }
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || "Có lỗi xảy ra khi xác nhận thanh toán");
            setConfirming(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex items-center justify-between rounded-t-3xl">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Thanh toán QR Code</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Quét mã để thanh toán {type === "deposit" ? "tiền cọc" : "số dư còn lại"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={confirming}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Amount Display */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Số tiền cần thanh toán</p>
                        <p className="text-4xl font-bold text-blue-600">{formatPrice(amount)}đ</p>
                        <p className="text-xs text-gray-500 mt-2">Mã đơn: {bookingId?.slice(-8).toUpperCase()}</p>
                    </div>

                    {/* QR Code */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                        <div className="bg-white rounded-xl p-4 shadow-lg">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code Payment"
                                className="w-full h-auto"
                                onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/400x400?text=QR+Code+Error";
                                }}
                            />
                        </div>
                        <div className="text-center mt-4">
                            <p className="text-sm text-gray-600 mb-2">
                                Sử dụng app ngân hàng quét mã QR để thanh toán
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-blue-600 text-sm font-semibold flex items-center gap-1 mx-auto hover:text-blue-700"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tải lại mã QR
                            </button>
                        </div>
                    </div>

                    {/* Bank Info Details */}
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-700 uppercase">
                            Hoặc chuyển khoản thủ công:
                        </p>

                        {/* Bank Name */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Ngân hàng</p>
                                <p className="font-semibold text-gray-900">MB Bank (Quân đội)</p>
                            </div>
                        </div>

                        {/* Account Number */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Số tài khoản</p>
                                <p className="font-mono font-bold text-lg text-gray-900">{bankInfo.accountNo}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(bankInfo.accountNo)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {copied ? (
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>

                        {/* Account Name */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Chủ tài khoản</p>
                                <p className="font-semibold text-gray-900">{bankInfo.accountName}</p>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Số tiền</p>
                                <p className="font-bold text-lg text-gray-900">{formatPrice(amount)}đ</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(amount.toString())}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <Copy className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Transfer Note */}
                        <div className="flex justify-between items-center p-3 bg-amber-50 border border-amber-200 rounded-xl">
                            <div className="flex-1">
                                <p className="text-xs text-amber-700 font-bold mb-1">Nội dung chuyển khoản</p>
                                <p className="font-mono text-sm text-gray-900">{paymentDescription}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(paymentDescription)}
                                className="p-2 hover:bg-amber-100 rounded-lg transition-colors"
                            >
                                <Copy className="w-5 h-5 text-amber-700" />
                            </button>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-yellow-800">
                                <p className="font-bold mb-1">Lưu ý quan trọng:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Vui lòng nhập ĐÚNG nội dung chuyển khoản để hệ thống tự động xác nhận</li>
                                    <li>Sau khi chuyển khoản, nhấn "Đã chuyển khoản" bên dưới</li>
                                    <li>Đơn hàng sẽ được xác nhận sau khi kiểm tra thanh toán</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Success Display */}
                    {success && (
                        <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-green-700">Xác nhận thanh toán thành công!</p>
                                    <p className="text-xs text-green-600 mt-1">Đang chuyển đến trang chi tiết đơn hàng...</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                            <div className="flex gap-3">
                                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={confirming || success}
                            className="flex-1 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleConfirmPayment}
                            disabled={confirming || success}
                            className={`flex-1 py-4 rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:scale-100 ${success
                                ? 'bg-gradient-to-r from-green-600 to-emerald-600 shadow-green-600/30'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02]'
                                } text-white`}
                        >
                            {success ? (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Thành công
                                </span>
                            ) : confirming ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Đang xác nhận...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Đã chuyển khoản
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QRPaymentModal;
