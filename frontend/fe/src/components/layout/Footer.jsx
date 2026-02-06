import { Car, Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    // Chuyển nền sang trắng để nổi bật trên lớp nền F9FAFB của trang
    <footer className="bg-white text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          
          {/* CỘT 1: Thương hiệu */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <img
                src="/logo.png" // hoặc /logo.png
                alt="LuxeDrive Logo"
                className="h-20 w-auto object-contain"
              />
              </div>
              <span className="font-black tracking-[0.2em] text-xl uppercase text-gray-900">
                LUXEDRIVE
              </span>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Định nghĩa lại trải nghiệm di chuyển hạng sang. Dù bạn cầm lái hay được đưa đón, chúng tôi cam kết một hành trình đẳng cấp và khác biệt.
            </p>

            <div className="flex gap-4">
              {[Facebook, Instagram, Youtube].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all duration-300 shadow-sm"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* CỘT 2: Công ty */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-blue-600">
              Công ty
            </h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              {["Về chúng tôi", "Đội ngũ lái xe", "Tin tức", "Tuyển dụng", "Đối tác"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-blue-600 hover:translate-x-2 transition-all inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 3: Dịch vụ */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-blue-600">
              Dịch vụ
            </h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              {["Thuê xe tự lái", "Dịch vụ có tài xế", "Xe đưa đón sân bay", "Xe sự kiện & tiệc cưới", "Gói dài hạn"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-blue-600 hover:translate-x-2 transition-all inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* CỘT 4: Liên hệ */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-blue-600">
              Liên hệ
            </h4>
            <div className="space-y-5 text-sm text-gray-500 font-medium">
              <div className="flex items-start gap-4 group">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                <p className="group-hover:text-gray-900 transition-colors">Số 123 Đường Luxury, Quận 1, TP. Hồ Chí Minh</p>
              </div>
              <div className="flex items-center gap-4 group">
                <Phone className="w-5 h-5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                <p className="group-hover:text-gray-900 transition-colors">+84 (0) 123 456 789</p>
              </div>
              <div className="flex items-center gap-4 group">
                <Mail className="w-5 h-5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                <p className="group-hover:text-gray-900 transition-colors">contact@luxedrive.vn</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* THANH DƯỚI CÙNG */}
      <div className="border-t border-gray-100 py-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">
            © 2026 LUXEDRIVE INC. TẤT CẢ QUYỀN ĐƯỢC BẢO LƯU.
          </p>

          <div className="flex gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Chính sách bảo mật</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Điều khoản dịch vụ</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;