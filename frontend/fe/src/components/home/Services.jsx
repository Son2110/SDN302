import { User, Car, Plane, PartyPopper } from "lucide-react";

const services = [
  {
    title: "Dịch Vụ Có Tài Xế",
    desc: "Thả mình thư giãn trên những cung đường, trong khi tài xế chuyên nghiệp của chúng tôi đưa đón bạn với sự tận tâm nhất.",
    icon: User,
    image:
      "https://www.ecorentacar.com/wp-content/uploads/2019/08/Chauffeur-drive-car-rental.png",
  },
  {
    title: "Trải Nghiệm Tự Lái",
    desc: "Trực tiếp cầm lái những siêu phẩm xe điện hàng đầu thế giới cho những chuyến đi cuối tuần đầy cảm hứng và phấn khích.",
    icon: Car,
    image:
      "https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2020/11/28/858075/TX1.jpg",
  },
  {
    title: "Đưa Đón Sân Bay",
    desc: "Chúng tôi luôn theo dõi lịch trình chuyến bay để đảm bảo đón bạn đúng giờ, mang lại sự kết nối hoàn hảo từ phi đạo đến mặt đất.",
    icon: Plane,
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000", // Thay link ảnh hỏng (base64) bằng link minh họa sạch hơn
  },
  {
    title: "Sự Kiện & Tiệc Cưới",
    desc: "Tạo nên khoảnh khắc xuất hiện ấn tượng trong những dịp trọng đại với đội xe điện sang trọng và đẳng cấp nhất.",
    icon: PartyPopper,
    image:
      "https://imgbizhub.vietnamnews.vn//MediaUpload/Article/2025/5/29/427098-5176876930787135-A3.jpeg",
  },
];

const Services = () => {
  return (
    <section className="py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Dịch Vụ Của Chúng Tôi
            </h2>
            <p className="text-gray-500 mt-3 text-lg max-w-2xl">
              Khám phá giải pháp di chuyển cao cấp, được thiết kế riêng để mang
              lại sự tiện nghi và bền vững.
            </p>
          </div>

          {/* Điều hướng (demo) */}
          <div className="flex gap-3">
            <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all duration-300">
              <span className="text-xl">←</span>
            </button>
            <button className="w-12 h-12 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-black hover:text-white hover:border-black transition-all duration-300">
              <span className="text-xl">→</span>
            </button>
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s) => (
            <div
              key={s.title}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group"
            >
              {/* Image Container */}
              <div className="relative">
                <div className="h-52 overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Floating Icon */}
                <div className="absolute -bottom-6 right-6 z-10 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg ring-4 ring-white group-hover:rotate-[360deg] transition-transform duration-500">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              {/* Content */}
              <div className="p-7 pt-10">
                <h3 className="font-bold text-xl mb-3 text-gray-900 group-hover:text-blue-600 transition-colors">
                  {s.title}
                </h3>
                <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                  {s.desc}
                </p>
                <a
                  href="#"
                  className="text-blue-600 text-xs font-bold tracking-[0.15em] uppercase inline-flex items-center gap-2 group/link"
                >
                  Tìm hiểu thêm
                  <span className="group-hover/link:translate-x-1 transition-transform">
                    →
                  </span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
