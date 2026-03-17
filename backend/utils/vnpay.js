import crypto from "crypto";

const VNPAY_TMN_CODE = process.env.VNPAY_TMN_CODE || "";
const VNPAY_SECRET_KEY = process.env.VNPAY_SECRET_KEY || "";
const VNPAY_URL =
  process.env.VNPAY_URL ||
  "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

// Encode like VNPay: encodeURIComponent + replace %20 by +
function encodeVnp(str) {
  if (str == null) return "";
  return encodeURIComponent(String(str)).replace(/%20/g, "+");
}

// Keep only vnp_* keys, remove vnp_SecureHash / vnp_SecureHashType, sort by key
export function sortObject(obj) {
  const result = {};
  const keys = Object.keys(obj)
    .filter(
      (k) =>
        k.startsWith("vnp_") &&
        k !== "vnp_SecureHash" &&
        k !== "vnp_SecureHashType",
    )
    .sort();

  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && v !== "") {
      result[k] = String(v);
    }
  }
  return result;
}

// Build hash data string: key=value&key=value...
function buildHashData(sorted) {
  return Object.entries(sorted)
    .map(([k, v]) => `${encodeVnp(k)}=${encodeVnp(v)}`)
    .join("&");
}

// HMAC SHA512
function hmacSha512(secretKey, data) {
  return crypto.createHmac("sha512", secretKey).update(data, "utf8").digest("hex");
}

// Create full VNPay payment URL
export function createPaymentUrl(params) {
  const sorted = sortObject(params);
  const hashData = buildHashData(sorted);
  const secureHash = hmacSha512(VNPAY_SECRET_KEY, hashData);

  const query = [
    ...Object.entries(sorted).map(
      ([k, v]) => `${encodeVnp(k)}=${encodeVnp(v)}`,
    ),
    `vnp_SecureHash=${secureHash}`,
  ].join("&");

  return `${VNPAY_URL}?${query}`;
}

// Verify VNPay callback (ReturnURL/IPN)
export function verifyPaymentCallback(queryParams) {
  const vnpSecureHash = queryParams.vnp_SecureHash;
  if (!vnpSecureHash) return { valid: false };

  const sorted = sortObject(queryParams);
  const hashData = buildHashData(sorted);
  const computed = hmacSha512(VNPAY_SECRET_KEY, hashData);

  return {
    valid: computed === vnpSecureHash,
    secureHash: vnpSecureHash,
    sortedParams: sorted,
  };
}

// VN time yyyyMMddHHmmss
export function getCreateDate() {
  const d = new Date();
  const offset = 7 * 60;
  const local = new Date(d.getTime() + (offset + d.getTimezoneOffset()) * 60000);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const h = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");
  const s = String(local.getSeconds()).padStart(2, "0");
  return `${y}${m}${day}${h}${min}${s}`;
}

// Expire = now + 15 minutes (VN time)
export function getExpireDate() {
  const d = new Date(Date.now() + 15 * 60 * 1000);
  const offset = 7 * 60;
  const local = new Date(d.getTime() + (offset + d.getTimezoneOffset()) * 60000);
  const y = local.getFullYear();
  const m = String(local.getMonth() + 1).padStart(2, "0");
  const day = String(local.getDate()).padStart(2, "0");
  const h = String(local.getHours()).padStart(2, "0");
  const min = String(local.getMinutes()).padStart(2, "0");
  const s = String(local.getSeconds()).padStart(2, "0");
  return `${y}${m}${day}${h}${min}${s}`;
}

export function getConfig() {
  return {
    tmnCode: VNPAY_TMN_CODE,
    secretKey: VNPAY_SECRET_KEY,
    url: VNPAY_URL,
  };
}

