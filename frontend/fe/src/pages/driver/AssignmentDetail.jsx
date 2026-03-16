import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssignmentDetail, respondToAssignment } from "../../services/driverAssignmentApi";
import { getMyDriverStatus } from "../../services/userApi";
import { getHandoverByBooking } from "../../services/handoverApi";
import { toast } from "react-hot-toast";
import { Car, User, Phone, Mail, Calendar, MapPin, ChevronLeft, CheckCircle, XCircle, FileText, Activity, ShieldCheck, WifiOff } from "lucide-react";
import dayjs from "dayjs";
import DriverResponseModal from "../../components/driver/DriverResponseModal";

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [handover, setHandover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [driverStatus, setDriverStatus] = useState(null);

  // Modal State
  const [responseModal, setResponseModal] = useState({
    isOpen: false,
    type: null,
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const response = await getAssignmentDetail(id);
      if (response.success && response.data) {
        setDetail(response.data);
        
        // Fetch Handover Info
        if (response.data.booking?._id) {
          try {
            const handoverRes = await getHandoverByBooking(response.data.booking._id);
            if (handoverRes.success) {
              setHandover(handoverRes.data);
            }
          } catch (err) {
            console.log("No handover data found");
          }
        }
      }
    } catch (error) {
      toast.error(error.message || "Không thể tải chi tiết phân công.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    getMyDriverStatus()
      .then((d) => setDriverStatus(d?.status || null))
      .catch(() => { });
  }, [id]);

  const openResponseModal = (type) => {
    setResponseModal({ isOpen: true, type });
  };

  const handleConfirmResponse = async (note) => {
    setSubmitting(true);
    try {
      const response = await respondToAssignment(id, { 
        status: responseModal.type, 
        response_note: note 
      });
      if (response.success) {
        toast.success(response.message || `Đã gửi phản hồi thành công!`);
        setResponseModal({ isOpen: false, type: null });
        fetchDetail();
      }
    } catch (error) {
      toast.error(error.message || `Từ chối/Nhận chuyến thất bại.`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800">Không tìm thấy phân công</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-emerald-600 underline">Quay lại</button>
      </div>
    );
  }

  const { booking, status, response_note } = detail;
  if (!booking) return null;

  const startStr = dayjs(booking.start_date).format("DD/MM/YYYY HH:mm");
  const endStr = dayjs(booking.end_date).format("DD/MM/YYYY HH:mm");

  return (
    <div className="space-y-6">
      <div className="max-w-2xl mx-auto pb-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white rounded-xl shadow-sm hover:bg-gray-50 text-gray-600 border border-gray-100 transition-all">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Chi tiết phân công</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400 font-bold uppercase tracking-wider">Trạng thái chuyến:</span>
            {status === "pending" && <span className="px-4 py-1 rounded-full bg-yellow-50 text-yellow-700 text-xs font-bold uppercase border border-yellow-100 shadow-sm transition-all duration-300">Chờ phản hồi</span>}
            {status === "accepted" && <span className="px-4 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase border border-emerald-100 shadow-sm transition-all duration-300">Đã nhận</span>}
            {status === "rejected" && <span className="px-4 py-1 rounded-full bg-red-50 text-red-700 text-xs font-bold uppercase border border-red-100 shadow-sm transition-all duration-300">Đã từ chối</span>}
          </div>
          {response_note && (
             <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-700 italic border border-gray-100">
               <span className="font-bold not-italic text-gray-500 mr-2">Ghi chú:</span> {response_note}
             </div>
          )}
        </div>

        {/* Pending Actions */}
        {status === "pending" && (
          <div className="space-y-4 mb-8">
            {driverStatus === "offline" && (
              <div className="flex items-center gap-4 bg-red-50 border border-red-100 text-red-700 px-5 py-3 rounded-2xl shadow-sm">
                <WifiOff className="text-red-400 shrink-0" size={20} />
                <p className="text-xs font-bold leading-tight">
                  Bạn đang Nghỉ ca. Hãy kích hoạt trạng thái Hoạt động trong hồ sơ để có thể nhận chuyến này.
                </p>
              </div>
            )}
            <div className="flex gap-4">
              <button 
                  onClick={() => openResponseModal("rejected")}
                  className="flex-1 py-3.5 flex items-center justify-center gap-2 rounded-2xl bg-white border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 hover:border-red-200 transition-all uppercase tracking-wider shadow-sm shadow-red-50"
              >
                  <XCircle size={20} /> TỪ CHỐI
              </button>
              <button 
                  onClick={() => openResponseModal("accepted")}
                  disabled={driverStatus === "offline"}
                  className="flex-1 py-3.5 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-all uppercase tracking-wider shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale"
              >
                  <CheckCircle size={20} /> NHẬN CHUYẾN
              </button>
            </div>
          </div>
        )}

        {/* Info Cards */}
        <div className="space-y-6">
          {/* Lịch trình */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-emerald-50 px-5 py-4 border-b border-emerald-100/50 flex items-center gap-2.5 font-bold text-emerald-800">
                <Calendar size={18} /> Lịch trình chi tiết
             </div>
             <div className="p-5 space-y-5">
                <div className="grid grid-cols-2 gap-6">
                   <div>
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5">Thời gian đón</p>
                     <p className="font-bold text-gray-800 text-sm whitespace-nowrap">{startStr}</p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1.5 font-inter">Thời gian kết thúc</p>
                     <p className="font-bold text-gray-800 text-sm whitespace-nowrap">{endStr}</p>
                   </div>
                </div>
                <div className="pt-4 border-t border-gray-50 space-y-4">
                   <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 bg-emerald-50 rounded-lg"><MapPin size={18} className="text-emerald-500"/></div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Điểm đón khách</p>
                        <p className="text-sm text-gray-800 leading-relaxed font-bold">{booking.pickup_location}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4 pt-2">
                       <div className="mt-1 p-2 bg-red-50 rounded-lg"><MapPin size={18} className="text-red-400"/></div>
                      <div>
                        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-1">Điểm đến (Dự kiến)</p>
                        <p className="text-sm text-gray-800 leading-relaxed font-bold">{booking.return_location || booking.pickup_location}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center gap-2.5 font-bold text-gray-800">
                <User size={18} /> Thông tin khách hàng
             </div>
             <div className="p-5">
                <p className="font-bold text-xl text-gray-900 mb-5">{booking.customer?.user?.full_name}</p>
                
                <div className="space-y-4 font-inter">
                   <div className="flex items-center justify-between p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                      <div className="flex items-center gap-3">
                         <div className="p-2.5 bg-white shadow-sm text-emerald-600 rounded-xl border border-emerald-50"><Phone size={18} /></div>
                         <span className="font-bold text-gray-800 tracking-tight">{booking.customer?.user?.phone}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 px-2">
                      <Mail size={18} className="text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">{booking.customer?.user?.email}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center gap-2.5 font-bold text-gray-800">
                <Car size={18} /> Thông tin xe
             </div>
             <div className="p-5">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-gray-900">{booking.vehicle?.brand} {booking.vehicle?.model}</span>
                    <span className="px-4 py-1.5 bg-gray-900 rounded-lg text-white font-mono font-bold text-sm tracking-widest shadow-lg">{booking.vehicle?.license_plate}</span>
                </div>
                <div className="text-sm text-gray-600 flex gap-2 items-center">
                    <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider text-gray-500 border border-gray-200">{booking.vehicle?.vehicle_type?.type_name}</span>
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 rounded-full text-[10px] font-bold uppercase tracking-wider text-emerald-600 border border-emerald-100">
                       <ShieldCheck size={12} /> Sẵn sàng
                    </span>
                 </div>
             </div>
          </div>

          {/* Handover Section (only if accepted and exists) */}
          {(status === "accepted" || handover) && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
               <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 font-bold text-gray-800">
                    <FileText size={18} /> Biên bản bàn giao
                  </div>
                  {handover && handover.delivery && (
                     <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-widest">Đã giao xe</span>
                  )}
               </div>
               
               <div className="p-5">
                  {!handover ? (
                     <p className="text-sm text-gray-400 italic text-center py-6 font-medium">Chưa có thông tin nhận xe từ điều hành.</p>
                  ) : (
                     <div className="space-y-4">
                        {/* Delivery */}
                        {handover.delivery && (
                           <div className="p-4 border border-gray-100 bg-gray-50/50 rounded-2xl">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Thông tin nhận xe:</p>
                              <div className="grid grid-cols-2 gap-5 mb-2">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Người giao</span>
                                   <span className="font-bold text-sm text-gray-800">{handover.delivery.staff?.user?.full_name || "N/A"}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Thời gian</span>
                                   <span className="font-bold text-sm text-gray-800">{dayjs(handover.delivery.handover_time).format("DD/MM HH:mm")}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Số KM ban đầu</span>
                                   <span className="font-bold text-sm text-emerald-600">{handover.delivery.mileage?.toLocaleString()} km</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Pin / Xăng</span>
                                   <span className="font-bold text-sm text-emerald-600">{handover.delivery.battery_level_percentage}%</span>
                                </div>
                              </div>
                              {handover.delivery.notes && (
                                <div className="mt-3 pt-3 border-t border-gray-200/50">
                                   <p className="text-xs text-gray-600 leading-relaxed font-medium"><span className="font-bold text-gray-400 uppercase text-[9px] mr-2">Ghi chú:</span> {handover.delivery.notes}</p>
                                </div>
                              )}
                           </div>
                        )}

                        {/* Return */}
                        {handover.return && (
                          <div className="p-4 border border-emerald-100/50 bg-emerald-50/30 rounded-2xl ring-1 ring-emerald-100/50 ring-inset">
                              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest mb-3">Thông tin trả xe:</p>
                              <div className="grid grid-cols-2 gap-5">
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Người nhận</span>
                                   <span className="font-bold text-sm text-gray-800">{handover.return.staff?.user?.full_name || "N/A"}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Thời gian trả</span>
                                   <span className="font-bold text-sm text-gray-800">{dayjs(handover.return.handover_time).format("DD/MM HH:mm")}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Số KM cuối</span>
                                   <span className="font-bold text-sm text-emerald-600">{handover.return.mileage?.toLocaleString()} km</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">Pin / Xăng</span>
                                   <span className="font-bold text-sm text-emerald-600">{handover.return.battery_level_percentage}%</span>
                                </div>
                              </div>
                          </div>
                        )}

                        {/* Summary */}
                        {handover.km_driven && (
                           <div className="flex items-center justify-between p-4 bg-emerald-600 rounded-2xl text-white shadow-lg shadow-emerald-100">
                              <span className="text-sm font-bold flex items-center gap-2"><Activity size={18}/> Quãng đường đã di chuyển</span>
                              <span className="text-lg font-bold">{handover.km_driven.toLocaleString()} km</span>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
          )}

        </div>
      </div>

      {/* Response Modal */}
      {responseModal.isOpen && (
        <DriverResponseModal
          type={responseModal.type}
          loading={submitting}
          onClose={() => setResponseModal({ isOpen: false, type: null })}
          onConfirm={handleConfirmResponse}
        />
      )}
    </div>
  );
};

export default AssignmentDetail;
