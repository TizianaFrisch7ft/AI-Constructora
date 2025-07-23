import { Request, Response } from "express";
import { getMongoWriteOp, WriteOp } from "../services/openaiService";
import { executeDynamicWrite } from "../services/mongoWriteService";

const NEEDS_FILTER = new Set(["updateOne", "updateMany", "deleteOne", "deleteMany"]);
const hasFilter = (op: WriteOp): op is Extract<WriteOp, { filter: any }> => "filter" in op;

export const handleWrite = async (req: Request, res: Response) => {
  const { instruction, confirm = false } = req.body ?? {};
  if (!instruction) return res.status(400).json({ error: "Falta 'instruction'" });

  try {
    const op = await getMongoWriteOp(instruction.trim());

    if (!op || op.action === "none") {
      return res.json({ info: "No detecté intención de escritura", plan: op });
    }

    if (!op.collection || !op.action) {
      return res.status(400).json({ error: "Operación incompleta", plan: op });
    }

    if (NEEDS_FILTER.has(op.action) && (!hasFilter(op) || !op.filter || Object.keys(op.filter).length === 0)) {
      return res.status(400).json({ error: "update/delete requieren 'filter' no vacío", plan: op });
    }

    if (!confirm) {
      return res.json({
        info: "Previsualización de la operación. Envía confirm=true para ejecutar.",
        plan: op,
      });
    }

    const result = await executeDynamicWrite(instruction, op);
    res.json({ ok: true, plan: op, result });
  } catch (err: any) {
    console.error("❌ Error write:", err);
    res.status(500).json({ error: err.message || "Error interno" });
  }
};
