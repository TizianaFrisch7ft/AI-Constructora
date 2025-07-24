// src/controllers/agentControllers.ts
import { Request, Response } from "express";
import { getMongoQuery, getNaturalAnswer } from "../services/openaiService";
import { executeDynamicQuery } from "../services/mongoReadService";
import { alignTableRows } from "../utils/tableFormatter";

/** Verifica si hay datos reales en la respuesta */
const hasData = (d: any): boolean => {
  if (Array.isArray(d)) return d.some(hasData);
  if (d && typeof d === "object") return Object.keys(d).length > 0;
  return !!d;
};

export const handleAsk = async (req: Request, res: Response) => {
  const { question } = req.body;

  // Validación estricta de input
  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Falta la pregunta válida." });
  }

  try {
    const plan = await getMongoQuery(question.trim());
    console.log("🧠 Plan generado:", JSON.stringify(plan, null, 2));

    const data = await executeDynamicQuery(plan);
    const dataSummary = Array.isArray(data) ? `${data.length} resultados` : typeof data;
    console.log("📦 Resultados:", dataSummary);

    let answer: string;
    const validData = hasData(data);

    if (!validData) {
      answer = "No se encontraron resultados para esa consulta. Desea ayuda con algo más?";
    } else {
      answer = await getNaturalAnswer(question, data);

      // Corrección si el LLM responde erróneamente “no se encontró”
      if (/no se encontraron/i.test(answer)) {
        answer =
          "Se encontraron estos resultados y los presento a continuación:\n" +
          JSON.stringify(data, null, 2);
      }
    }

    const table = Array.isArray(data) && data.length > 0 ? alignTableRows(data) : null;

    return res.json({
      success: true,
      answer,
      plan,
      data,
      table,
    });
  } catch (err: any) {
    console.error("❌ Error en /ask:", err);
    return res.status(500).json({ error: err.message || "Error interno del servidor." });
  }
};
