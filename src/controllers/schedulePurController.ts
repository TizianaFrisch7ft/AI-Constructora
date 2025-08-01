import { Request, Response } from "express";
import SchedulePur from "../models/SchedulePur";
import Project from "../models/Project";
import PM from "../models/PM";

/** Crear un nuevo cronograma de compras */
export const createSchedulePur = async (req: Request, res: Response) => {
  try {
    const { cc_id, description, project_id, pm_id, date, status, comments } = req.body;

    if (!cc_id || !description || !project_id || !pm_id || !date || !status) {
      return res.status(400).json({ error: "Faltan campos obligatorios." });
    }

    const schedule = await SchedulePur.create({
      cc_id,
      description,
      project_id,
      pm_id,
      date,
      status,
      comments,
    });

    return res.status(201).json({ success: true, schedule });
  } catch (err: any) {
    console.error("❌ Error al crear cronograma:", err);
    return res.status(500).json({ error: "Error interno del servidor." });
  }
};

/** Obtener lista de proyectos disponibles */
export const getAvailableProjects = async (_req: Request, res: Response) => {
  try {
    const rawProjects = await Project.find().lean();
    const projects = rawProjects.map((p) => ({
      id: p._id.toString(),
      name: p.name,
    }));
    return res.json({ success: true, projects });
  } catch (err: any) {
    console.error("❌ Error al obtener proyectos:", err);
    return res.status(500).json({ error: "Error al obtener proyectos." });
  }
};

/** Obtener lista de PMs disponibles */
export const getAvailablePMs = async (_req: Request, res: Response) => {
  try {
    const pms = await PM.find().lean();
    const formatted = pms.map((pm) => ({
      id: pm._id.toString(),
      fullName: `${pm.name} ${pm.surname}`,
    }));
    return res.json({ success: true, pms: formatted });
  } catch (err: any) {
    console.error("❌ Error al obtener PMs:", err);
    return res.status(500).json({ error: "Error al obtener PMs." });
  }
};

/** Obtener todos los cronogramas */
export const getAllSchedules = async (_req: Request, res: Response) => {
  try {
    const schedules = await SchedulePur.find().lean();
    const mapped = schedules.map((s) => ({
      ...s,
      _id: s._id.toString(),
    }));
    return res.json({ success: true, schedules: mapped });
  } catch (err: any) {
    console.error("❌ Error al obtener cronogramas:", err);
    return res.status(500).json({ error: "Error al obtener cronogramas." });
  }
};

/** Actualizar un cronograma existente */
export const updateSchedulePur = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { description, project_id, pm_id, date, status, comments } = req.body;

    const updated = await SchedulePur.findByIdAndUpdate(
      id,
      { description, project_id, pm_id, date, status, comments },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: "Cronograma no encontrado." });

    return res.json({ success: true, schedule: updated });
  } catch (err: any) {
    console.error("❌ Error al actualizar cronograma:", err);
    return res.status(500).json({ error: "Error al actualizar cronograma." });
  }
};

// GET /api/schedules/active/count
export const getActiveSchedulesCount = async (_req: Request, res: Response) => {
  try {
    const count = await SchedulePur.countDocuments({ status: { $ne: "Close" } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ error: "Error getting active schedules count" });
  }
};
