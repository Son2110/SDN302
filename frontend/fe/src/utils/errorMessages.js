const MESSAGE_MAP = [
  ["sai email hoac mat khau", "Incorrect email or password."],
  ["email nay da duoc su dung", "This email is already in use."],
  [
    "phien dang nhap khong hop le",
    "Your session is invalid. Please sign in again.",
  ],
  ["vui long dang nhap de tiep tuc", "Please sign in to continue."],
  ["nguoi dung khong ton tai", "User not found."],
  [
    "chi khach hang moi co the thanh toan",
    "Only customers can make this payment.",
  ],
  ["phuong thuc thanh toan khong hop le", "Invalid payment method."],
  ["khong tim thay don dat xe", "Booking not found."],
  ["khong tim thay", "Resource not found."],
  ["ban khong co quyen", "You do not have permission to perform this action."],
  [
    "chi khach hang moi co the yeu cau gia han",
    "Only customers can request an extension.",
  ],
  [
    "ngay gia han phai lon hon ngay tra xe hien tai",
    "The new end date must be later than the current end date.",
  ],
  [
    "yeu cau gia han bi tu choi",
    "Extension request was rejected due to a scheduling conflict.",
  ],
  ["khong the gui danh gia", "Unable to submit review."],
  ["khong the lay danh gia", "Unable to load reviews."],
  ["khong the sua danh gia", "Unable to update review."],
  ["khong tim thay xe", "Vehicle not found."],
  [
    "khong the xoa xe dang duoc thue",
    "Cannot delete a vehicle that is currently rented.",
  ],
  [
    "khong the xoa xe vi con don dat xe dang hoat dong",
    "Cannot delete this vehicle because it has an active booking.",
  ],
  [
    "khong the chuyen xe sang bao tri khi con don dat xe dang hoat dong",
    "Cannot set this vehicle to maintenance because it has an active booking.",
  ],
  [
    "status khong hop le",
    "Invalid status. Only available or maintenance can be set manually.",
  ],
  ["otp", "Invalid or expired OTP."],
];

const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim();

export const toEnglishError = (
  message,
  fallback = "Request failed. Please try again.",
) => {
  if (!message || typeof message !== "string") return fallback;

  const normalizedMessage = normalize(message);

  for (const [pattern, translated] of MESSAGE_MAP) {
    if (normalizedMessage.includes(pattern)) {
      return translated;
    }
  }

  const hasVietnameseChars = /[à-ỹđ]/i.test(message);
  return hasVietnameseChars ? fallback : message;
};
