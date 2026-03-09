import { useState, useEffect } from "react";
import { getAssignments, assignDriver, updateAssignment, deleteAssignment } from "../../services/driverAssignmentApi";
import AssignmentTable from "../../components/staff/AssignmentTable";
import { Loader2, Plus, X, Save } from "lucide-react";

export default function StaffAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [statusFilter, setStatusFilter] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // null means "Create", string means "Edit"
  const [formData, setFormData] = useState({ booking_id: "", driver_id: "" });
  const [processing, setProcessing] = useState(false);

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const res = await getAssignments({ status: statusFilter });
      setAssignments(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn huỷ phân công này?")) return;
    try {
      await deleteAssignment(id);
      fetchAssignments();
    } catch (err) {
      alert("Lỗi khi huỷ: " + err.message);
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ booking_id: "", driver_id: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (assignment) => {
    setEditingId(assignment._id);
    setFormData({ booking_id: assignment.booking?._id || "", driver_id: assignment.driver?._id || "" });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setProcessing(true);
      if (editingId) {
        await updateAssignment(editingId, formData.driver_id);
      } else {
        await assignDriver(formData);
      }
      setIsModalOpen(false);
      fetchAssignments();
    } catch (err) {
      alert("Lỗi: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Phân công tài xế</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý và điều phối tài xế cho đơn hàng</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm transition-shadow font-medium"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ phản hồi</option>
            <option value="accepted">Đã nhận</option>
            <option value="rejected">Từ chối</option>
          </select>

          <button
            onClick={openCreateModal}
            className="flex items-center bg-blue-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
          >
            <Plus className="w-5 h-5 mr-1.5" /> Thêm phân công
          </button>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>
      ) : loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <AssignmentTable assignments={assignments} onEdit={openEditModal} onDelete={handleDelete} />
      )}

      {/* Modal / Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-900">
                {editingId ? "Đổi tài xế" : "Phân công tài xế mới"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ID Đơn đặt xe</label>
                  <input
                    type="text"
                    name="booking_id"
                    required
                    value={formData.booking_id}
                    onChange={handleFormChange}
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Nhập ID đơn đặt xe..."
                  />
                  <p className="text-xs text-gray-500 mt-1">Lưu ý: Đơn phải có loại thuê là "with_driver" và đã "confirmed".</p>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID Tài xế</label>
                <input
                  type="text"
                  name="driver_id"
                  required
                  value={formData.driver_id}
                  onChange={handleFormChange}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Nhập ID tài xế..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition flex items-center disabled:opacity-50"
                >
                  {processing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
