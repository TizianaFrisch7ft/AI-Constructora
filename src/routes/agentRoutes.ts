import express from "express";
import {
  handleAsk,
  handleSmartAsk,
  handleSmartAskWithWrite,
  handleSmartTransactional,
  createQuotesFromAgent, // ✅ nuevo
   // ⬅ nuevo import
} from "../controllers/agentControllers";
import { sendReminder } from "../controllers/sendReminderController";

const router = express.Router();

// 🔍 Lectura normal
router.post("/ask", handleAsk);

// 🤖 Lectura inteligente con respuesta natural
router.post("/ask/smart", handleSmartAsk);

// ✍️ Escritura inteligente con confirmación opcional
router.post("/ask/smart-write", handleSmartAskWithWrite);

// Conversational transactional agent (unificado)
router.post("/ask/smart-transactional", handleSmartTransactional);

router.post("/send-reminder", sendReminder);

// 🆕 Crear cotizaciones desde el agente AI
router.post("/ask/create-quotes-from-agent", createQuotesFromAgent);

export default router;
