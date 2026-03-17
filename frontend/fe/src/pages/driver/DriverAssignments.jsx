import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  getMyAssignments,
  respondToAssignment,
} from "../../services/driverAssignmentApi";
import { getMyDriverStatus } from "../../services/userApi";
import { toast } from "react-hot-toast";
import {
  Calendar,
  MapPin,
  Phone,
  Car,
  CheckCircle,
  XCircle,
  WifiOff,
  User,
  Clock,
  ClipboardList,
  ChevronRight,
  Award,
} from "lucide-react";
import dayjs from "dayjs";
import DriverResponseModal from "../../components/driver/DriverResponseModal";

const DriverAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");
  const [driverStatus, setDriverStatus] = useState(null);

  // Modal State
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    assignmentId: null,
    type: null, // 'accepted' | 'rejected'
  });
  const [submitting, setSubmitting] = useState(false);

  const tabs = [
    { id: "pending", label: "Pending", icon: Clock },
    { id: "accepted", label: "Accepted", icon: CheckCircle },
    { id: "rejected", label: "Rejected", icon: XCircle },
    { id: "completed", label: "Completed", icon: Award },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getMyAssignments(activeTab);
      if (response.success) {
        setAssignments(response.data);
      }
    } catch (error) {
      toast.error("Failed to load assignments list.");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getMyDriverStatus()
      .then((d) => setDriverStatus(d?.status || null))
      .catch(() => { });
  }, []);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const openResponseModal = (id, type) => {
    setResponseModal({ isOpen: true, assignmentId: id, type });
  };

  const handleConfirmResponse = async (note) => {
    const { assignmentId, type } = responseModal;
    setSubmitting(true);
    try {
      const response = await respondToAssignment(assignmentId, {
        status: type,
        response_note: note,
      });
      if (response.success) {
        toast.success(response.message || `Response sent successfully!`);
        setResponseModal({ isOpen: false, assignmentId: null, type: null });
        fetchData();
      }
    } catch (error) {
      toast.error(error.message || `Failed to respond to assignment.`);
    } finally {
      setSubmitting(false);
    }
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-3 py-1 rounded-full bg-yellow-50 text-yellow-700 text-[10px] font-bold uppercase tracking-wider border border-yellow-100 italic">
            Pending
          </span>
        );
      case "accepted":
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider border border-emerald-100">
            Accepted
          </span>
        );
      case "rejected":
        return (
          <span className="px-3 py-1 rounded-full bg-red-50 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-100">
            Rejected
          </span>
        );
      case "completed":
        return (
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200">
            Completed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-inter">
      {/* Header with Glass Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 border border-gray-100 shadow-sm group">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-30 group-hover:bg-emerald-100 transition-colors duration-500" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-50 ring-4 ring-emerald-50">
            <ClipboardList className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              My Assignments
            </h1>
            <p className="text-gray-400 text-xs font-medium mt-0.5">
              Manage and respond to system assignment requests
            </p>
          </div>
        </div>
      </div>

      {/* Offline banner */}
      {driverStatus === "offline" && (
        <div className="relative overflow-hidden flex items-center gap-4 bg-gray-50 border border-gray-100 p-5 rounded-2xl shadow-sm">
          <div className="p-2 bg-white rounded-lg text-gray-400 border border-gray-100">
            <WifiOff size={20} />
          </div>
          <div>
            <p className="font-bold text-gray-800 text-sm">You are currently Off Duty</p>
            <p className="text-[11px] text-gray-400 font-medium">
              Please switch to "On Duty" to receive new trips.
            </p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex bg-white rounded-xl shadow-sm p-1 border border-gray-100 gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${isActive
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50 uppercase tracking-wider"
                }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center bg-white p-20 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
            <ClipboardList className="text-gray-200 w-10 h-10" />
          </div>
          <p className="text-gray-400 font-bold text-lg">No data found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {assignments.map((assignment) => {
            const booking = assignment.booking;
            if (!booking) return null;

            const startStr = dayjs(booking.start_date).format("DD/MM/YYYY");
            const endStr = dayjs(booking.end_date).format("DD/MM/YYYY");

            return (
              <div key={assignment._id} className="relative bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <div className="bg-gray-50/30 px-6 py-3 border-b border-gray-50 flex justify-between items-center group-hover:bg-white transition-colors">
                  <div className="flex items-center gap-2 bg-indigo-50/30 px-3 py-1.5 rounded-xl border border-indigo-100/50">
                    <span className="text-[9px] font-semibold text-indigo-400 uppercase tracking-tight">Booking ID</span>
                    <span className="text-[10px] font-black text-indigo-600 tracking-wider">
                      {assignment._id?.slice(-8).toUpperCase()}
                    </span>
                  </div>
                  <StatusBadge status={assignment.status} />
                </div>

                <Link to={`/driver/assignments/${assignment._id}`} className="block p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-2">Customer Information</p>
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100 group-hover:scale-105 transition-transform duration-300">
                          <User size={28} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 text-lg">
                            {booking.customer?.user?.full_name || "Private"}
                          </p>
                          <div className="flex items-center text-emerald-600 text-xs mt-1 font-bold">
                            <Phone size={12} className="mr-1.5" />
                            <span>{booking.customer?.user?.phone || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:text-right flex flex-col items-start md:items-end justify-center">
                      <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mb-2">Vehicle Information</p>
                      <div className="text-base font-bold text-gray-800 px-4 py-2 bg-gray-50 rounded-xl border border-gray-100 inline-flex items-center gap-2 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 transition-all">
                        <Car size={18} />
                        {booking.vehicle?.brand} {booking.vehicle?.model}
                      </div>
                      <p className="mt-1 text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                        {booking.vehicle?.license_plate}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-gray-50/50 rounded-2xl p-4 flex items-center gap-3 border border-transparent group-hover:bg-white group-hover:border-emerald-50 transition-all">
                      <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-emerald-50 flex items-center justify-center text-emerald-500">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Schedule</p>
                        <p className="text-gray-800 text-xs font-bold">{startStr} - {endStr}</p>
                      </div>
                    </div>

                    <div className="bg-gray-50/50 rounded-2xl p-4 flex items-center gap-3 border border-transparent group-hover:bg-white group-hover:border-red-50 transition-all">
                      <div className="w-8 h-8 bg-white rounded-lg shadow-sm border border-red-50 flex items-center justify-center text-red-400">
                        <MapPin size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Pickup Point</p>
                        <p className="text-gray-800 text-xs font-bold">
                          {booking.pickup_location}
                        </p>
                      </div>
                      <ChevronRight className="text-gray-300 group-hover:text-emerald-500 transition-colors" size={20} />
                    </div>
                  </div>
                </Link>

                {assignment.status === "pending" && (
                  <div className="px-6 py-4 bg-gray-50/30 border-t border-gray-50 flex gap-3">
                    <button
                      onClick={(e) => { e.preventDefault(); openResponseModal(assignment._id, "rejected"); }}
                      className="flex-1 py-3 text-[10px] flex items-center justify-center gap-2 rounded-xl border border-red-100 text-red-500 font-bold hover:bg-red-500 hover:text-white transition-all uppercase tracking-wider"
                    >
                      <XCircle size={16} /> REJECT
                    </button>
                    <button
                      onClick={(e) => { e.preventDefault(); openResponseModal(assignment._id, "accepted"); }}
                      disabled={driverStatus === "offline"}
                      className="flex-1 py-3 text-[10px] flex items-center justify-center gap-2 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed uppercase tracking-wider"
                    >
                      <CheckCircle size={16} /> ACCEPT
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {responseModal.isOpen && (
        <DriverResponseModal
          type={responseModal.type}
          loading={submitting}
          onClose={() => setResponseModal({ isOpen: false, assignmentId: null, type: null })}
          onConfirm={handleConfirmResponse}
        />
      )}
    </div>
  );
};

export default DriverAssignments;
