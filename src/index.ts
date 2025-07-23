import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import agentRoutes from "./routes/agentRoutes";
import writeRoutes from "./routes/writeRoutes";

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
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const MONGO_URI = process.env.MONGO_URI || "";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Conectado a MongoDB"))
  .catch((err) => {
    console.error("❌ Error de conexión a Mongo:", err);
    process.exit(1);
  });

app.use("/ask", agentRoutes);
app.use("/write", writeRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Backend levantado en http://localhost:${PORT}`);
});


