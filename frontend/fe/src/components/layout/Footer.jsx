import { Car, Facebook, Instagram, Youtube, Mail, MapPin, Phone } from "lucide-react";

const Footer = () => {
  return (
    // Use white background to contrast against the page surface.
    <footer className="bg-white text-gray-900 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">

          {/* Column 1: Brand */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-20 h-20 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
                <img
                  src="/logo.png"
                  alt="LuxeDrive Logo"
                  className="h-20 w-auto object-contain"
                />
              </div>
              <span className="font-black tracking-[0.2em] text-xl uppercase text-gray-900">
                LUXEDRIVE
              </span>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              Redefining premium mobility. Whether you drive yourself or choose
              a chauffeur, we deliver a refined and distinctive journey.
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

          {/* Column 2: Company */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-blue-600">
              Company
            </h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              {["About Us", "Drivers", "News", "Careers", "Partners"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-blue-600 hover:translate-x-2 transition-all inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Services */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-blue-600">
              Services
            </h4>
            <ul className="space-y-4 text-sm text-gray-500 font-medium">
              {["Self-Drive Rental", "Chauffeur Service", "Airport Transfer", "Events & Weddings", "Long-Term Plans"].map((item) => (
                <li key={item}>
                  <a href="#" className="hover:text-blue-600 hover:translate-x-2 transition-all inline-block">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-[0.2em] mb-8 text-blue-600">
              Contact
            </h4>
            <div className="space-y-5 text-sm text-gray-500 font-medium">
              <div className="flex items-start gap-4 group">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
                <p className="group-hover:text-gray-900 transition-colors">123 Luxury Street, District 1, Ho Chi Minh City</p>
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

      {/* Bottom bar */}
      <div className="border-t border-gray-100 py-8 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[11px] text-gray-400 font-bold tracking-widest uppercase">
            © 2026 LUXEDRIVE INC. ALL RIGHTS RESERVED.
          </p>

          <div className="flex gap-8 text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            <a href="#" className="hover:text-blue-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;