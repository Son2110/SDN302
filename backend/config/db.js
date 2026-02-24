import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URL);
    // conn.connection.host giúp ta biết đang nối vào DB nào (localhost hay atlas)
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Lỗi DB thì tắt server luôn
  }
};

export default connectDB;
