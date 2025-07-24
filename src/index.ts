import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import agentRoutes from "./routes/agentRoutes";
import writeRoutes from "./routes/writeRoutes";

// importa tus modelos para inicializarlos
import "./models/Project";
import "./models/Vendor";
import "./models/VendorEval";
import "./models/VendorEvalLine";
import "./models/PreselectVendor";
import "./models/ProjectVendor";
import "./models/Quote";
import "./models/QuoteLine";

dotenv.config();

const app = express();

// CORS apuntando a tu front en Vercel
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "*",
  })
);
app.use(express.json());

// Health‑check
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

const MONGO_URI = process.env.MONGO_URI!;
mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error de conexión a Mongo:", err);
    process.exit(1);
  });

// tus rutas
app.use("/ask", agentRoutes);
app.use("/write", writeRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
