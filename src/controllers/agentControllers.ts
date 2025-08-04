import { Request, Response } from "express";
import { getMongoQuery, getNaturalAnswer } from "../services/openaiService";
import { executeDynamicQuery } from "../services/mongoReadService";
import { getSmartAnswer } from "../services/smartAnswerService";
import { getSmartAnswerWithWrite } from "../services/getSmartAnswerSmartWrite"; // ✅ nuevo
import { getSmartAnswerWithWriteUnified } from "../services/getSmartAnswerSmartWrite";

 /** Verifica si hay datos reales en la respuesta */
 const hasData = (d: any): boolean => {
  if (Array.isArray(d)) return d.some(hasData);
  if (d && typeof d === "object") return Object.keys(d).length > 0;
  return !!d;
};

export const handleAsk = async (req: Request, res: Response) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Falta la pregunta válida." });
  }

  try {
    const cleanQuestion = question.trim();

    const plan = await getMongoQuery(cleanQuestion);
    if (process.env.NODE_ENV === "development") {
      console.log("🧠 Plan generado:", JSON.stringify(plan, null, 2));
    }

    const data = await executeDynamicQuery(plan);

    if (process.env.NODE_ENV === "development") {
      console.log("📦 Data obtenida:", JSON.stringify(data, null, 2));
    }

    const answer = await getNaturalAnswer(cleanQuestion, data);

    return res.json({
      success: true,
      answer: answer?.trim() || "No se pudo generar una respuesta.",
      plan,
    });
  } catch (err: any) {
    console.error("❌ Error en /ask:", err);
    return res.status(500).json({
      error: err.message || "Error interno del servidor.",
    });
  }
};

// ✅ Smart agent SOLO lectura
export const handleSmartAsk = async (req: Request, res: Response) => {
  const { question } = req.body;

  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Falta la pregunta válida." });
  }

  try {
    const cleanQuestion = question.trim();
    const { answer, entities } = await getSmartAnswer(cleanQuestion);

    const result: any = {
      answer,
      entities,
    };

    // 🔍 Normalizar pregunta para evaluar intención
    const questionLower = cleanQuestion.toLowerCase();

    const shouldSendReminder =
      questionLower.includes("pm") &&
      (
        questionLower.includes("no entreg") ||
        questionLower.includes("no pas") ||
        questionLower.includes("falt") ||
        questionLower.includes("termin") ||
        questionLower.includes("incumpl")
      ) &&
      questionLower.includes("cotiz");

    if (shouldSendReminder) {
      const pmEntities = entities.filter(e => e.type === 'PM' && e.email);

      const reminderRecipients = pmEntities.map(e => ({
        name: e.name,
        email: e.email,
      }));

      result.offerReminder = true;
      result.reminderRecipients = reminderRecipients;

      // Podés reemplazar esta parte si tenés una lógica real para obtener el RFQ activo
      result.rfqId = "664f19a02ab2235d3f91c44a";
    }

    return res.json(result);
  } catch (err: any) {
    console.error("❌ Error en /ask/smart:", err);
    return res.status(500).json({
      error: err.message || "Error interno del servidor.",
    });
  }
};

// ✅ Smart agent LECTURA o ESCRITURA
export const handleSmartAskWithWrite = async (req: Request, res: Response) => {
  const { question, confirm } = req.body;
// prueba de commit Tizi - 26/07
  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Falta la pregunta válida." });
  }

  try {
    const cleanQuestion = question.trim();
    const result = await getSmartAnswerWithWrite(cleanQuestion, confirm);

    return res.json({
      success: true,
      agent: "SmartAgent+Write",
      answer: result.answer,
      entities: result.entities || [],
    });
  } catch (err: any) {
    console.error("❌ Error en /ask/smart-write:", err);
    return res.status(500).json({
      error: err.message || "Error interno del servidor.",
    });
  }
};

export const handleSmartTransactional = async (req: Request, res: Response) => {
  console.log("[handleSmartTransactional] POST /ask/smart-transactional called");
  console.log("Body:", req.body);
  const { message, context, confirm } = req.body;
  if (!message || typeof message !== "string" || message.trim() === "") {
    console.warn("[handleSmartTransactional] Falta el mensaje válido");
    return res.status(400).json({ error: "Falta el mensaje válido." });
  }
  try {
    const result = await getSmartAnswerWithWriteUnified(message, context, confirm);
    console.log("[handleSmartTransactional] Respuesta:", result);
    return res.json(result);
  } catch (err: any) {
    console.error("❌ Error en /smart-transactional:", err);
    return res.status(500).json({ error: err.message || "Error interno del servidor." });
  }
};
