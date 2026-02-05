import express from "express";
import cors from "cors";

const app = express();

//middleware
app.use(cors());
app.use(express.json());

//routes

app.get("/", (req, res) => {
  res.send("API is working");
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: "Not found URL" });
});

export default app;
