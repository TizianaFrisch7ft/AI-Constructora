import { Request, Response } from "express";
import { getMongoWriteOp, WriteOp } from "../services/openaiService";
import { executeDynamicWrite } from "../services/mongoWriteService";

const NEEDS_FILTER = new Set([
  "updateOne",
  "updateMany",
  "deleteOne",
  "deleteMany",
]);

const hasFilter = (op: WriteOp): op is Extract<WriteOp, { filter: any }> =>
  "filter" in op;

/** ✅ Controlador para manejar instrucciones de escritura */
export const handleWrite = async (req: Request, res: Response) => {
  const { instruction, confirm = false } = req.body ?? {};

  if (!instruction || typeof instruction !== "string") {
    return res
      .status(400)
      .json({ error: "Falta o es inválido el campo 'instruction'" });
  }

  try {
    const op = await getMongoWriteOp(instruction.trim());

    // ⚠️ Si no devuelve una operación válida
    if (!op || typeof op !== "object" || !("action" in op)) {
      return res.status(400).json({
        error: "Respuesta inválida de OpenAI. No se pudo generar una operación válida.",
        plan: op,
      });
    }

    // 🟡 Caso explícito de no-escritura
    if (op.action === "none") {
      return res.json({
        info: "No detecté intención de escritura",
        plan: op,
      });
    }

    // ❌ Falta información clave
    if (!op.collection || !op.action) {
      return res
        .status(400)
        .json({ error: "Operación incompleta (falta colección o acción)", plan: op });
    }

    // ❌ update/delete sin filtro válido
    if (
      NEEDS_FILTER.has(op.action) &&
      (!hasFilter(op) || !op.filter || Object.keys(op.filter).length === 0)
    ) {
      return res.status(400).json({
        error: "update/delete requieren 'filter' no vacío",
        plan: op,
      });
    }

    // 🟡 Mostrar preview sin ejecutar
    if (!confirm) {
      return res.json({
        info: "Previsualización de la operación. Envía confirm=true para ejecutar.",
        plan: op,
      });
    }

    // ✅ Ejecutar
    const result = await executeDynamicWrite(instruction, op);
    return res.json({ ok: true, plan: op, result });

  } catch (err: any) {
    console.error("❌ Error al procesar escritura:", err);
    return res
      .status(500)
      .json({ error: err.message || "Error interno inesperado" });
  }
};
