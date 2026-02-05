import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//auth
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("App is working");
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found URL" });
});

export default app;
