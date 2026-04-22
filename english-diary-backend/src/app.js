import express from "express";
import cors from "cors";

import { authRoutes } from "./routes/authRoutes.js";
import { diaryRoutes } from "./routes/diaryRoutes.js";

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  }),
);
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Bloom Journal API is running...");
});

app.use("/api/auth", authRoutes);
app.use("/api/diary", diaryRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  console.error("Unhandled error:", error);
  res.status(500).json({ error: error.message || "Internal server error" });
});

export { app };
