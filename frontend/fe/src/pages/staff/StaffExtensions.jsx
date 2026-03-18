import { useState, useEffect } from "react";
import { getExtensions, approveExtension, rejectExtension } from "../../services/extensionApi";
import ExtensionTable from "../../components/staff/ExtensionTable";
import { Loader2, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";

export default function StaffExtensions() {
  const [extensions, setExtensions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filter
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("pending");

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectId, setRejectId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Approval Confirm Modal State
  const [confirmApproveModal, setConfirmApproveModal] = useState({
    isOpen: false,
    id: null
  });

  const fetchExtensions = async () => {
    try {
      setLoading(true);
      const res = await getExtensions({ page, limit: 10, status: statusFilter });
      setExtensions(res.data || []);
      setTotalPages(res.totalPages || Math.ceil((res.total || 0) / 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExtensions();
  }, [page, statusFilter]);

  const handleFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  const handleApprove = (id) => {
    setConfirmApproveModal({ isOpen: true, id });
  };

  const confirmApprove = async () => {
    const id = confirmApproveModal.id;
    setConfirmApproveModal({ ...confirmApproveModal, isOpen: false });
    try {
      setProcessing(true);
      await approveExtension(id);
      toast.success("Extension approved successfully");
      fetchExtensions();
    } catch (err) {
      toast.error("Error approving: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const openRejectModal = (ext) => {
    setRejectId(ext._id);
    setRejectReason("");
    setIsRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      await rejectExtension(rejectId, rejectReason);
      toast.success("Extension rejected");
      setIsRejectModalOpen(false);
      fetchExtensions();
    } catch (err) {
      toast.error("Error rejecting: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Extension Requests</h1>
          <p className="text-gray-500 text-sm mt-1">Approve or reject vehicle extension requests</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={handleFilterChange}
            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow font-medium"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>}

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <>
          <ExtensionTable extensions={extensions} onApprove={handleApprove} onReject={openRejectModal} />

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600 font-medium px-4">Page {page} / {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">Reject Extension</h3>
              <button onClick={() => setIsRejectModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason (Optional)</label>
                <textarea
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g. Vehicle is already booked for this period..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsRejectModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition flex items-center disabled:opacity-50"
                >
                  {processing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Reject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approval Confirm Modal */}
      {confirmApproveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-scaleIn">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Approve Extension</h3>
              <p className="text-sm text-gray-500">
                Are you sure you want to approve this extension? The system will automatically update the booking end date and add additional fees.
              </p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex gap-3">
              <button
                onClick={() => setConfirmApproveModal({ ...confirmApproveModal, isOpen: false })}
                className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition shadow-sm flex justify-center items-center"
              >
                {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Approve"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
