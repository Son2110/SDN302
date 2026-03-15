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
  Tag,
  Zap,
  Users,
  Settings,
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
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [typeFormData, setTypeFormData] = useState({
    type_name: "",
    category: "sedan",
    seat_capacity: "",
    transmission: "auto",
    fuel_type: "electric",
    battery_capacity_kwh: "",
    base_price_per_day: "",
    charging_cost_per_kwh: "3500",
    image_url: "",
  });
  const [typeSubmitting, setTypeSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vehicle_type: "",
    license_plate: "",
    brand: "",
    model: "",
    year: new Date().getFullYear(),
    color: "",
    daily_rate: "",
    is_electric: true,
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
      is_electric: true,
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

  const handleTypeSubmit = async (e) => {
    e.preventDefault();
    setTypeSubmitting(true);
    try {
      const payload = {
        type_name: typeFormData.type_name,
        category: typeFormData.category,
        seat_capacity: parseInt(typeFormData.seat_capacity),
        transmission: typeFormData.transmission,
        fuel_type: typeFormData.fuel_type,
        base_price_per_day: parseInt(typeFormData.base_price_per_day),
      };
      if (typeFormData.battery_capacity_kwh)
        payload.battery_capacity_kwh = parseFloat(
          typeFormData.battery_capacity_kwh,
        );
      if (typeFormData.charging_cost_per_kwh)
        payload.charging_cost_per_kwh = parseFloat(
          typeFormData.charging_cost_per_kwh,
        );
      if (typeFormData.image_url) payload.image_url = typeFormData.image_url;
      await vehicleApi.createVehicleType(payload);
      setShowTypeModal(false);
      setTypeFormData({
        type_name: "",
        category: "sedan",
        seat_capacity: "",
        transmission: "auto",
        fuel_type: "gasoline",
        battery_capacity_kwh: "",
        base_price_per_day: "",
        charging_cost_per_kwh: "3500",
        image_url: "",
      });
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setTypeSubmitting(false);
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
      is_electric: true,
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowTypeModal(true)}
            className="bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm"
          >
            <Tag size={18} />
            Thêm Loại Xe
          </button>
          <button
            onClick={() => {
              setEditingVehicle(null);
              resetForm();
              setShowModal(true);
            }}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-700 transition shadow-sm"
          >
            <Plus size={20} />
            Thêm Xe Mới
          </button>
        </div>
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

      {/* ── Add / Edit Vehicle Modal ── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
              setEditingVehicle(null);
              resetForm();
            }
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gray-900 flex items-center justify-center">
                  <Car size={18} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingVehicle ? "Chỉnh Sửa Xe" : "Thêm Xe Mới"}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingVehicle(null);
                  resetForm();
                }}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Section: Loại & biển số */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Thông tin cơ bản
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Loại xe *
                    </label>
                    <select
                      required
                      value={formData.vehicle_type}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          vehicle_type: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Hãng xe *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                      placeholder="VinFast"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Model *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                      placeholder="VF 8"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                      placeholder="51A-12345"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Năm SX *
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Giá & km */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Giá & tình trạng
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Màu sắc
                    </label>
                    <input
                      type="text"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                      placeholder="Đen"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                      <Zap size={14} className="text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Xe điện
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Ảnh */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Hình ảnh
                </p>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL ảnh (mỗi dòng 1 URL)
                </label>
                <textarea
                  value={formData.image_urls.join("\n")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      image_urls: e.target.value
                        .split("\n")
                        .filter((u) => u.trim()),
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50 resize-none"
                  rows={3}
                  placeholder="https://example.com/image1.jpg"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingVehicle(null);
                    resetForm();
                  }}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition text-sm"
                >
                  {editingVehicle ? "Lưu thay đổi" : "Thêm xe"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Vehicle Type Modal ── */}
      {showTypeModal && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowTypeModal(false);
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center">
                  <Tag size={16} className="text-white" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  Thêm Loại Xe Mới
                </h2>
              </div>
              <button
                onClick={() => setShowTypeModal(false)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-500 transition"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleTypeSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tên loại xe *
                </label>
                <input
                  type="text"
                  required
                  value={typeFormData.type_name}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      type_name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-gray-50"
                  placeholder="VD: SUV điện 5 chỗ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    <Settings size={13} /> Phân loại
                  </label>
                  <select
                    value={typeFormData.category}
                    onChange={(e) =>
                      setTypeFormData({
                        ...typeFormData,
                        category: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-gray-50"
                  >
                    <option value="sedan">Sedan</option>
                    <option value="suv">SUV</option>
                    <option value="van">Van</option>
                    <option value="luxury">Luxury</option>
                  </select>
                </div>
                <div>
                  <label className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    <Users size={13} /> Số chỗ *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={16}
                    value={typeFormData.seat_capacity}
                    onChange={(e) =>
                      setTypeFormData({
                        ...typeFormData,
                        seat_capacity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-gray-50"
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hộp số
                  </label>
                  <select
                    value={typeFormData.transmission}
                    onChange={(e) =>
                      setTypeFormData({
                        ...typeFormData,
                        transmission: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-gray-50"
                  >
                    <option value="auto">Tự động</option>
                    <option value="manual">Số sàn</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Giá cơ bản/ngày (VNĐ) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={typeFormData.base_price_per_day}
                    onChange={(e) =>
                      setTypeFormData({
                        ...typeFormData,
                        base_price_per_day: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-gray-50"
                    placeholder="500000"
                  />
                </div>
                <div>
                  <label className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    <Zap size={13} /> Dung lượng pin (kWh)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={typeFormData.battery_capacity_kwh}
                    onChange={(e) =>
                      setTypeFormData({
                        ...typeFormData,
                        battery_capacity_kwh: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-gray-50"
                    placeholder="82"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  URL ảnh đại diện
                </label>
                <input
                  type="url"
                  value={typeFormData.image_url}
                  onChange={(e) =>
                    setTypeFormData({
                      ...typeFormData,
                      image_url: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-300 focus:outline-none bg-gray-50"
                  placeholder="https://example.com/type.jpg"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTypeModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-semibold hover:bg-gray-50 transition text-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={typeSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                >
                  {typeSubmitting ? "Đang lưu..." : "Thêm loại xe"}
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
