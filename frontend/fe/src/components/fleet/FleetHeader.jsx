const FleetHeader = () => {
  return (
    <div className="mb-12">
      <p className="text-xs tracking-[0.4em] text-blue-600 font-bold uppercase mb-3">
        Đội xe VinFast
      </p>
      <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
        Khám Phá <span className="text-blue-600">Đội Xe</span> Cao Cấp
      </h1>

      <p className="max-w-2xl text-gray-500 text-lg leading-relaxed">
        Lựa chọn từ bộ sưu tập xe điện độc quyền của VinFast. Dù bạn cần dịch vụ có tài xế 
        hay trải nghiệm tự lái, chúng tôi luôn có chiếc xe hoàn hảo cho bạn.
      </p>
      <div className="w-20 h-1.5 bg-blue-600 mt-6 rounded-full" />
    </div>
  );
};

export default FleetHeader;