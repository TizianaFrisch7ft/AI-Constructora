import { Request, Response } from "express";
import { getMongoQuery, getNaturalAnswer } from "../services/openaiService";
import { executeDynamicQuery } from "../services/mongoQueryService";

export const handleAsk = async (req: Request, res: Response) => {
  const { question } = req.body;
  if (!question) return res.status(400).json({ error: "Falta la pregunta" });

try {
  const mongoQuery = await getMongoQuery(question);
  console.log("👉 Query generada:", mongoQuery);

  const results = await executeDynamicQuery(mongoQuery);
  console.log("👉 Resultados:", results);

  const respuestaNatural = await getNaturalAnswer(question, results);
  res.json({ answer: respuestaNatural });
} catch (error: any) {
  console.error("❌ Error:", error.message);
  res.status(500).json({ error: error.message });
}

};