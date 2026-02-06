import { Car, CalendarCheck, Key } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "Chọn Dòng Xe",
    desc: "Khám phá bộ sưu tập xe điện đa dạng, từ SUV mạnh mẽ đến Sedan sang trọng phù hợp với mọi nhu cầu.",
    icon: Car,
  },
  {
    id: "02",
    title: "Đặt Lịch Trực Tuyến",
    desc: "Hệ thống đặt xe an toàn. Bạn có thể chọn tự lái hoặc thêm dịch vụ tài xế chuyên nghiệp chỉ với vài cú click.",
    icon: CalendarCheck,
  },
  {
    id: "03",
    title: "Sẵn Sàng Khởi Hành",
    desc: "Nhận xe tại showroom hoặc yêu cầu giao tận cửa. Bắt đầu hành trình đẳng cấp và tiện nghi ngay tức thì.",
    icon: Key,
  },
];

const SeamlessExperience = () => {
  return (
    <section className="py-24 bg-[#F9FAFB] relative overflow-hidden">
      {/* Hiệu ứng chấm nền - Chỉnh lại màu chấm cho nền sáng */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] bg-[size:32px_32px]" />
      
      {/* Hiệu ứng ánh sáng xanh nhẹ ở góc - Giảm độ đậm để hài hòa với nền sáng */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-20">
          <p className="text-xs tracking-[0.4em] text-blue-600 font-bold uppercase mb-4">
            Quy trình tối giản
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Trải Nghiệm <span className="text-blue-600 underline underline-offset-8 decoration-2">Mượt Mà</span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className="
                  relative
                  group
                  bg-white
                  border border-gray-100
                  rounded-2xl
                  p-10
                  shadow-sm
                  hover:shadow-xl
                  hover:border-blue-500/30
                  hover:-translate-y-2
                  transition-all duration-500
                "
              >
                {/* Số thứ tự bước - Chỉnh lại độ mờ cho nền sáng */}
                <span className="absolute top-8 right-10 text-6xl font-black text-gray-100 group-hover:text-blue-500/10 transition-colors duration-500">
                  {step.id}
                </span>

                {/* Icon với hiệu ứng phát sáng */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all duration-500">
                  <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>

                {/* Content - Chuyển sang màu tối cho dễ đọc */}
                <h3 className="font-bold text-xl mb-4 uppercase tracking-wider text-gray-900 group-hover:text-blue-600 transition-colors">
                  {step.title}
                </h3>
                <p className="text-gray-500 leading-relaxed group-hover:text-gray-600 transition-colors">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SeamlessExperience;