import express from "express";
import {
  handleAsk,
  handleSmartAsk,
  handleSmartAskWithWrite,
  handleSmartTransactional
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

export default router;
