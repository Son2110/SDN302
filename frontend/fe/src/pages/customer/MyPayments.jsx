import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Receipt, CreditCard } from "lucide-react";
import { getToken } from "../../services/api";
import { formatCurrency, formatDate } from "../../utils/formatters";

const API_URL = import.meta.env.VITE_API_URL;

const TYPE_LABELS = {
  deposit: "Deposit",
  rental_fee: "Rental fee",
  extension_fee: "Extension fee",
  penalty: "Fine",
  refund: "Refund",
};

const TYPE_COLORS = {
  deposit: "bg-blue-50 text-blue-700 border-blue-200",
  rental_fee: "bg-blue-50 text-blue-700 border-blue-200",
  extension_fee: "bg-blue-50 text-blue-700 border-blue-200",
  penalty: "bg-red-50 text-red-700 border-red-200",
  refund: "bg-blue-50 text-blue-700 border-blue-200",
};

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  completed: {
    label: "Success",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
  failed: { label: "Failed", color: "bg-red-50 text-red-700 border-red-200" },
  refunded: {
    label: "Refunded",
    color: "bg-blue-50 text-blue-700 border-blue-200",
  },
};

const METHOD_LABELS = {
  cash: "Cash",
  card: "Card",
  momo: "MoMo",
  zalopay: "ZaloPay",
  vnpay: "VNPay",
  bank_transfer: "Bank transfer",
};

const MyPayments = () => {
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      navigate("/login");
      return;
    }
    fetchPayments();
  }, [page, typeFilter, statusFilter]);

  const fetchPayments = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ page, limit: 10 });
      if (typeFilter) params.append("payment_type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`${API_URL}/payments/my-payments?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Unable to load payment history");
      setPayments(data.data || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-20">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Payment history
          </h1>
          <p className="text-gray-500 mt-2">
            Review all your payment transactions
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6 flex flex-wrap gap-3 items-center">
          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All transaction types</option>
            <option value="deposit">Deposit</option>
            <option value="rental_fee">Rental fee</option>
            <option value="extension_fee">Extension fee</option>
            <option value="penalty">Fine</option>
            <option value="refund">Refund</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Success</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>

          {(typeFilter || statusFilter) && (
            <button
              onClick={() => {
                setTypeFilter("");
                setStatusFilter("");
                setPage(1);
              }}
              className="text-sm text-blue-600 font-medium hover:underline"
            >
              Clear filters
            </button>
          )}
          <span className="ml-auto text-sm text-gray-500 font-medium">
            {total} transactions
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl mb-6">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex justify-center items-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
          </div>
        ) : payments.length === 0 ? (
          /* Empty State */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <Receipt className="mx-auto mb-4 text-gray-300" size={64} />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No transactions yet
            </h3>
            <p className="text-gray-500 mb-6">
              {typeFilter || statusFilter
                ? "No transactions matched your filters"
                : "Payment transactions will appear here after you book a ride"}
            </p>
            <Link
              to="/my-bookings"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              View bookings
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {payments.map((p) => {
                const status = STATUS_CONFIG[p.status] || {
                  label: p.status,
                  color: "bg-gray-50 text-gray-700 border-gray-200",
                };
                const typeColor =
                  TYPE_COLORS[p.payment_type] ||
                  "bg-gray-50 text-gray-700 border-gray-200";
                return (
                  <div
                    key={p._id}
                    className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-gray-200 transition-colors"
                  >
                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${typeColor}`}
                        >
                          {TYPE_LABELS[p.payment_type] || p.payment_type}
                        </span>
                        <span
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${status.color}`}
                        >
                          {status.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        Booking #{p.booking?._id?.slice(-6).toUpperCase()}
                        {p.booking?.vehicle
                          ? ` • ${p.booking.vehicle.brand} ${p.booking.vehicle.model} (${p.booking.vehicle.license_plate})`
                          : ""}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDate(p.payment_date, true)}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="flex items-center gap-6 flex-shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(p.amount)}
                        </div>
                        <div className="text-xs text-gray-400 uppercase font-medium mt-0.5">
                          {METHOD_LABELS[p.payment_method] || p.payment_method}
                        </div>
                      </div>
                      {p.booking?._id && (
                        <Link
                          to={`/bookings/${p.booking._id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-semibold underline underline-offset-2 whitespace-nowrap"
                        >
                          View booking
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-3 mt-8">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 bg-white"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-600 font-medium px-2">
                  Page {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-40 bg-white"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyPayments;
