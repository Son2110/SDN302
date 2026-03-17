import { motion } from "framer-motion";
import { Car } from "lucide-react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image and Text */}
      <div className="hidden lg:flex lg:w-1/2 bg-linear-to-br from-gray-900 via-gray-800 to-black relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1664&q=80')] bg-cover bg-center opacity-40"></div>
        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="mb-8">
              <h1 className="text-5xl font-bold mb-4">
                Unlock <br />
                <span className="text-blue-500">Something Exceptional.</span>
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                Begin a transformative journey on unexplored roads. Discover
                limitless horizons and set your direction with confidence. Your
                next chapter starts here.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>© 2026 LuxeDrive</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-white">
        <div className="w-full max-w-md">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Logo */}
            <div className="flex items-center gap-2 mb-8">
              <Car className="w-8 h-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-800">LUXEDRIVE</span>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">{title}</h2>
              {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>}
            </div>

            {/* Form Content */}
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
