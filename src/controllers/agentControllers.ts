// src/controllers/askController.ts
import { Request, Response } from "express";
import { getMongoQuery, getNaturalAnswer } from "../services/openaiService";
import { executeDynamicQuery } from "../services/mongoReadService";
import { getSmartAnswer } from "../services/smartAnswerService";
import { getSmartAnswerWithWrite } from "../services/getSmartAnswerSmartWrite";
import { generateQuoteRequests } from "./quoteRequestController";

/** Verifica si hay datos reales en la respuesta (por si querés usarlo en el futuro) */
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
    const { answer, entities, offerQuoteCreation, linesToQuote } = await getSmartAnswer(cleanQuestion);

    const result: any = {
      answer,
      entities,               // ⚠️ se envían tal cual (incluyen id + name si el servicio los arma)
      offerQuoteCreation,
      linesToQuote,
    };

    // Heurística simple para sugerir recordatorios a PMs
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
      const pmEntities = (entities || []).filter((e: any) => e.type === "PM" && e.email);
      const reminderRecipients = pmEntities.map((e: any) => ({
        name: e.name,
        email: e.email,
      }));

      result.offerReminder = reminderRecipients.length > 0;
      result.reminderRecipients = reminderRecipients;
      result.rfqId = "664f19a02ab2235d3f91c44a"; // placeholder (reemplazar cuando tengas el id real)
    }

    return res.json(result);
  } catch (err: any) {
    console.error("❌ Error en /ask/smart:", err);
    return res.status(500).json({
      error: err.message || "Error interno del servidor.",
    });
  }
};

// Interfaz para las líneas recibidas desde el front/agente
interface QuoteRequestLineInput {
  _id?: string;
  cc_id: string;
  line_no: number;
  qty: number;
  um: string;
  reference?: string;
  reference_price?: number;
  currency?: string;
  desired_date?: string | Date;
  project_id?: string;
  vendor_list?: string[];
  product_id?: string;
  [key: string]: any;
}

export const createQuotesFromAgent = async (req: Request, res: Response) => {
  console.log("🔍 createQuotesFromAgent llamado");
  console.log("📦 Body recibido:", JSON.stringify(req.body, null, 2));

  let selectedLines: QuoteRequestLineInput[] = Array.isArray(req.body.linesToQuote)
    ? req.body.linesToQuote
    : [];

  // Normalizar datos mínimos y asegurar vendor_list como array
  selectedLines = selectedLines.map((line) => {
    const product_id = line.product_id
      ? String(line.product_id).trim()
      : (line.reference || `ITEM_${line.line_no}`).toUpperCase().replace(/\s+/g, "_");

    const vendor_list = Array.isArray(line.vendor_list) ? line.vendor_list : [];

    return { ...line, product_id, vendor_list };
  });

  // Filtrar líneas sin vendors
  selectedLines = selectedLines.filter((line) => (line.vendor_list ?? []).length > 0);

  if (selectedLines.length === 0) {
    return res.status(400).json({
      success: false,
      message: "No hay líneas válidas con vendors para crear cotizaciones.",
    });
  }

  req.body.selectedLines = selectedLines;

  try {
    return await generateQuoteRequests(req, res);
  } catch (err: any) {
    console.error("❌ Error en generateQuoteRequests:", err);
    return res.status(500).json({
      success: false,
      message: err?.message || "Error al generar cotizaciones.",
    });
  }
};

// ✅ Smart agent LECTURA o ESCRITURA (slot-filling compatible)
export const handleSmartAskWithWrite = async (req: Request, res: Response) => {
  const { question, confirm, conversationId, userProvided } = req.body;

  if (!question || typeof question !== "string" || question.trim() === "") {
    return res.status(400).json({ error: "Falta la pregunta válida." });
  }

  try {
    const cleanQuestion = question.trim();
    const result = await getSmartAnswerWithWrite(
      cleanQuestion,
      Boolean(confirm),
      conversationId,
      userProvided || {}
    );

    // 🔁 Propagamos nextAction y missingFields para el front transaccional
    return res.json({
      success: true,
      agent: "SmartAgent+Write",
      answer: result.answer,
      entities: result.entities || [],
      nextAction: result.nextAction || "none",
      missingFields: result.missingFields || [],
    });
  } catch (err: any) {
    console.error("❌ Error en /ask/smart-write:", err);
    return res.status(500).json({
      error: err.message || "Error interno del servidor.",
    });
  }
};

// Conversational (transactional) con conversationId
export const handleSmartTransactional = async (req: Request, res: Response) => {
  console.log("[handleSmartTransactional] POST /ask/smart-transactional called");
  const { message, confirm, conversationId, userProvided } = req.body;

  if (!message || typeof message !== "string" || message.trim() === "") {
    return res.status(400).json({ error: "Falta el mensaje válido." });
  }

  try {
    const result = await getSmartAnswerWithWrite(
      message.trim(),
      Boolean(confirm),
      conversationId,        // <-- clave para slot-filling
      userProvided || {}     // <-- payload incremental
    );
    return res.json(result);
  } catch (err: any) {
    console.error("❌ Error en /smart-transactional:", err);
    return res.status(500).json({ error: err.message || "Error interno del servidor." });
  }
};
