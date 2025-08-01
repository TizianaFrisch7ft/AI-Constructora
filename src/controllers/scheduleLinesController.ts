import SchedulePurLine from "../models/SchedulePurLine";
import { Request, Response } from "express";

export const getAllSchedulePurLines = async (req: Request, res: Response) => {
  try {
    const lines = await SchedulePurLine.find();
    res.json(lines); // 👈 responde directamente el array, sin `{ success: true }`
  } catch (err) {
    console.error("Error trayendo líneas:", err);
    res.status(500).json({ error: "Error cargando líneas" });
  }
};
