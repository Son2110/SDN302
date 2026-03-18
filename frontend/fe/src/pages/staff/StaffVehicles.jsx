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
import { toast } from "react-hot-toast";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    type: "",
    vehicleId: "",
    vehicleLabel: "",
    nextStatus: "",
  });


  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vehicleData, typesData] = await Promise.all([
        vehicleApi.getVehiclesForStaff({ status: statusFilter, limit: 200 }),
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const extractBrandAndModelFromTypeName = (typeName = "") => {
    const normalized = typeName.replace(/\s+/g, " ").trim();
    if (!normalized) return { brand: "", model: "" };

    const [mainPart] = normalized.split(/\s[-–—]\s/);
    const namePart = (mainPart || normalized).trim();
    const tokens = namePart.split(" ").filter(Boolean);

    if (tokens.length === 0) return { brand: "", model: "" };
    if (tokens.length === 1) return { brand: tokens[0], model: "" };

    return {
      brand: tokens[0],
      model: tokens.slice(1).join(" "),
    };
  };

  const handleVehicleTypeChange = (vehicleTypeId) => {
    const selectedType = vehicleTypes.find((type) => type._id === vehicleTypeId);

    setFormData((prev) => {
      const next = {
        ...prev,
        vehicle_type: vehicleTypeId,
      };

      if (!selectedType || editingVehicle) return next;

      const { brand, model } = extractBrandAndModelFromTypeName(
        selectedType.type_name,
      );

      return {
        ...next,
        brand,
        model,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const hasExistingImage =
      Array.isArray(formData.image_urls) && formData.image_urls.length > 0;
    if (!editingVehicle && !selectedFile && !hasExistingImage) {
      toast.error("Please upload a vehicle image before adding a new vehicle.");
      return;
    }

    try {
      const payload = new FormData();
      payload.append("vehicle_type", formData.vehicle_type);
      payload.append("license_plate", formData.license_plate);
      payload.append("brand", formData.brand);
      payload.append("model", formData.model);
      payload.append("year", formData.year);
      payload.append("color", formData.color);
      payload.append("daily_rate", formData.daily_rate);
      payload.append("is_electric", formData.is_electric);
      payload.append("current_mileage", formData.current_mileage);

      if (selectedFile) {
        payload.append("images", selectedFile);
      } else {
        if (formData.image_urls && formData.image_urls.length > 0) {
          payload.append("image_urls", formData.image_urls[0]);
        } else {
          payload.append("image_urls", "");
        }
      }

      if (editingVehicle) {
        await vehicleApi.updateVehicle(editingVehicle._id, payload);
      } else {
        await vehicleApi.createVehicle(payload);
      }
      toast.success(editingVehicle ? "Vehicle updated successfully" : "Vehicle added successfully");
      setShowModal(false);
      setEditingVehicle(null);
      resetForm();
      loadData();
    } catch (err) {
      toast.error(err.message);
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
      image_urls:
        vehicle.image_urls?.length > 0
          ? vehicle.image_urls
          : vehicle.image_url
            ? [vehicle.image_url]
            : [],
    });
    setSelectedFile(null);
    setShowModal(true);
  };



  const openConfirmModal = ({ type, vehicle, nextStatus = "" }) => {
    setConfirmModal({
      open: true,
      type,
      vehicleId: vehicle._id,
      vehicleLabel: `${vehicle.brand} ${vehicle.model} (${vehicle.license_plate})`,
      nextStatus,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal({
      open: false,
      type: "",
      vehicleId: "",
      vehicleLabel: "",
      nextStatus: "",
    });
  };

  const handleStatusChange = async (id, status) => {
    try {
      await vehicleApi.updateVehicleStatus(id, status);
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to update vehicle status");
    }
  };

  const handleDelete = async (id) => {
    try {
      await vehicleApi.deleteVehicle(id);
      toast.success("Vehicle deleted successfully");
      loadData();
    } catch (err) {
      toast.error(err.message || "Failed to delete vehicle");
    }
  };

  const handleConfirmAction = async () => {
    const { type, vehicleId, nextStatus } = confirmModal;
    closeConfirmModal();

    if (type === "delete") {
      await handleDelete(vehicleId);
      return;
    }

    if (type === "status" && nextStatus) {
      await handleStatusChange(vehicleId, nextStatus);
      toast.success("Vehicle status updated");
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
      if (isNaN(payload.seat_capacity) || payload.seat_capacity < 1) {
        throw new Error("Seat capacity must be at least 1");
      }
      if (isNaN(payload.base_price_per_day) || payload.base_price_per_day < 0) {
        throw new Error("Base price must be a non-negative number");
      }
      if (typeFormData.battery_capacity_kwh) {
        payload.battery_capacity_kwh = parseFloat(typeFormData.battery_capacity_kwh);
        if (isNaN(payload.battery_capacity_kwh) || payload.battery_capacity_kwh < 0) {
          throw new Error("Battery capacity must be a non-negative number");
        }
      }
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
      toast.success("Vehicle type added successfully");
    } catch (err) {
      toast.error(err.message);
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
    setSelectedFile(null);
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
      available: "Available",
      rented: "Rented",
      maintenance: "Maintenance",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${colors[status]}`}
      >
        {labels[status]}
      </span>
    );
  };

  const isDeleteConfirm = confirmModal.type === "delete";
  const isStatusToMaintenance =
    confirmModal.type === "status" && confirmModal.nextStatus === "maintenance";
  const confirmTitle = isDeleteConfirm
    ? "Confirm vehicle deletion"
    : isStatusToMaintenance
      ? "Confirm maintenance update"
      : "Confirm availability update";
  const confirmMessage = isDeleteConfirm
    ? `Do you want to delete ${confirmModal.vehicleLabel}? This action cannot be undone.`
    : isStatusToMaintenance
      ? `Do you want to move ${confirmModal.vehicleLabel} to maintenance?`
      : `Do you want to move ${confirmModal.vehicleLabel} to available?`;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-600">Loading...</div>
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
            Vehicle Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage the list of vehicles in the system
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowTypeModal(true)}
            className="bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-semibold flex items-center gap-2 hover:bg-gray-50 transition shadow-sm"
          >
            <Tag size={18} />
            Add Vehicle Type
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
            Add New Vehicle
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
              placeholder="Search vehicle (brand, model, license plate)..."
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
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="rented">Rented</option>
            <option value="maintenance">Maintenance</option>
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
              src={
                vehicle.image_urls?.[0] ||
                vehicle.image_url ||
                "/cars/default.jpg"
              }
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
                  <span>Year:</span>
                  <span className="font-semibold">{vehicle.year}</span>
                </div>
                <div className="flex justify-between">
                  <span>Color:</span>
                  <span className="font-semibold">{vehicle.color}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rental/Day:</span>
                  <span className="font-bold text-blue-600">
                    {formatPrice(vehicle.daily_rate)}
                  </span>
                </div>
                {vehicle.is_electric && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle size={16} />
                    <span>Electric Vehicle</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(vehicle)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 transition"
                >
                  <Edit size={16} />
                  Edit
                </button>
                {vehicle.status !== "rented" && (
                  <>
                    {vehicle.status === "available" ? (
                      <button
                        onClick={() =>
                          openConfirmModal({
                            type: "status",
                            vehicle,
                            nextStatus: "maintenance",
                          })
                        }
                        className="flex-1 bg-yellow-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-yellow-600 transition"
                      >
                        <Wrench size={16} />
                        Maintenance
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          openConfirmModal({
                            type: "status",
                            vehicle,
                            nextStatus: "available",
                          })
                        }
                        className="flex-1 bg-green-500 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-green-600 transition"
                      >
                        <CheckCircle size={16} />
                        Available
                      </button>
                    )}
                    <button
                      onClick={() =>
                        openConfirmModal({ type: "delete", vehicle })
                      }
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
        <div className="text-center py-12 text-gray-500">No vehicles found</div>
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
                  {editingVehicle ? "Edit Vehicle" : "Add New Vehicle"}
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
              {/* Section: Basic Info */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Basic Information
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Vehicle Type *
                    </label>
                    <select
                      required
                      value={formData.vehicle_type}
                      onChange={(e) => handleVehicleTypeChange(e.target.value)}
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                    >
                      <option value="">Select vehicle type</option>
                      {vehicleTypes.map((type) => (
                        <option key={type._id} value={type._id}>
                          {type.type_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Brand *
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
                      License Plate *
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
                      Manufactured Year *
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

              {/* Section: Vehicle Options */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Maintenance & Availability
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_electric"
                      checked={formData.is_electric}
                      onChange={(e) =>
                        setFormData({ ...formData, is_electric: e.target.checked })
                      }
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="is_electric"
                      className="text-sm font-medium text-gray-700"
                    >
                      Electric Vehicle
                    </label>
                  </div>
                </div>
              </div>

              {/* Section: Price & Mileage */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Price & Condition
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Rental/Day (VND) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
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
                      ODO Mileage
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.current_mileage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          current_mileage: parseInt(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-gray-300 focus:outline-none bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Image */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Images (Only 1 image)
                </p>

                {/* --- DISPLAY EXISTING OR SELECTED IMAGE --- */}
                {(formData.image_urls.length > 0 || selectedFile) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vehicle Image
                    </label>
                    <div className="relative w-40 h-40 border rounded-lg overflow-hidden group">
                      <img
                        src={
                          selectedFile
                            ? URL.createObjectURL(selectedFile)
                            : formData.image_urls[0]
                        }
                        alt="xe"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFormData({ ...formData, image_urls: [] });
                        }}
                        className="absolute top-1 right-1 bg-white/80 hover:bg-red-500 hover:text-white text-gray-700 rounded-full p-1 transition shadow-sm opacity-0 group-hover:opacity-100"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                )}

                {/* --- UPLOAD AREA (Only show if NO image) --- */}
                {!selectedFile && formData.image_urls.length === 0 && (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Upload Image
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 bg-gray-50 text-center hover:bg-gray-100 transition relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="space-y-2 pointer-events-none">
                        <div className="mx-auto w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                          <Plus size={24} />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          Click to choose an image or drag and drop here
                        </p>
                        <p className="text-xs text-gray-400">
                          PNG, JPG, WEBP (Max 5MB)
                        </p>
                      </div>
                    </div>
                  </>
                )}
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition text-sm"
                >
                  {editingVehicle ? "Save Changes" : "Add Vehicle"}
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
                  Add New Vehicle Type
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
                  Vehicle Type Name *
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
                  placeholder="e.g. 5-seater Electric SUV"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
                    <Settings size={13} /> Category
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
                    <Users size={13} /> Seats *
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
                    Transmission
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
                    <option value="auto">Auto</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Base Price/Day (VND) *
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
                    <Zap size={13} /> Battery Capacity (kWh)
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
                  Thumbnail URL
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={typeSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition text-sm disabled:opacity-50"
                >
                  {typeSubmitting ? "Saving..." : "Add vehicle type"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmModal.open && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-60"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirmModal();
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-700 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">
                  {confirmTitle}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{confirmMessage}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeConfirmModal}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAction}
                className={`flex-1 py-2.5 text-white rounded-xl font-semibold transition ${isDeleteConfirm
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-500 hover:bg-yellow-600"
                  }`}
              >
                {isDeleteConfirm ? "Delete" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default StaffVehicles;
