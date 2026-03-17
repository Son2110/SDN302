import { useState, useEffect } from "react";
import { getPaymentsList, getPaymentDetailInfo } from "../../services/paymentApiStaff";
import PaymentTable from "../../components/staff/PaymentTable";
import PaymentDetailModal from "../../components/staff/PaymentDetailModal";
import { Loader2 } from "lucide-react";

export default function StaffPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal State
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await getPaymentsList({ page, limit: 10, payment_type: typeFilter, status: statusFilter });
      setPayments(res.data || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [page, typeFilter, statusFilter]);

  const handlePageChange = (newPage) => setPage(newPage);

  const viewDetail = async (payment) => {
    setSelectedPaymentId(payment._id);
    setDetailData(null);
    try {
      setDetailLoading(true);
      const res = await getPaymentDetailInfo(payment._id);
      setDetailData(res.data);
    } catch (err) {
      alert("Cannot load details: " + err.message);
      setSelectedPaymentId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedPaymentId(null);
    setDetailData(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-500 text-sm mt-1">Track all transactions and cash flow</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow font-medium"
          >
            <option value="">All Transaction Types</option>
            <option value="deposit">Deposit</option>
            <option value="rental_fee">Rental Fee</option>
            <option value="extension_fee">Extension Fee</option>
            <option value="penalty">Penalty</option>
            <option value="refund">Refund</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow font-medium"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>
      ) : loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <PaymentTable payments={payments} onView={viewDetail} />

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button disabled={page === 1} onClick={() => handlePageChange(page - 1)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white">Previous</button>
              <span className="text-sm text-gray-600 font-medium px-4">Page {page} / {totalPages}</span>
              <button disabled={page === totalPages} onClick={() => handlePageChange(page + 1)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white">Next</button>
            </div>
          )}
        </>
      )}

      {selectedPaymentId && (
        detailLoading ? (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
             <div className="bg-white p-6 rounded-xl flex items-center space-x-3"><Loader2 className="animate-spin text-blue-600" /> <span>Loading information...</span></div>
           </div>
        ) : (
          <PaymentDetailModal payment={detailData} onClose={closeDetail} />
        )
      )}
    </div>
  );
}
