import FleetCard from "./FleetCard";
// Import file data riêng của bạn ở đây
import { fleetData } from "../../../data/fleetData"; 

const FleetGrid = ({ data }) => {
  /* Ưu tiên dùng 'data' nhận từ cha (dữ liệu đã qua bộ lọc). 
     Nếu không có (ví dụ trang chủ hiện tất cả xe), thì dùng 'fleetData' gốc.
  */
  const displayData = data || fleetData; 

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {displayData.map((car) => (
        <FleetCard key={car.id} car={car} />
      ))}

      {/* Hiển thị thông báo nếu bộ lọc không khớp với xe nào */}
      {displayData.length === 0 && (
        <div className="col-span-full py-20 text-center">
          <p className="text-gray-400 font-medium">
            Không tìm thấy xe phù hợp với tiêu chí của bạn.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-blue-600 text-sm font-bold underline"
          >
            Thiết lập lại bộ lọc
          </button>
        </div>
      )}
    </div>
  );
};

export default FleetGrid;