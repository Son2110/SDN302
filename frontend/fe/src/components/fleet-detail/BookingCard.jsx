import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, User, Users, ChevronDown, Calendar } from "lucide-react";
import { createBooking } from "../../services/bookingApi";
import { getVehicleBookedDates } from "../../services/vehicleApi";
import { getToken } from "../../services/api";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Phí tài xế mỗi ngày
const DRIVER_FEE_PER_DAY = 500000;

// Danh sách địa điểm nổi bật tại TP.HCM
const POPULAR_LOCATIONS = [
  { id: 1, name: "Sân bay Tân Sơn Nhất", address: "Trường Sơn, P.2, Tân Bình, TP.HCM" },
  { id: 2, name: "Tòa Bitexco Financial Tower", address: "2 Hải Triều, Bến Nghé, Q.1, TP.HCM" },
  { id: 3, name: "Chợ Bến Thành", address: "Lê Lợi, Bến Thành, Q.1, TP.HCM" },
  { id: 4, name: "Phố đi bộ Nguyễn Huệ", address: "Nguyễn Huệ, Bến Nghé, Q.1, TP.HCM" },
  { id: 5, name: "Nhà hát Thành phố", address: "7 Công Trường Lam Sơn, Q.1, TP.HCM" },
  { id: 6, name: "Dinh Độc Lập", address: "135 Nam Kỳ Khởi Nghĩa, Q.1, TP.HCM" },
  { id: 7, name: "Nhà thờ Đức Bà", address: "1 Công xã Paris, Bến Nghé, Q.1, TP.HCM" },
  { id: 8, name: "Bưu điện Thành phố", address: "2 Công xã Paris, Bến Nghé, Q.1, TP.HCM" },
  { id: 9, name: "Bảo tàng Chứng tích Chiến tranh", address: "28 Võ Văn Tần, Q.3, TP.HCM" },
  { id: 10, name: "Landmark 81", address: "720A Điện Biên Phủ, Bình Thạnh, TP.HCM" },
];

const BookingCard = ({ car }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    pickupLocation: "",
    returnLocation: "",
    rentalType: "self_drive",
    startDate: null,
    endDate: null,
  });

  const [showPickupDropdown, setShowPickupDropdown] = useState(false);
  const [showReturnDropdown, setShowReturnDropdown] = useState(false);
  const [filteredPickupLocations, setFilteredPickupLocations] = useState(POPULAR_LOCATIONS);
  const [filteredReturnLocations, setFilteredReturnLocations] = useState(POPULAR_LOCATIONS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookedDates, setBookedDates] = useState([]);
  const [loadingDates, setLoadingDates] = useState(true);

  const pickupRef = useRef(null);
  const returnRef = useRef(null);

  // Load booked dates when component mounts
  useEffect(() => {
    const fetchBookedDates = async () => {
      if (!car._id) return;

      try {
        setLoadingDates(true);
        const response = await getVehicleBookedDates(car._id);
        console.log('📅 Booked dates for vehicle:', car._id);
        console.log('📅 Booked ranges:', response.data);
        setBookedDates(response.data || []);
      } catch (err) {
        console.error("Error loading booked dates:", err);
      } finally {
        setLoadingDates(false);
      }
    };

    fetchBookedDates();
  }, [car._id]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickupRef.current && !pickupRef.current.contains(event.target)) {
        setShowPickupDropdown(false);
      }
      if (returnRef.current && !returnRef.current.contains(event.target)) {
        setShowReturnDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if a date is booked (for date picker)
  // A date is blocked if any booking covers it
  // Booking from 17-18/3 will block BOTH 17 and 18 on calendar
  const isDateBooked = (date) => {
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);

    return bookedDates.some((range) => {
      const start = new Date(range.start);
      const end = new Date(range.end);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      // Block dates from start_date to end_date (INCLUSIVE)
      // This prevents confusion - if booked 17-18, both dates show as blocked
      return checkDate >= start && checkDate <= end;
    });
  };

  // Calculate rental days for DISPLAY (inclusive: chọn 13-16 = 4 ngày)
  const calculateRentalDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diffTime = Math.abs(formData.endDate - formData.startDate);
    const displayDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return displayDays;
  };

  // Calculate billable days for PRICING (exclude last day for handover & maintenance)
  const calculateBillableDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const diffTime = Math.abs(formData.endDate - formData.startDate);
    const billableDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return billableDays;
  };

  // Calculate total price (based on billable days, not display days)
  const calculateTotalPrice = () => {
    const days = calculateBillableDays();
    const dailyRate = car.daily_rate || 0;
    let total = days * dailyRate;

    // Add driver fee if rental type is with_driver
    if (formData.rentalType === "with_driver") {
      total += days * DRIVER_FEE_PER_DAY;
    }

    return total;
  };

  // Calculate vehicle cost only
  const calculateVehicleCost = () => {
    const days = calculateBillableDays();
    const dailyRate = car.daily_rate || 0;
    return days * dailyRate;
  };

  // Calculate driver fee
  const calculateDriverFee = () => {
    if (formData.rentalType !== "with_driver") return 0;
    const days = calculateBillableDays();
    return days * DRIVER_FEE_PER_DAY;
  };

  // Filter locations based on input
  const handlePickupChange = (value) => {
    setFormData({ ...formData, pickupLocation: value });
    const filtered = POPULAR_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(value.toLowerCase()) ||
        loc.address.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredPickupLocations(filtered);
    setShowPickupDropdown(true);
  };

  const handleReturnChange = (value) => {
    setFormData({ ...formData, returnLocation: value });
    const filtered = POPULAR_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(value.toLowerCase()) ||
        loc.address.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredReturnLocations(filtered);
    setShowReturnDropdown(true);
  };

  const selectPickupLocation = (location) => {
    setFormData({ ...formData, pickupLocation: `${location.name} - ${location.address}` });
    setShowPickupDropdown(false);
  };

  const selectReturnLocation = (location) => {
    setFormData({ ...formData, returnLocation: `${location.name} - ${location.address}` });
    setShowReturnDropdown(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.pickupLocation.trim()) {
      setError("Vui lòng nhập điểm đón");
      return;
    }

    if (!formData.returnLocation.trim()) {
      setError("Vui lòng nhập điểm trả");
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setError("Vui lòng chọn thời gian thuê xe");
      return;
    }

    // Check if selected dates have any booked days  
    console.log('🔍 Checking booking conflict...');
    console.log('Selected dates:', {
      start: formData.startDate.toISOString().split('T')[0],
      end: formData.endDate.toISOString().split('T')[0]
    });
    console.log('Booked ranges:', bookedDates);

    // Check for overlap with booked ranges
    const hasOverlap = bookedDates.some((range) => {
      const rangeStart = new Date(range.start);
      const rangeEnd = new Date(range.end);
      const selectedStart = new Date(formData.startDate);
      const selectedEnd = new Date(formData.endDate);

      // Reset hours for accurate date comparison
      rangeStart.setHours(0, 0, 0, 0);
      rangeEnd.setHours(0, 0, 0, 0);
      selectedStart.setHours(0, 0, 0, 0);
      selectedEnd.setHours(0, 0, 0, 0);

      // Check overlap: (selected.start < range.end) AND (selected.end > range.start)
      const overlap = selectedStart < rangeEnd && selectedEnd > rangeStart;

      if (overlap) {
        console.log('❌ Overlap found with:', {
          bookedRange: {
            start: rangeStart.toISOString().split('T')[0],
            end: rangeEnd.toISOString().split('T')[0]
          },
          selectedRange: {
            start: selectedStart.toISOString().split('T')[0],
            end: selectedEnd.toISOString().split('T')[0]
          }
        });
      }

      return overlap;
    });

    if (hasOverlap) {
      setError("Xe đã được khách khác đặt trong khoảng thời gian này. Vui lòng chọn thời gian khác.");
      return;
    }

    // Check if car has _id from backend
    if (!car._id) {
      setError("Không tìm thấy thông tin xe. Vui lòng thử lại.");
      return;
    }

    // Helper function to format date to YYYY-MM-DD in local timezone
    const formatDateLocal = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Lưu thông tin booking vào localStorage để dùng ở bước tiếp theo
    const bookingData = {
      vehicle_id: car._id,
      vehicle: {
        brand: car.brand,
        model: car.model,
        daily_rate: car.daily_rate,
        image_urls: car.image_urls,
        license_plate: car.license_plate,
      },
      start_date: formatDateLocal(formData.startDate),
      end_date: formatDateLocal(formData.endDate),
      rental_type: formData.rentalType,
      pickup_location: formData.pickupLocation,
      return_location: formData.returnLocation,
      total_amount: calculateTotalPrice(),
      vehicle_cost: calculateVehicleCost(),
      driver_fee: calculateDriverFee(),
      billable_days: calculateBillableDays(),
    };

    localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

    // Navigate đến trang điền thông tin khách hàng
    navigate('/booking/customer-info');
  };

  return (
    <div className="sticky top-32 bg-white rounded-3xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
      {/* Price header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <p className="text-gray-400 text-xs font-bold uppercase mb-1">
            Giá thuê ngày
          </p>
          <span className="text-3xl font-black text-gray-900">
            {car?.daily_rate ? new Intl.NumberFormat("vi-VN").format(car.daily_rate) : "N/A"}đ
          </span>
          <span className="text-sm text-gray-500 ml-2">/ngày</span>
        </div>
        <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full">
          SẴN SÀNG
        </span>
      </div>

      {/* Total Price Display */}
      {formData.startDate && formData.endDate && (
        <div className="mb-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="space-y-3">
            {/* Tổng thời gian thuê (billable days only) */}
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600">Tổng thời gian thuê</p>
              <p className="text-lg font-bold text-gray-900">{calculateBillableDays()} ngày</p>
            </div>

            {/* Price Breakdown */}
            <div className="pt-2 border-t border-blue-200 space-y-1">
              <div className="flex justify-between items-center text-sm">
                <p className="text-gray-600">Giá thuê xe ({calculateBillableDays()} ngày)</p>
                <p className="font-semibold text-gray-900">
                  {new Intl.NumberFormat("vi-VN").format(calculateVehicleCost())}đ
                </p>
              </div>
              {formData.rentalType === "with_driver" && (
                <div className="flex justify-between items-center text-sm">
                  <p className="text-gray-600">Phí tài xế ({calculateBillableDays()} ngày × 500k)</p>
                  <p className="font-semibold text-amber-600">
                    {new Intl.NumberFormat("vi-VN").format(calculateDriverFee())}đ
                  </p>
                </div>
              )}
              <div className="pt-2 border-t border-blue-300 flex justify-between items-center">
                <p className="text-sm font-bold text-gray-700">Tổng giá</p>
                <p className="text-xl font-black text-blue-600">
                  {new Intl.NumberFormat("vi-VN").format(calculateTotalPrice())}đ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selection with Calendar */}
        <div className="grid grid-cols-2 gap-3">
          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Ngày bắt đầu
            </label>
            <DatePicker
              selected={formData.startDate}
              onChange={(date) => setFormData({ ...formData, startDate: date })}
              selectsStart
              startDate={formData.startDate}
              endDate={formData.endDate}
              minDate={new Date()}
              filterDate={(date) => !isDateBooked(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn ngày"
              disabled={loadingDates}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Ngày kết thúc
            </label>
            <DatePicker
              selected={formData.endDate}
              onChange={(date) => setFormData({ ...formData, endDate: date })}
              selectsEnd
              startDate={formData.startDate}
              endDate={formData.endDate}
              minDate={formData.startDate || new Date()}
              filterDate={(date) => !isDateBooked(date)}
              dateFormat="dd/MM/yyyy"
              placeholderText="Chọn ngày"
              disabled={loadingDates || !formData.startDate}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loadingDates && (
          <p className="text-xs text-gray-500 italic">
            Đang tải thông tin ngày đã được đặt...
          </p>
        )}

        {bookedDates.length > 0 && (
          <p className="text-xs text-gray-600">
            <span className="font-semibold">Lưu ý:</span> Các ngày hiển thị màu xám trên lịch là ngày xe đã được đặt.
          </p>
        )}
        {/* Pickup Location with Dropdown */}
        <div className="relative" ref={pickupRef}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Điểm đón
          </label>
          <input
            type="text"
            value={formData.pickupLocation}
            onChange={(e) => handlePickupChange(e.target.value)}
            onFocus={() => setShowPickupDropdown(true)}
            placeholder="Nhập hoặc chọn điểm đón"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {showPickupDropdown && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {filteredPickupLocations.length > 0 ? (
                filteredPickupLocations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => selectPickupLocation(location)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="font-semibold text-sm text-gray-900">
                      {location.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {location.address}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Không tìm thấy địa điểm
                </div>
              )}
            </div>
          )}
        </div>

        {/* Return Location with Dropdown */}
        <div className="relative" ref={returnRef}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <MapPin className="inline w-4 h-4 mr-1" />
            Điểm trả
          </label>
          <input
            type="text"
            value={formData.returnLocation}
            onChange={(e) => handleReturnChange(e.target.value)}
            onFocus={() => setShowReturnDropdown(true)}
            placeholder="Nhập hoặc chọn điểm trả"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {showReturnDropdown && (
            <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {filteredReturnLocations.length > 0 ? (
                filteredReturnLocations.map((location) => (
                  <div
                    key={location.id}
                    onClick={() => selectReturnLocation(location)}
                    className="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-0"
                  >
                    <div className="font-semibold text-sm text-gray-900">
                      {location.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {location.address}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-500">
                  Không tìm thấy địa điểm
                </div>
              )}
            </div>
          )}
        </div>

        {/* Rental Type */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Hình thức thuê
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, rentalType: "self_drive" })}
              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl font-semibold text-sm transition-all ${formData.rentalType === "self_drive"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
            >
              <User size={18} />
              Tự lái
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, rentalType: "with_driver" })}
              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 rounded-xl font-semibold text-sm transition-all ${formData.rentalType === "with_driver"
                ? "border-blue-500 bg-blue-50 text-blue-700"
                : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
            >
              <Users size={18} />
              Có tài xế
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-lg shadow-blue-600/30"
        >
          {loading ? "ĐANG XỬ LÝ..." : "ĐẶT XE NGAY →"}
        </button>
      </form>

      {/* Help Section */}
      <div className="mt-6 bg-gray-50 p-4 rounded-xl text-xs text-gray-600">
        <p className="font-semibold mb-1">Cần hỗ trợ?</p>
        <p>
          Đội ngũ tư vấn của chúng tôi luôn sẵn sàng 24/7.{" "}
          <span className="text-blue-600 cursor-pointer hover:underline font-semibold">
            Liên hệ ngay →
          </span>
        </p>
      </div>
    </div>
  );
};

export default BookingCard;
