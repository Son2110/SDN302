import crypto from "crypto";

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNPAY_SECRET_KEY = process.env.VNPAY_SECRET_KEY || "";
const VNPAY_URL = process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

/**
 * Encode theo chuẩn VNPay: encodeURIComponent rồi thay %20 thành +
 * (để khớp logic checksum của VNPay)
 */
function encodeVnpay(str) {
  if (str == null || str === "") return "";
  return encodeURIComponent(String(str)).replace(/%20/g, "+");
}

/**
 * Sắp xếp object theo key (alphabetical) và tạo chuỗi hash data
 * Chỉ lấy các key bắt đầu bằng vnp_, bỏ qua vnp_SecureHash và vnp_SecureHashType.
 * Dùng encodeVnpay cho cả Key và Value.
 */
export function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj).filter(
    (k) => k.startsWith("vnp_") && k !== "vnp_SecureHash" && k !== "vnp_SecureHashType"
  );
  keys.sort();
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") sorted[k] = String(v);
  }
  return sorted;
}

/**
 * Tạo chuỗi hash data từ object đã sort (key=value&key=value...)
 * Encoding: encodeURIComponent rồi thay %20 -> +
 */
function buildHashData(sortedObj) {
  const parts = [];
  for (const [k, v] of Object.entries(sortedObj)) {
    parts.push(encodeVnpay(k) + "=" + encodeVnpay(v));
  }
  return parts.join("&");
}

/**
 * Tạo HMAC SHA512 và trả về hex
 */
function hmacSha512(secretKey, data) {
  return crypto.createHmac("sha512", secretKey).update(data, "utf8").digest("hex");
}

/**
 * Tạo URL thanh toán VNPay
 * @param {Object} params - Các tham số vnp_* (không gồm vnp_SecureHash)
 * @returns {string} URL đầy đủ (base + query + vnp_SecureHash)
 */
export function createPaymentUrl(params) {
  const sorted = sortObject(params);
  const hashData = buildHashData(sorted);
  const secureHash = hmacSha512(VNPAY_SECRET_KEY, hashData);

  const queryParts = [];
  for (const [k, v] of Object.entries(sorted)) {
    queryParts.push(encodeVnpay(k) + "=" + encodeVnpay(v));
  }
  queryParts.push("vnp_SecureHash=" + secureHash);
  const queryString = queryParts.join("&");
  return VNPAY_URL + "?" + queryString;
}

/**
 * Xác thực callback từ VNPay (ReturnUrl hoặc IPN)
 * @param {Object} queryParams - Object chứa toàn bộ query (req.query)
 * @returns {{ valid: boolean, secureHash?: string, sortedParams?: object }}
 */
export function verifyPaymentCallback(queryParams) {
  const vnpSecureHash = queryParams.vnp_SecureHash;
  if (!vnpSecureHash) return { valid: false };

  const sorted = sortObject(queryParams);
  const hashData = buildHashData(sorted);
  const computedHash = hmacSha512(VNPAY_SECRET_KEY, hashData);

  const valid = computedHash === vnpSecureHash;
  return { valid, secureHash: vnpSecureHash, sortedParams: sorted };
}

/**
 * Thời gian GMT+7 định dạng yyyyMMddHHmmss (VNPay yêu cầu)
 */
export function getCreateDate() {
  const d = new Date();
  const offset = 7 * 60; // GMT+7
  const local = new Date(d.getTime() + (offset + d.getTimezoneOffset()) * 60 * 1000);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const h = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");
  const s = String(local.getSeconds()).padStart(2, "0");
  return `${y}${m}${day}${h}${min}${s}`;
}

/**
 * ExpireDate = CreateDate + 15 phút (VNPay khuyến nghị)
 */
export function getExpireDate() {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  const offset = 7 * 60;
  const local = new Date(d.getTime() + (offset + d.getTimezoneOffset()) * 60 * 1000);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const h = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");
  const s = String(local.getSeconds()).padStart(2, "0");
  return `${y}${m}${day}${h}${min}${s}`;
}

/**
 * Lấy config (để controller dùng return URL, locale, ...)
 */
export function getConfig() {
  return {
    tmnCode: VNPAY_TMN_CODE,
    secretKey: VNPAY_SECRET_KEY,
    url: VNPAY_URL,
  };
}
