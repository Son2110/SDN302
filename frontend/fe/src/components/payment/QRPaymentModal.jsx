import { useState, useEffect } from "react";
import { X, CheckCircle, Copy, AlertCircle, RefreshCw } from "lucide-react";

const QRPaymentModal = ({ isOpen, onClose, bookingId, amount, type = "deposit", paymentMethod = "bank_transfer", onSuccess }) => {
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [success, setSuccess] = useState(false);
    const [payerAccountNo, setPayerAccountNo] = useState("");

    // Receiving bank details
    const bankInfo = {
        bankId: "MB", // MB Bank
        accountNo: "0123456789",
        accountName: "CONG TY TNHH THUE XE",
        template: "compact2",
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
            setPayerAccountNo("");
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
                    transaction_id: payerAccountNo.trim()
                        ? `QR_${paymentDescription}_FROM_${payerAccountNo.trim()}`
                        : `QR_${paymentDescription}`,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Payment confirmation failed");
            }

            // Success state
            setSuccess(true);
            setConfirming(false);

            // Wait briefly so users can see the success notice.
            setTimeout(() => {
                if (onSuccess) {
                    onSuccess(data);
                }
                onClose();
            }, 2000);
        } catch (err) {
            setError(err.message || "An error occurred while confirming payment");
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
                        <h2 className="text-2xl font-bold text-gray-900">QR Code Payment</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Scan to pay {type === "deposit" ? "the deposit" : "the remaining balance"}
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
                    <div className="bg-[#EEF4FF] border-2 border-[#DCE8FF] rounded-2xl p-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">Amount to pay</p>
                        <p className="text-4xl font-bold text-[#1556F5]">{formatPrice(amount)} VND</p>
                        <p className="text-xs text-gray-500 mt-2">Booking code: {bookingId?.slice(-8).toUpperCase()}</p>
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
                                Use your banking app to scan this QR code
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="text-[#1556F5] text-sm font-semibold flex items-center gap-1 mx-auto hover:text-[#0F3FCC]"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Reload QR
                            </button>
                        </div>
                    </div>

                    {/* Bank Info Details */}
                    <div className="space-y-3">
                        <p className="text-sm font-bold text-gray-700 uppercase">
                            Or transfer manually:
                        </p>

                        {/* Bank Name */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Bank</p>
                                <p className="font-semibold text-gray-900">MB Bank</p>
                            </div>
                        </div>

                        {/* Account Number */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Account number</p>
                                <p className="font-mono font-bold text-lg text-gray-900">{bankInfo.accountNo}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(bankInfo.accountNo)}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                {copied ? (
                                    <CheckCircle className="w-5 h-5 text-[#1556F5]" />
                                ) : (
                                    <Copy className="w-5 h-5 text-gray-600" />
                                )}
                            </button>
                        </div>

                        {/* Account Name */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Account name</p>
                                <p className="font-semibold text-gray-900">{bankInfo.accountName}</p>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                            <div>
                                <p className="text-xs text-gray-500">Amount</p>
                                <p className="font-bold text-lg text-gray-900">{formatPrice(amount)} VND</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(amount.toString())}
                                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                <Copy className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>

                        {/* Transfer Note */}
                        <div className="flex justify-between items-center p-3 bg-[#EEF4FF] border border-[#DCE8FF] rounded-xl">
                            <div className="flex-1">
                                <p className="text-xs text-[#1556F5] font-bold mb-1">Transfer note</p>
                                <p className="font-mono text-sm text-gray-900">{paymentDescription}</p>
                            </div>
                            <button
                                onClick={() => copyToClipboard(paymentDescription)}
                                className="p-2 hover:bg-[#DCE8FF] rounded-lg transition-colors"
                            >
                                <Copy className="w-5 h-5 text-[#1556F5]" />
                            </button>
                        </div>

                        {/* Số tài khoản của bạn (người chuyển) */}
                        <div className="p-3 bg-white border-2 border-gray-200 rounded-xl">
                            <label className="block text-xs text-gray-500 font-bold mb-2">
                                Số tài khoản của bạn (người chuyển)
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="Nhập số tài khoản ngân hàng bạn dùng để chuyển"
                                value={payerAccountNo}
                                onChange={(e) => setPayerAccountNo(e.target.value.replace(/\D/g, "").slice(0, 20))}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-[#1556F5] focus:border-[#1556F5] outline-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">Tùy chọn — giúp đối soát nhanh hơn</p>
                        </div>
                    </div>

                    {/* Important Notice */}
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-red-800">
                                <p className="font-bold mb-1">Important notes:</p>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>Please enter the exact transfer note for automatic verification</li>
                                    <li>After transferring, click "Transferred" below</li>
                                    <li>Your booking will be confirmed after payment is verified</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Success Display */}
                    {success && (
                        <div className="p-4 bg-[#EEF4FF] border border-[#DCE8FF] rounded-xl">
                            <div className="flex gap-3">
                                <CheckCircle className="w-5 h-5 text-[#1556F5] flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-[#101828]">Payment confirmed successfully!</p>
                                    <p className="text-xs text-[#1556F5] mt-1">Redirecting to booking details...</p>
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
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirmPayment}
                            disabled={confirming || success}
                            className={`flex-1 py-4 rounded-2xl font-bold shadow-lg transition-all disabled:opacity-50 disabled:scale-100 ${success
                                ? 'bg-gradient-to-r from-[#1556F5] to-[#101828] shadow-blue-600/30'
                                : 'bg-gradient-to-r from-[#1556F5] to-[#101828] shadow-blue-600/30 hover:shadow-xl hover:scale-[1.02]'
                                } text-white`}
                        >
                            {success ? (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Success
                                </span>
                            ) : confirming ? (
                                <span className="flex items-center justify-center gap-2">
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                    Confirming...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <CheckCircle className="w-5 h-5" />
                                    Transferred
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
