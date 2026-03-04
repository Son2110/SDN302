import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/db.js";
import { seedData } from "./seed.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
connectDB().then(() => {
  seedData();
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

