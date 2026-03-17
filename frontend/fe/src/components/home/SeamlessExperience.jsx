import { Car, CalendarCheck, Key } from "lucide-react";

const steps = [
  {
    id: "01",
    title: "Choose Your Vehicle",
    desc: "Browse a diverse electric fleet, from powerful SUVs to refined sedans for every need.",
    icon: Car,
  },
  {
    id: "02",
    title: "Book Online",
    desc: "Use our secure booking flow to choose self-drive or add a professional chauffeur in a few clicks.",
    icon: CalendarCheck,
  },
  {
    id: "03",
    title: "Ready To Go",
    desc: "Pick up at our showroom or request doorstep delivery and start your premium trip right away.",
    icon: Key,
  },
];

const SeamlessExperience = () => {
  return (
    <section className="py-24 bg-[#F9FAFB] relative overflow-hidden">
      {/* Subtle dotted background effect */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.03)_1px,transparent_0)] bg-[size:32px_32px]" />

      {/* Soft blue ambient glow */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-400/5 rounded-full blur-[120px]" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-400/5 rounded-full blur-[120px]" />

      <div className="relative max-w-7xl mx-auto px-6">
        {/* Title */}
        <div className="text-center mb-20">
          <p className="text-xs tracking-[0.4em] text-blue-600 font-bold uppercase mb-4">
            Simple process
          </p>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 uppercase tracking-tight">
            Seamless <span className="text-blue-600 underline underline-offset-8 decoration-2">Experience</span>
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
                {/* Step index */}
                <span className="absolute top-8 right-10 text-6xl font-black text-gray-100 group-hover:text-blue-500/10 transition-colors duration-500">
                  {step.id}
                </span>

                {/* Icon with glow effect */}
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-8 group-hover:bg-blue-600 group-hover:shadow-[0_10px_20px_rgba(37,99,235,0.3)] transition-all duration-500">
                  <Icon className="w-7 h-7 text-blue-600 group-hover:text-white transition-colors" />
                </div>

                {/* Content */}
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