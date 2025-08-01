import express from "express";
import Vendor from "../models/Vendor";

const router = express.Router();

// GET /api/vendors
router.get("/vendors", async (_req, res) => {
  try {
    const vendors = await Vendor.find();
    res.json(vendors);
  } catch (error) {
    console.error("Error al obtener proveedores:", error);
    res.status(500).json({ message: "Error al obtener proveedores" });
  }
});

export default router;
