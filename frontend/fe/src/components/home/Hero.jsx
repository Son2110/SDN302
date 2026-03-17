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

      {/* Soft overlay + vignette */}
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
            Premium Electric Vehicles 2025
          </span>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: "easeOut" }}
          className="font-display text-[42px] md:text-[80px] font-extrabold uppercase leading-[1.2] md:leading-[1.1] mb-8"
        >
          Experience <br />
          <span className="text-blue-500 text-[38px] md:text-[72px]">
            A New Standard
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.25, ease: "easeOut" }}
          className="max-w-lg text-gray-300 text-sm md:text-base leading-relaxed mb-10"
        >
          Discover the silent power of world-class electric vehicles. Whether
          you choose a premium chauffeur service or drive yourself, we deliver
          a smarter and more sustainable journey.
        </motion.p>

        {/* Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
          className="flex flex-wrap gap-4"
        >
        </motion.div>
      </div>
    </header>
  );
};

export default Hero;
