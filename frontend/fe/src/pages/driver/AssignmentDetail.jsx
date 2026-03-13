import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getAssignmentDetail, respondToAssignment } from "../../services/driverAssignmentApi";
import { getHandoverByBooking } from "../../services/handoverApi";
import { toast } from "react-hot-toast";
import { Car, User, Phone, Mail, Calendar, MapPin, ChevronLeft, CheckCircle, XCircle, FileText, Activity } from "lucide-react";
import dayjs from "dayjs";

const AssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [handover, setHandover] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [id]);

  const handleRespond = async (status, actionWord) => {
    let note = "";
    if (status === "rejected") {
        const inputNote = window.prompt("Vui lòng nhập lý do từ chối (Không bắt buộc):");
        if (inputNote === null) return;
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
        fetchDetail();
      }
    } catch (error) {
      toast.error(error.message || `Từ chối/Nhận chuyến thất bại.`);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="min-h-screen bg-gray-50 pt-24 px-4 text-center">
        <h2 className="text-xl font-bold text-gray-800">Không tìm thấy phân công</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-blue-600 underline">Quay lại</button>
      </div>
    );
  }

  const { booking, status, response_note } = detail;
  if (!booking) return null;

  const startStr = dayjs(booking.start_date).format("DD/MM/YYYY HH:mm");
  const endStr = dayjs(booking.end_date).format("DD/MM/YYYY HH:mm");

  return (
    <div className="bg-gray-50 min-h-screen pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 text-gray-600">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Chi Tiết Phân Công</h1>
        </div>

        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-500 font-medium">Trạng thái chuyến:</span>
            {status === "pending" && <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-800 text-sm font-bold uppercase">Chờ phản hồi</span>}
            {status === "accepted" && <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-bold uppercase">Đã nhận</span>}
            {status === "rejected" && <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-bold uppercase">Đã từ chối</span>}
          </div>
          {response_note && (
             <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-700 italic border border-gray-100">
               Ghi chú của bạn: {response_note}
             </div>
          )}
        </div>

        {/* Pending Actions */}
        {status === "pending" && (
          <div className="flex gap-3 mb-6">
            <button 
                onClick={() => handleRespond("rejected", "từ chối")}
                className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-white border border-red-200 text-red-600 font-bold hover:bg-red-50 shadow-sm"
            >
                <XCircle size={20} /> TỪ CHỐI
            </button>
            <button 
                onClick={() => handleRespond("accepted", "nhận")}
                className="flex-1 py-3 flex items-center justify-center gap-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-sm"
            >
                <CheckCircle size={20} /> NHẬN CHUYẾN
            </button>
          </div>
        )}

        {/* Info Cards */}
        <div className="space-y-5">
          {/* Lịch trình */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-blue-50 px-4 py-3 border-b border-blue-100 flex items-center gap-2 font-bold text-blue-800">
                <Calendar size={18} /> Lịch Trình Chi Tiết
             </div>
             <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Thời gian đón</p>
                     <p className="font-medium text-gray-900">{startStr}</p>
                   </div>
                   <div>
                     <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Thời gian kết thúc</p>
                     <p className="font-medium text-gray-900">{endStr}</p>
                   </div>
                </div>
                <div className="pt-3 border-t border-gray-100 space-y-3">
                   <div className="flex items-start gap-3">
                      <div className="mt-0.5"><MapPin size={18} className="text-blue-500"/></div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Điểm đón khách</p>
                        <p className="text-sm text-gray-800 leading-relaxed font-medium">{booking.pickup_location}</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-3">
                      <div className="mt-0.5"><MapPin size={18} className="text-red-500"/></div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Điểm đến (Dự kiến)</p>
                        <p className="text-sm text-gray-800 leading-relaxed font-medium">{booking.return_location || booking.pickup_location}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-800">
                <User size={18} /> Thông Tin Khách Hàng
             </div>
             <div className="p-4">
                <p className="font-bold text-lg text-gray-900 mb-4">{booking.customer?.user?.full_name}</p>
                
                <div className="space-y-3">
                   <div className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-blue-100 text-blue-600 rounded-full"><Phone size={16} /></div>
                         <span className="font-medium text-gray-800">{booking.customer?.user?.phone}</span>
                      </div>
                      <a href={`tel:${booking.customer?.user?.phone}`} className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-full">GỌI NGAY</a>
                   </div>
                   <div className="flex items-center gap-3 px-1">
                      <Mail size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-600">{booking.customer?.user?.email}</span>
                   </div>
                </div>
             </div>
          </div>

          {/* Vehicle Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center gap-2 font-bold text-gray-800">
                <Car size={18} /> Thông Tin Xe
             </div>
             <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gray-900">{booking.vehicle?.brand} {booking.vehicle?.model}</span>
                    <span className="px-3 py-1 bg-gray-100 rounded text-gray-800 font-mono font-bold text-sm tracking-widest">{booking.vehicle?.license_plate}</span>
                </div>
                <div className="text-sm text-gray-600 flex gap-2 items-center">
                    <span className="px-2 py-1 bg-gray-100 rounded-md text-xs font-medium">{booking.vehicle?.vehicle_type?.type_name}</span>
                </div>
             </div>
          </div>

          {/* Handover Section (only if accepted and exists) */}
          {(status === "accepted" || handover) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
               <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 font-bold text-gray-800">
                    <FileText size={18} /> Biên Bản Bàn Giao
                  </div>
                  {handover && handover.delivery && (
                     <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Đã giao xe</span>
                  )}
               </div>
               
               <div className="p-4">
                  {!handover ? (
                     <p className="text-sm text-gray-500 italic text-center py-4">Chưa có thông tin nhận xe từ điều hành.</p>
                  ) : (
                     <div className="space-y-4">
                        {/* Delivery */}
                        {handover.delivery && (
                           <div className="p-3 border border-gray-100 bg-gray-50 rounded-lg">
                              <p className="text-xs font-bold text-gray-500 uppercase mb-2">Thông tin nhận xe:</p>
                              <div className="grid grid-cols-2 gap-3 mb-2">
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Người giao</span>
                                   <span className="font-medium text-sm text-gray-900">{handover.delivery.staff?.user?.full_name || "N/A"}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Thời gian nhận</span>
                                   <span className="font-medium text-sm text-gray-900">{dayjs(handover.delivery.handover_time).format("DD/MM HH:mm")}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Số KM ban đầu</span>
                                   <span className="font-medium text-sm text-gray-900">{handover.delivery.mileage?.toLocaleString()} km</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Mức Pin / Xăng</span>
                                   <span className="font-medium text-sm text-gray-900">{handover.delivery.battery_level_percentage}%</span>
                                </div>
                              </div>
                              {handover.delivery.notes && (
                                <p className="text-xs text-gray-600 mt-2"><span className="font-bold">Ghi chú:</span> {handover.delivery.notes}</p>
                              )}
                           </div>
                        )}

                        {/* Return */}
                        {handover.return && (
                          <div className="p-3 border border-green-100 bg-green-50 rounded-lg">
                              <p className="text-xs font-bold text-green-700 uppercase mb-2">Thông tin trả xe:</p>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Người nhận</span>
                                   <span className="font-medium text-sm text-gray-900">{handover.return.staff?.user?.full_name || "N/A"}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Thời gian trả</span>
                                   <span className="font-medium text-sm text-gray-900">{dayjs(handover.return.handover_time).format("DD/MM HH:mm")}</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Số KM lúc trả</span>
                                   <span className="font-medium text-sm text-gray-900">{handover.return.mileage?.toLocaleString()} km</span>
                                </div>
                                <div className="flex flex-col">
                                   <span className="text-xs text-gray-500">Mức Pin / Xăng</span>
                                   <span className="font-medium text-sm text-gray-900">{handover.return.battery_level_percentage}%</span>
                                </div>
                              </div>
                          </div>
                        )}

                        {/* Summary */}
                        {handover.km_driven && (
                           <div className="flex items-center justify-between p-3 bg-blue-600 rounded-lg text-white">
                              <span className="text-sm font-medium flex items-center gap-2"><Activity size={16}/> Quãng đường đã di chuyển</span>
                              <span className="font-bold">{handover.km_driven.toLocaleString()} km</span>
                           </div>
                        )}
                     </div>
                  )}
               </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AssignmentDetail;
