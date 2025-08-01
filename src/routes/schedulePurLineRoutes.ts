import express from "express";
import SchedulePurLine from "../models/SchedulePurLine";
import { getAllSchedulePurLines } from "../controllers/schedulePurLineController";
const router = express.Router();

/**
 * GET /api/schedule-lines/:cc_id
 * Devuelve todas las líneas asociadas a un SchedulePur por ID
 */
router.get("/:cc_id", async (req, res) => {
  try {
    const lines = await SchedulePurLine.find({ cc_id: req.params.cc_id });
    res.json({ success: true, lines });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Error fetching lines" });
  }
});

/**
 * POST /api/schedule-lines/:cc_id
 * Guarda (reemplaza) todas las líneas para un SchedulePur
 */
router.post("/:cc_id", async (req, res) => {
  const { lines } = req.body;

  if (!Array.isArray(lines)) {
    return res.status(400).json({ success: false, error: "Lines must be an array" });
  }

  try {
    console.log("🧾 Recibido lines:", lines);
    const cc_id = req.params.cc_id.trim();

    await SchedulePurLine.deleteMany({ cc_id });

    const preparedLines = lines.map((line, idx) => ({
      ...line,
      cc_id,
      line_no: idx + 1,
    }));

    console.log("📦 Insertando lines:", preparedLines);

    const newLines = await SchedulePurLine.insertMany(preparedLines);

    res.json({ success: true, lines: newLines });
  } catch (err: any) {
    console.error("❌ Error al guardar líneas:", err);
    res.status(500).json({ success: false, error: "Error saving lines", details: err.message });
  }
});

/**
 * GET /api/schedule-lines/all
 * Devuelve todas las líneas
 */
router.get("/", getAllSchedulePurLines);

export default router;