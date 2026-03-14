import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getHandovers } from "../../services/handoverApi";
import HandoverTable from "../../components/staff/HandoverTable";
import { Loader2, ArrowRightLeft, KeyRound } from "lucide-react";

export default function StaffHandovers() {
  const [handovers, setHandovers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  const fetchHandovers = async () => {
    try {
      setLoading(true);
      const res = await getHandovers({ page, limit: 10, handover_type: typeFilter });
      setHandovers(res.data || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandovers();
  }, [page, typeFilter]);

  const handleFilterChange = (e) => {
    setTypeFilter(e.target.value);
    setPage(1); // Reset page on filter change
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Biên bản Bàn giao & Thu hồi</h1>
          <p className="text-gray-500 text-sm mt-1">Ghi nhận tình trạng xe khi giao hoặc trả</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={typeFilter}
            onChange={handleFilterChange}
            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow font-medium"
          >
            <option value="">Tất cả loại biên bản</option>
            <option value="delivery">Giao xe (Delivery)</option>
            <option value="return">Trả xe (Return)</option>
          </select>

          <Link
            to="/staff/handovers/delivery"
            className="flex items-center bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <KeyRound className="w-5 h-5 mr-1.5" /> Biên bản Giao xe
          </Link>
          <Link
            to="/staff/handovers/return"
            className="flex items-center bg-green-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-green-700 transition shadow-sm"
          >
            <ArrowRightLeft className="w-5 h-5 mr-1.5" /> Biên bản Thu xe
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <HandoverTable handovers={handovers} />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600 font-medium px-4">
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
