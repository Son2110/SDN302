export const formatDate = (dateString, includeTime = false) => {
  if (!dateString) return "";
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  };
  if (includeTime) {
    options.hour = "2-digit";
    options.minute = "2-digit";
  }
  return new Intl.DateTimeFormat("vi-VN", options).format(new Date(dateString));
};

export const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
};
