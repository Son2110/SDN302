import { useState } from "react";
import { X, CheckCircle, XCircle, AlertCircle, MessageSquare, Loader2 } from "lucide-react";

export default function DriverResponseModal({ type, onClose, onConfirm, loading }) {
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const isReject = type === "rejected";
  const title = isReject ? "Reject Trip" : "Confirm Acceptance";
  const confirmText = isReject ? "Confirm Reject" : "Confirm Acceptance";
  const colorClass = isReject ? "text-red-600 bg-red-50 border-red-100" : "text-emerald-600 bg-emerald-50 border-emerald-100";
  const btnClass = isReject ? "bg-red-600 hover:bg-red-700" : "bg-emerald-600 hover:bg-emerald-700";
  const icon = isReject ? <XCircle className="w-6 h-6 text-red-600" /> : <CheckCircle className="w-6 h-6 text-emerald-600" />;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!note.trim()) {
      setError("Please provide a note (required).");
      return;
    }
    onConfirm(note);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${colorClass}`}>
              {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 font-inter">{title}</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <MessageSquare size={16} className="text-gray-400" />
              Your Note <span className="text-red-500">*</span>
            </label>
            <textarea
              autoFocus
              className={`w-full h-32 p-4 rounded-2xl border-2 transition-all outline-none text-sm font-medium ${
                error ? "border-red-200 focus:border-red-400 bg-red-50/10" : "border-gray-100 focus:border-emerald-500 focus:bg-emerald-50/5"
              }`}
              placeholder={isReject ? "Please enter reason for rejection..." : "Please enter a note for acceptance..."}
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
            />
            {error && (
              <p className="text-xs text-red-500 flex items-center gap-1 font-bold mt-1">
                <AlertCircle size={12} /> {error}
              </p>
            )}
          </div>

          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
             <p className="text-xs text-gray-500 leading-relaxed italic">
               * This note will be sent to the operations department to confirm trip status.
             </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 transition-all text-sm uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 py-3.5 rounded-2xl text-white font-bold transition-all text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 ${btnClass} disabled:opacity-50`}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
