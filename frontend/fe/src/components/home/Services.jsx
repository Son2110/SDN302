import { User, Car, Plane, PartyPopper } from "lucide-react";

const services = [
  {
    title: "Chauffeur Service",
    desc: "Relax on every route while our professional drivers provide punctual and attentive transportation.",
    icon: User,
    image:
      "https://www.ecorentacar.com/wp-content/uploads/2019/08/Chauffeur-drive-car-rental.png",
  },
  {
    title: "Self-Drive Rental",
    desc: "Take the wheel of premium electric vehicles for inspiring and exciting weekend journeys.",
    icon: Car,
    image:
      "https://media-cdn-v2.laodong.vn/Storage/NewsPortal/2020/11/28/858075/TX1.jpg",
  },
  {
    title: "Airport Transfer",
    desc: "We track your flight schedule to ensure your pickup is always on time.",
    icon: Plane,
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1000",
  },
  {
    title: "Events & Weddings",
    desc: "Create a standout arrival moment for your most important occasions.",
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
              Our Services
            </h2>
            <p className="text-gray-500 mt-3 text-lg max-w-2xl">
              Explore premium mobility solutions tailored for comfort,
              convenience, and sustainability.
            </p>
          </div>
        </div>

        {/* Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((s) => {
            const Icon = s.icon;

            return (
              <div
                key={s.title}
                className={`relative bg-white rounded-2xl overflow-hidden shadow-sm
                hover:shadow-2xl hover:-translate-y-2 cursor-pointer
                transition-all duration-500`}
              >
                {/* Image */}
                <div className="relative h-52 overflow-hidden">
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                </div>

                {/* Icon */}
                <div
                  className={`absolute top-44 right-6 z-10 w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg ring-4 ring-white
                  hover:rotate-[360deg] transition-transform duration-500`}
                >
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Content */}
                <div className="p-7 pt-10">
                  <h3 className="font-bold text-xl mb-3 text-gray-900">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Services;