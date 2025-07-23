// src/controllers/agentControllers.ts
import { Request, Response } from "express";
import { getMongoQuery, getNaturalAnswer } from "../services/openaiService";
import { executeDynamicQuery } from "../services/mongoReadService";

/** Chequea si hay algún dato real dentro del resultado (arrays anidados, objetos, etc.) */
const hasData = (d: any): boolean => {
  if (Array.isArray(d)) return d.some(hasData);
  if (d && typeof d === "object") return Object.keys(d).length > 0;
  return !!d;
};

export const handleAsk = async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Falta la pregunta" });

  try {
    const plan = await getMongoQuery(question.trim());
    console.log("👉 Plan generado:", JSON.stringify(plan, null, 2));

    const data = await executeDynamicQuery(plan);
    console.log("👉 Resultados:", JSON.stringify(data, null, 2));

    let answer: string;

    if (!hasData(data)) {
      answer = "No se encontraron resultados para esa consulta.";
    } else {
      answer = await getNaturalAnswer(question, data);

      // Por si el LLM insiste con “no se encontraron” teniendo data
      if (/no se encontraron/i.test(answer) && hasData(data)) {
        answer =
          "Se encontraron estos resultados y los presento a continuación:\n" +
          JSON.stringify(data, null, 2);
      }
    }

    res.json({ answer, plan, data });
  } catch (err: any) {
    console.error("❌ Error /ask:", err);
    res.status(500).json({ error: err.message });
  }
};
