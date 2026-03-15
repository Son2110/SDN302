import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Car,
  AlertCircle,
  CheckCircle,
  Wrench,
  X,
} from "lucide-react";
import * as vehicleApi from "../../services/vehicleApi";

const StaffVehicles = () => {
  const [vehicles, setVehicles] = useState([]);
  const [vehicleTypes, setVehicleTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    vehicle_type: "",
    license_plate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    daily_rate: "",
    is_electric: false,
    current_mileage: 0,
    image_urls: [],
  });

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehicleData, typesData] = await Promise.all([
        vehicleApi.getVehiclesForStaff({ status: statusFilter }),
        vehicleApi.getVehicleTypes(),
      ]);
      setVehicles(vehicleData.data);
      setVehicleTypes(typesData);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle._id, formData);
      } else {
        await vehicleApi.createVehicle(formData);
      }
      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleEdit = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      vehicle_type: vehicle.vehicle_type?._id || "",
      license_plate: vehicle.license_plate,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      color: vehicle.color || "",
      daily_rate: vehicle.daily_rate,
      is_electric: vehicle.is_electric,
      current_mileage: vehicle.current_mileage,
      image_urls: vehicle.image_urls || [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Bạn có chắc muốn xóa xe này?")) return;
    try {
      await vehicleApi.deleteVehicle(id);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await vehicleApi.updateVehicleStatus(id, status);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      vehicle_type: "",
      license_plate: "",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      color: "",
      daily_rate: "",
      is_electric: false,
      current_mileage: 0,
      image_urls: [],
    });
  };

  const filteredVehicles = vehicles.filter((v) =>
    `${v.brand} ${v.model} ${v.license_plate}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const getStatusBadge = (status) => {
    const colors = {
      available: "bg-green-100 text-green-700",
      rented: "bg-blue-100 text-blue-700",
      maintenance: "bg-yellow-100 text-yellow-700",
    };
    const labels = {
      available: "Sẵn sàng",
      rented: "Đang thuê",
      maintenance: "Bảo trì",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Car size={32} className="text-blue-600" />
            Quản Lý Xe
          </h1>
          <p className="text-gray-600 mt-1">
            Quản lý danh sách xe trong hệ thống
          </p>
        </div>
        <button
          onClick={() => {
            setEditingVehicle(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-blue-700 transition shadow-lg"
        >
          <Plus size={20} />
          Thêm Xe Mới
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Tìm kiếm xe (brand, model, biển số)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="available">Sẵn sàng</option>
            <option value="rented">Đang thuê</option>
            <option value="maintenance">Bảo trì</option>
          </select>
        </div>
      </div>

      {/* Vehicle List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <div
            key={vehicle._id}
            className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition"
          >
            <img
              src={vehicle.image_urls?.[0] || "/cars/default.jpg"}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="w-full h-48 object-cover"
            />
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {vehicle.brand} {vehicle.model}
                  </h3>
                  <p className="text-sm text-gray-600 font-mono">
                    {vehicle.license_plate}
                  </p>
                </div>
                {getStatusBadge(vehicle.status)}
              </div>
              <div className="space-y-2 mb-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Năm:</span>
                  <span className="font-semibold">{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span>Màu:</span>
                  <span className="font-semibold">{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span>Giá thuê/ngày:</span>
                  <span className="font-bold text-blue-600">
                    {formatPrice(vehicle.daily_rate)}
                  </span>
                </div>
                {vehicle.is_electric && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={16} />
                    <span>Xe điện</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                >
                  <Edit size={16} />
                  Sửa
                </button>
                {vehicle.status !== "rented" && (
                  <>
                    {vehicle.status === "available" ? (
                      <button
                        onClick={() =>
                          handleStatusChange(vehicle._id, "maintenance")
                        }
                        className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-yellow-600 transition"
                      >
                        <Wrench size={16} />
                        Bảo trì
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          handleStatusChange(vehicle._id, "available")
                        }
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
                      >
                        <CheckCircle size={16} />
                        Sẵn sàng
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(vehicle._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-600 transition"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          Không tìm thấy xe nào
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-10 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingVehicle ? "Chỉnh Sửa Xe" : "Thêm Xe Mới"}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Loại xe *
                  </label>
                  <select
                    required
                    value={formData.vehicle_type}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle_type: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Chọn loại xe</option>
                    {vehicleTypes.map((type) => (
                      <option key={type._id} value={type._id}>
                        {type.type_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Biển số *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.license_plate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        license_plate: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="51A-12345"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Hãng xe *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.brand}
                    onChange={(e) =>
                      setFormData({ ...formData, brand: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VinFast"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Model *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.model}
                    onChange={(e) =>
                      setFormData({ ...formData, model: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="VF 8"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Năm sản xuất *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.year}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        year: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Màu sắc
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Đen"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Giá thuê/ngày (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.daily_rate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        daily_rate: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số km đã chạy
                  </label>
                  <input
                    type="number"
                    value={formData.current_mileage}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        current_mileage: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_electric}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        is_electric: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-semibold text-gray-700">
                    Xe điện
                  </span>
                </label>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  URL hình ảnh (nhập nhiều, mỗi dòng 1 URL)
                </label>
                <textarea
                  value={formData.image_urls.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      image_urls: e.target.value
                        .split("\n")
                        .filter((url) => url.trim()),
                    })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
                >
                  {editingVehicle ? "Cập Nhật" : "Thêm Xe"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingVehicle(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-400 transition"
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffVehicles;
