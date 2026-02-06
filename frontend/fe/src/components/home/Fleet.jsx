const Fleets = [
  {
    name: "VinFast VF 8",
    type: "SUV THỂ THAO",
    price: "1.200.000",
    image: "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw1f936f89/reserves/VF8/vf8plus.webp",
  },
  {
    name: "VinFast VF 9",
    type: "SUV HẠNG SANG",
    price: "2.500.000",
    image:
      "https://shop.vinfastauto.com/on/demandware.static/-/Sites-app_vinfast_vn-Library/default/dw84760cc5/images/PDP/vf9/202406/exterior/CE18.webp",
  },
  {
    name: "VinFast VF e34",
    type: "SUV ĐÔ THỊ",
    price: "900.000",
    image:
      "https://vinfast.danang.vn/wp-content/uploads/2023/03/vinfast-vf-e34-mau-trang.png.webp",
  },
  {
    name: "VinFast VF 6",
    type: "SUV GIA ĐÌNH",
    price: "1.000.000",
    image:
      "https://vinfastotothanhhoa.vn/OTO3602400618/files/san_pham/VF6/mau_xe/CE11.webp",
  },
];

const Fleet = () => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.35em] text-blue-600 font-semibold uppercase mb-3">
            Bộ Sưu Tập Độc Quyền
          </p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 uppercase">
            Đội Xe Nổi Bật
          </h2>
          <div className="w-20 h-1 bg-blue-600 mx-auto mt-4" />
        </div>

        {/* Fleet cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {Fleets.map((car) => (
            <div
              key={car.name}
              className="group rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden"
            >
              {/* Image Area */}
              <div className="relative h-56 flex items-center justify-center bg-gray-50 overflow-hidden">
                <img
                  src={car.image}
                  alt={car.name}
                  className="w-[90%] object-contain transition-transform duration-700 group-hover:scale-110"
                />

                <span className="absolute top-4 left-4 bg-blue-600 text-white text-[10px] font-bold tracking-widest px-3 py-1 rounded-full uppercase">
                  {car.type}
                </span>
              </div>

              {/* Content Area */}
              <div className="p-6">
                <h3 className="font-bold text-xl text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                  {car.name}
                </h3>

                <div className="flex items-center justify-between border-t border-gray-100 pt-5">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Giá thuê từ</span>
                    <span className="text-lg font-black text-blue-600">
                      {car.price} <span className="text-xs font-normal text-gray-500">đ/ngày</span>
                    </span>
                  </div>

                  <button className="bg-gray-900 text-white text-[10px] font-bold uppercase tracking-widest px-4 py-3 rounded-xl hover:bg-blue-600 transition-colors duration-300">
                    Đặt xe
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View all */}
        <div className="text-center mt-16">
          <a
            href="#"
            className="group inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-400 hover:text-blue-600 transition-all"
          >
            Xem tất cả các dòng xe 
            <span className="group-hover:translate-x-2 transition-transform">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Fleet;