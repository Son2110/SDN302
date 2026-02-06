import { motion } from "framer-motion";

const Hero = () => {
  return (
    <header className="relative h-screen w-full flex flex-col justify-center overflow-hidden">
      {/* VIDEO background */}
      <video
        className="absolute inset-0 w-full h-full object-cover scale-[1.03]"
        src="/hero-video.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay mềm + vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />
      <div className="absolute inset-0 bg-black/20" />

      {/* Content */}
      <div className="relative z-10 px-8 md:px-16 lg:px-24 text-white">
        {/* Label */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="flex items-center gap-3 mb-5"
        >
          <span className="w-10 h-[1px] bg-blue-500" />
          <span className="text-xs tracking-[0.35em] text-blue-400 uppercase">
            Xe Điện Cao Cấp 2025
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
          // Mình đã chỉnh leading-[1.2] cho mobile và md:leading-[1.1] cho desktop
          className="font-display text-[42px] md:text-[80px] font-extrabold uppercase leading-[1.2] md:leading-[1.1] mb-8"
        >
          Trải Nghiệm <br />
          <span className="text-blue-500 text-[38px] md:text-[72px]">
            Đẳng Cấp Mới
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: "easeOut" }}
          className="max-w-lg text-gray-300 text-sm md:text-base leading-relaxed mb-10"
        >
          Khám phá sức mạnh tĩnh lặng từ những dòng xe điện hàng đầu. Dù bạn
          chọn dịch vụ đưa đón sang trọng hay tự mình cầm lái — chúng tôi mang
          đến hành trình thông minh và bền vững hơn.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="flex flex-wrap gap-4"
        >
          <button className="border rounded-full border-white/30 px-8 py-4 uppercase text-[11px] font-bold tracking-widest backdrop-blur-md hover:bg-white hover:text-black hover:scale-105 transition-all duration-300">
            Dịch vụ đưa đón
          </button>

          <button className="border rounded-full border-white/30 px-8 py-4 uppercase text-[11px] font-bold tracking-widest backdrop-blur-md hover:bg-white hover:text-black hover:scale-105 transition-all duration-300">
            Trải nghiệm lái
          </button>
        </motion.div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/50 text-[10px] uppercase tracking-[0.3em] flex flex-col items-center gap-2"
      >
        <span>Cuộn để khám phá</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-[1px] h-8 bg-blue-500/50"
        />
      </motion.div>
    </header>
  );
};

export default Hero;
