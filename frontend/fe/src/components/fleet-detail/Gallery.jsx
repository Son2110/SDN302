const images = [
  "/cars/sclass/main.jpg",
  "/cars/sclass/1.jpg",
  "/cars/sclass/2.jpg",
  "/cars/sclass/3.jpg",
];

const Gallery = () => {
  return (
    <div>
      <div className="relative rounded-xl overflow-hidden">
        <img
          src={images[0]}
          className="w-full h-[420px] object-cover"
          alt="car"
        />
        <span className="absolute top-4 right-4 bg-black/60 text-white text-xs px-3 py-1 rounded">
          Luxury Class
        </span>
      </div>

      <div className="grid grid-cols-4 gap-4 mt-4">
        {images.slice(1).map((img, i) => (
          <img
            key={i}
            src={img}
            className="h-24 w-full object-cover rounded-lg cursor-pointer hover:opacity-80"
            alt=""
          />
        ))}
      </div>
    </div>
  );
};

export default Gallery;
