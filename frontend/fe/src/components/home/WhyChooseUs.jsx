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
    title: "Premium Coverage",
    desc: "Comprehensive insurance is included with every rental contract.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    desc: "Our customer care team is always available whenever you need help.",
  },
  {
    icon: BadgeCheck,
    title: "Certified Quality",
    desc: "Every vehicle passes a strict 50-point inspection before delivery.",
  },
  {
    icon: MapPin,
    title: "Doorstep Delivery",
    desc: "We deliver your vehicle directly to your home or workplace.",
  },
];

const WhyChooseUs = () => {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col lg:flex-row gap-20 items-start">

          {/* Left: visual composition */}
          <div className="relative lg:w-1/2 w-full">
            {/* Main image with stylized frame */}
            <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500">
              <img
                src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=1000"
                alt="LuxeDrive Experience"
                className="w-full h-[550px] object-cover"
              />
              {/* Soft overlay */}
              <div className="absolute inset-0 bg-blue-900/10" />
            </div>

            {/* Floating testimonial card */}
            <motion.div
              initial={{ x: 50, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              className="absolute -bottom-10 -right-6 lg:-right-10 z-20 bg-gray-900 text-white p-8 rounded-2xl shadow-2xl max-w-[320px]"
            >
              <div className="flex gap-1 text-blue-400 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
              </div>
              <p className="text-sm italic leading-relaxed mb-6 text-gray-300">
                "The chauffeur service was flawless. Always on time, highly professional, and the car felt brand new."
              </p>
              <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">
                  S
                </div>
                <div>
                  <p className="text-sm font-bold">Thanh Hang</p>
                  <p className="text-[10px] text-blue-400 uppercase tracking-widest">CEO, TechVina</p>
                </div>
              </div>
            </motion.div>

            {/* Decorative backdrop */}
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-50 rounded-full -z-0" />
          </div>

          {/* Right: content */}
          <div className="lg:w-1/2 w-full pt-10">
            <p className="text-blue-600 font-bold tracking-[0.3em] text-xs uppercase mb-4">
              Why choose us?
            </p>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-8 leading-tight uppercase">
              Redefining <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
                Luxury Mobility
              </span>
            </h2>

            <p className="text-gray-500 mb-12 text-lg leading-relaxed">
              LuxeDrive is more than a car rental service. We deliver a
              worry-free mobility experience with 5-star standards.
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