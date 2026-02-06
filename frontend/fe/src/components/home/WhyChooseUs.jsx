import {
  ShieldCheck,
  Headphones,
  BadgeCheck,
  MapPin,
  Star
} from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: ShieldCheck,
    title: "Bảo Hiểm Cao Cấp",
    desc: "Gói bảo hiểm toàn diện đi kèm trong mỗi hợp đồng thuê xe.",
  },
  {
    icon: Headphones,
    title: "Hỗ Trợ 24/7",
    desc: "Đội ngũ chăm sóc khách hàng luôn sẵn sàng phục vụ mọi lúc.",
  },
  {
    icon: BadgeCheck,
    title: "Chất Lượng Kiểm Định",
    desc: "Quy trình kiểm tra 50 điểm nghiêm ngặt trước khi giao xe.",
  },
  {
    icon: MapPin,
    title: "Giao Xe Tận Nơi",
    desc: "Chúng tôi mang xe đến tận cửa nhà hoặc nơi bạn làm việc.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-20 items-start">
          
          {/* PHẦN TRÁI: Bố cục ảnh nghệ thuật */}
          <div className="relative lg:w-1/2 w-full">
            {/* Ảnh chính với khung viền cách điệu */}
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000"
                alt="LuxeDrive Experience"
                className="w-full h-[550px] object-cover"
              />
              {/* Overlay mờ */}
              <div className="absolute inset-0 bg-blue-900/10" />
            </div>

            {/* Thẻ Testimonial nổi trên ảnh */}
            <motion.div 
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="absolute -bottom-10 -right-6 lg:-right-10 z-20 bg-gray-900 text-white p-8 rounded-2xl shadow-2xl max-w-[320px]"
            >
              <div className="flex gap-1 text-blue-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-sm italic leading-relaxed mb-6 text-gray-300">
                “Dịch vụ tài xế thực sự hoàn hảo. Đúng giờ, lịch thiệp và chiếc xe luôn trong tình trạng mới tinh.”
              </p>
              <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                  S
                </div>
                <div>
                  <p className="text-sm font-bold">Thanh Hằng</p>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest">CEO, TechVina</p>
                </div>
              </div>
            </motion.div>

            {/* Decor trang trí phía sau */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-50 rounded-full -z-0" />
          </div>

          {/* PHẦN PHẢI: Nội dung */}
          <div className="lg:w-1/2 w-full pt-10">
            <p className="text-blue-600 font-bold tracking-[0.3em] text-xs uppercase mb-4">
              Tại sao là chúng tôi?
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight uppercase">
              Định Nghĩa Lại <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                Sự Sang Trọng
              </span>
            </h2>
            
            <p className="text-gray-500 mb-12 text-lg leading-relaxed">
              LuxeDrive không chỉ cho thuê xe, chúng tôi mang đến một trải nghiệm di chuyển không lo âu với tiêu chuẩn 5 sao.
            </p>

            <div className="grid sm:grid-cols-2 gap-y-12 gap-x-8">
              {features.map((f, index) => {
                const Icon = f.icon;
                return (
                  <div key={index} className="group">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <Icon size={24} />
                      </div>
                      <h4 className="font-bold text-gray-900 tracking-wide uppercase text-sm">
                        {f.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed pl-1">
                      {f.desc}
                    </p>
                  </div>
                );
              })}
            </div>
            
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;