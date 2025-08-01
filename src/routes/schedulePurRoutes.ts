import express from "express";
import {
  createSchedulePur,
  getAvailableProjects,
  updateSchedulePur,
  getActiveSchedulesCount,
  getAllSchedules, // 👈 nuevo
} from "../controllers/schedulePurController";

const router = express.Router();

router.post("/schedules", createSchedulePur);
router.get("/projects", getAvailableProjects);
router.put("/schedules/:id", updateSchedulePur);
router.get("/schedules/active/count", getActiveSchedulesCount);
router.get("/schedules", getAllSchedules); // 👈 nuevo endpoint
router.get("/pms", async (_req, res) => {
  try {
    const pms = await import("../models/PM").then((mod) => mod.default.find());
    const result = pms.map((pm: any) => ({
      id: pm.id,
      fullName: `${pm.name} ${pm.surname}`,
    }));
    return res.json({ success: true, pms: result });
  } catch (error) {
    console.error("❌ Error al obtener PMs:", error);
    return res.status(500).json({ error: "Error al obtener PMs." });
  }
});

export default router;
