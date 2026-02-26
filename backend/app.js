import express from "express";
import cors from "cors";
import authRouter from "./routes/authRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import paymentRouter from "./routes/paymentRoutes.js";
import driverAssignmentRouter from "./routes/driverAssignmentRoutes.js";
const app = express();

//middleware
app.use(cors());
app.use(express.json());

//api
app.use("/api/auth", authRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/payments", paymentRouter);
app.use("/api/driver-assignment", driverAssignmentRouter);

app.get("/", (req, res) => {
  res.send("App is working");
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found URL" });
});

export default app;
