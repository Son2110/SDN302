import { useState, useEffect } from "react";
import { getAllDrivers } from "../../services/userApi";
import { Loader2, Search, CarFront, CheckCircle, XCircle } from "lucide-react";

export default function StaffDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      // We can pass params if the backend supports search, otherwise we'll filter on frontend
      const res = await getAllDrivers();
      setDrivers(res.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const filteredDrivers = drivers.filter(driver => 
    driver.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    driver.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.user?.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý tài xế</h1>
          <p className="text-gray-500 text-sm mt-1">Xem danh sách tất cả tài xế hiện có trên hệ thống</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm tên, email, SDT..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm w-full md:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {error ? (
        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100">{error}</div>
      ) : loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-500 shadow-sm">
          <CarFront className="w-12 h-12 mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-900">Không tìm thấy tài xế nào</p>
          <p className="mt-1">Thử thay đổi từ khóa tìm kiếm</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="py-4 px-6 font-medium">Tài xế</th>
                  <th className="py-4 px-6 font-medium">Bằng lái / Hạng</th>
                  <th className="py-4 px-6 font-medium">Số điện thoại</th>
                  <th className="py-4 px-6 font-medium text-center">Tình trạng</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredDrivers.map((driver) => (
                  <tr key={driver._id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                          {driver.user?.full_name?.charAt(0).toUpperCase() || "D"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{driver.user?.full_name}</p>
                          <p className="text-gray-500 text-xs">{driver.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      <div className="font-medium text-gray-900">{driver.license_number || "Chưa cập nhật"}</div>
                      <div className="text-xs text-gray-500">Hạng: {driver.license_type || "N/A"}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {driver.user?.phone || "Chưa cập nhật"}
                    </td>
                    <td className="py-4 px-6 text-sm text-center">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                        driver.user?.is_active !== false 
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {driver.user?.is_active !== false ? (
                          <><CheckCircle className="w-3 h-3" /> <span>Hoạt động</span></>
                        ) : (
                          <><XCircle className="w-3 h-3" /> <span>Đã khóa</span></>
                        )}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 text-sm text-gray-500 flex justify-between items-center">
            <span>Hiển thị <span className="font-medium text-gray-900">{filteredDrivers.length}</span> tài xế</span>
          </div>
        </div>
      )}
    </div>
  );
}
