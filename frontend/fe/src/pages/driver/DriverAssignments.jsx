import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getMyAssignments, respondToAssignment } from "../../services/driverAssignmentApi";
import { toast } from "react-hot-toast";
import { Calendar, MapPin, Phone, Car, CheckCircle, XCircle } from "lucide-react";
import dayjs from "dayjs";

const DriverAssignments = () => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pending");

  const tabs = [
    { id: "pending", label: "Chờ Phản Hồi" },
    { id: "accepted", label: "Đã Nhận" },
    { id: "rejected", label: "Đã Từ Chối" },
  ];

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await getMyAssignments(activeTab);
      if (response.success) {
        setAssignments(response.data);
      }
    } catch (error) {
      toast.error("Không thể tải danh sách chuyến đi.");
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [activeTab]);

  const handleRespond = async (id, status, actionWord) => {
    // Only prompt for reject for simple UX, or accept immediately
    let note = "";
    if (status === "rejected") {
        const inputNote = window.prompt("Vui lòng nhập lý do từ chối (Không bắt buộc):");
        if (inputNote === null) return; // cancelled
        note = inputNote;
    } else {
        const confirmAccept = window.confirm("Bạn có chắc chắn muốn nhận chuyến này không?");
        if (!confirmAccept) return;
        note = "Tôi nhận chuyến này";
    }

    try {
      const response = await respondToAssignment(id, { status, response_note: note });
      if (response.success) {
        toast.success(response.message || `Đã ${actionWord} chuyến đi!`);
        fetchAssignments();
      }
    } catch (error) {
      toast.error(error.message || `Từ chối/Nhận chuyến thất bại.`);
    }
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case "pending":
        return <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-bold uppercase tracking-wider">Chờ phản hồi</span>;
      case "accepted":
        return <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wider">Đã nhận</span>;
      case "rejected":
        return <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-xs font-bold uppercase tracking-wider">Đã từ chối</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Phân Công Của Tôi</h1>

        {/* Filter Tabs */}
        <div className="flex bg-white rounded-lg shadow-sm p-1 mb-6 border border-gray-200 sticky top-20 z-10 w-full overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-max py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* List Content */}
        {loading ? (
          <div className="flex justify-center p-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        ) : assignments.length === 0 ? (
          <div className="text-center bg-white p-10 rounded-xl shadow-sm border border-gray-100">
            <p className="text-gray-500 font-medium">Không có phân công nào ở trạng thái này.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const booking = assignment.booking;
              if (!booking) return null;
              
              const startStr = dayjs(booking.start_date).format("DD/MM/YYYY");
              const endStr = dayjs(booking.end_date).format("DD/MM/YYYY");

              return (
                <div key={assignment._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                    <span className="text-xs font-mono text-gray-500">Mã: #{assignment._id?.slice(-6).toUpperCase()}</span>
                    <StatusBadge status={assignment.status} />
                  </div>

                  <Link to={`/driver/assignments/${assignment._id}`} className="block p-4">
                    {/* Customer & Vehicle Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                           <UserIcon user={booking.customer?.user} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{booking.customer?.user?.full_name || "Khách Hàng"}</p>
                          <div className="flex items-center text-gray-500 text-xs mt-1 gap-1">
                            <Phone size={12} />
                            <span>{booking.customer?.user?.phone || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                         <div className="flex items-center justify-end text-gray-600 font-medium text-sm gap-1">
                            <Car size={14} />
                            {booking.vehicle?.brand} {booking.vehicle?.model}
                         </div>
                      </div>
                    </div>

                    {/* Schedule & Location Details */}
                    <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                           <Calendar className="text-blue-500 mt-0.5" size={16} />
                           <div>
                              <p className="text-gray-800"><span className="font-medium">Từ:</span> {startStr}</p>
                              <p className="text-gray-800"><span className="font-medium">Đến:</span> {endStr}</p>
                           </div>
                        </div>
                        <div className="flex items-start gap-2 pt-1 border-t border-gray-200">
                           <MapPin className="text-red-500 mt-0.5" size={16} />
                           <div>
                               <p className="text-gray-800 line-clamp-2"><span className="font-medium text-xs text-gray-500 block">Đón/Trả:</span> {booking.pickup_location}</p>
                           </div>
                        </div>
                    </div>
                  </Link>

                  {/* Actions (Only Pending) */}
                  {assignment.status === "pending" && (
                    <div className="px-4 py-3 bg-white border-t border-gray-100 flex gap-2">
                        <button 
                            onClick={(e) => { e.preventDefault(); handleRespond(assignment._id, "rejected", "từ chối"); }}
                            className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg border border-red-200 text-red-600 font-semibold hover:bg-red-50 transition-colors"
                        >
                            <XCircle size={18} />
                            TỪ CHỐI
                        </button>
                        <button 
                            onClick={(e) => { e.preventDefault(); handleRespond(assignment._id, "accepted", "nhận"); }}
                            className="flex-1 py-2 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                        >
                            <CheckCircle size={18} />
                            NHẬN CHUYẾN
                        </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// SVG helper
const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
    </svg>
);

export default DriverAssignments;
