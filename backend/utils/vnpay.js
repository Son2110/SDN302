import crypto from "crypto";
import qs from "qs"; // Dùng qs package giống VNPay demo, không dùng querystring built-in
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Load .env file từ thư mục backend
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

/**
 * VNPay Helper Functions
 * Tích hợp VNPay Payment Gateway
 * Implementation giống Java code để đảm bảo tương thích
 */

/**
 * Sort object theo VNPay demo code (giống hàm sortObject trong order.js)
 * VNPay demo code encode keys và values khi sort
 */
const sortObject = (obj) => {
  const sorted = {};
  const keys = [];
  
  // Collect và encode keys
  for (const key in obj) {
    if (obj.hasOwnProperty(key) && obj[key] !== null && obj[key] !== undefined && obj[key] !== "") {
      keys.push(encodeURIComponent(key));
    }
  }
  
  // Sort keys
  keys.sort();
  
  // Build sorted object với encoded keys và values
  for (let i = 0; i < keys.length; i++) {
    const originalKey = decodeURIComponent(keys[i]);
    const value = String(obj[originalKey]);
    // Encode value và replace %20 với + (giống VNPay demo)
    sorted[keys[i]] = encodeURIComponent(value).replace(/%20/g, "+");
  }
  
  return sorted;
};

/**
 * Build query string từ params (giống VNPay demo code)
 * VNPay demo: querystring.stringify(vnp_Params, { encode: false })
 * Lưu ý: params đã được sortObject() rồi (đã encode keys và values)
 */
const buildQueryString = (params) => {
  // Build query string (giống VNPay demo: qs.stringify với encode: false)
  // VNPay demo dùng 'qs' package, không phải querystring built-in
  // Lưu ý: params đã được sortObject() rồi, nên keys và values đã được encode
  return qs.stringify(params, { encode: false });
};

// VNPay Configuration (CHỈ lấy từ .env - KHÔNG hardcode credentials)
const VNPAY_CONFIG = {
  tmnCode: process.env.VNPAY_TMN_CODE,
  secretKey: process.env.VNPAY_SECRET_KEY,
  url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
  returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:5173/payments/success",
  ipnUrl: process.env.VNPAY_IPN_URL || "http://localhost:5000/api/payments/webhook/vnpay",
};

// Validate VNPay configuration
export const validateVNPayConfig = () => {
  if (!VNPAY_CONFIG.tmnCode || VNPAY_CONFIG.tmnCode.trim() === "") {
    throw new Error(
      `VNPAY_TMN_CODE chưa được cấu hình. Vui lòng thêm vào file backend/.env\n` +
      `Current value: ${VNPAY_CONFIG.tmnCode || "undefined"}`
    );
  }
  if (!VNPAY_CONFIG.secretKey || VNPAY_CONFIG.secretKey.trim() === "") {
    throw new Error(
      `VNPAY_SECRET_KEY chưa được cấu hình. Vui lòng thêm vào file backend/.env\n` +
      `Current value: ${VNPAY_CONFIG.secretKey ? "***" : "undefined"}`
    );
  }
  return true;
};

/**
 * Tạo payment URL cho VNPay
 * @param {Object} params - Payment parameters
 * @returns {string} Payment URL
 */
export const createPaymentUrl = (params) => {
  // Validate config before creating URL
  validateVNPayConfig();
  const {
    amount,
    orderId,
    orderInfo,
    orderType = "other",
    bankCode = "",
    language = "vn",
    returnUrl = VNPAY_CONFIG.returnUrl,
    ipnUrl = VNPAY_CONFIG.ipnUrl,
  } = params;

  // Format date giống Java: yyyyMMddHHmmss
  // Java: LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  const createDate = `${year}${month}${day}${hours}${minutes}${seconds}`;

  // VNPay parameters (giống Java code - đúng thứ tự)
  const vnpParams = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_CONFIG.tmnCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: orderType,
    vnp_Amount: String(amount * 100), // VNPay expects amount in cents, convert to string
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: (params.ipAddr && params.ipAddr !== "::1") ? params.ipAddr : "127.0.0.1", // Giống Java code, không dùng IPv6
    vnp_CreateDate: createDate,
    vnp_CurrCode: "VND",
    vnp_Locale: language,
  };

  // Java code không có ExpireDate và BankCode, nhưng có thể thêm nếu cần
  // if (expireDate) {
  //   vnpParams.vnp_ExpireDate = expireDate;
  // }
  // if (bankCode) {
  //   vnpParams.vnp_BankCode = bankCode;
  // }

  // Sort parameters theo VNPay demo code (giống hàm sortObject)
  // VNPay demo: vnp_Params = sortObject(vnp_Params);
  const sortedParams = sortObject(vnpParams);

  // Build query string để sign (giống VNPay demo code)
  // VNPay demo: signData = querystring.stringify(vnp_Params, { encode: false });
  const hashData = buildQueryString(sortedParams);
  
  // Create secure hash với SHA512 (giống VNPay demo code)
  // VNPay demo: hmac.update(new Buffer(signData, 'utf-8')).digest("hex")
  const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.secretKey);
  // Dùng Buffer.from() thay vì new Buffer() (deprecated)
  const secureHash = hmac.update(Buffer.from(hashData, 'utf-8')).digest("hex");
  
  // Build final URL (giống VNPay demo code)
  // VNPay demo: vnp_Params['vnp_SecureHash'] = signed;
  //            vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });
  sortedParams['vnp_SecureHash'] = secureHash;
  const finalQueryString = buildQueryString(sortedParams);
  const paymentUrl = `${VNPAY_CONFIG.url}?${finalQueryString}`;

  return paymentUrl;
};

/**
 * Verify VNPay callback signature
 * @param {Object} params - VNPay callback parameters
 * @returns {boolean} True if signature is valid
 */
export const verifyPaymentCallback = (params) => {
  const secureHash = params.vnp_SecureHash;
  delete params.vnp_SecureHash;
  delete params.vnp_SecureHashType;

  // Sort parameters theo VNPay demo code (giống hàm sortObject)
  // VNPay demo: vnp_Params = sortObject(vnp_Params);
  const sortedParams = sortObject(params);

  // Create query string (giống VNPay demo: qs.stringify với encode: false)
  // VNPay demo: signData = querystring.stringify(vnp_Params, { encode: false });
  const signData = buildQueryString(sortedParams);

  // Create secure hash (giống VNPay demo code)
  // VNPay demo: hmac.update(new Buffer(signData, 'utf-8')).digest("hex")
  const hmac = crypto.createHmac("sha512", VNPAY_CONFIG.secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

  return secureHash === signed;
};

/**
 * Parse VNPay response
 * @param {Object} params - VNPay callback parameters
 * @returns {Object} Parsed response
 */
export const parsePaymentResponse = (params) => {
  const responseCode = params.vnp_ResponseCode;
  const transactionStatus = params.vnp_TransactionStatus;
  const amount = params.vnp_Amount ? parseInt(params.vnp_Amount) / 100 : 0;
  const transactionId = params.vnp_TransactionNo;
  const bankCode = params.vnp_BankCode;
  const orderId = params.vnp_TxnRef;
  const payDate = params.vnp_PayDate;

  // Response code mapping
  const responseCodeMap = {
    "00": "Giao dịch thành công",
    "07": "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
    "09": "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking",
    "10": "Xác thực thông tin thẻ/tài khoản không đúng quá 3 lần",
    "11": "Đã hết hạn chờ thanh toán. Xin vui lòng thực hiện lại giao dịch.",
    "12": "Thẻ/Tài khoản bị khóa",
    "13": "Nhập sai mật khẩu xác thực giao dịch (OTP). Xin vui lòng thực hiện lại giao dịch.",
    "51": "Tài khoản không đủ số dư để thực hiện giao dịch",
    "65": "Tài khoản đã vượt quá hạn mức giao dịch trong ngày",
    "75": "Ngân hàng thanh toán đang bảo trì",
    "79": "Nhập sai mật khẩu thanh toán quá số lần quy định",
    "99": "Lỗi không xác định",
  };

  const isSuccess = responseCode === "00" && transactionStatus === "00";
  const message = responseCodeMap[responseCode] || "Lỗi không xác định";

  return {
    success: isSuccess,
    responseCode,
    transactionStatus,
    amount,
    transactionId,
    bankCode,
    orderId,
    payDate,
    message,
  };
};
