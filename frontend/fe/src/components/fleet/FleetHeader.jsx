const FleetHeader = () => {
  return (
    <div className="mb-12">
      <p className="text-xs tracking-[0.4em] text-blue-600 font-bold uppercase mb-3">
        VinFast Fleet
      </p>
      <h1 className="text-3xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight">
        Explore Our <span className="text-blue-600">Premium</span> Fleet
      </h1>

      <p className="max-w-2xl text-gray-500 text-lg leading-relaxed">
        Choose from VinFast's exclusive electric vehicle collection. Whether
        you need chauffeur service or a self-drive experience, we have the
        perfect vehicle for you.
      </p>
      <div className="w-20 h-1.5 bg-blue-600 mt-6 rounded-full" />
    </div>
  );
};

export default FleetHeader;