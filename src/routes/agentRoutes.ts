import express from "express";
import {
  handleAsk,
  handleSmartAsk,
  createQuotesFromAgent, 

   // ⬅ nuevo import
} from "../controllers/agentControllers";
import { sendReminder } from "../controllers/sendReminderController";


const router = express.Router();

// 🔍 Lectura normal
router.post("/ask", handleAsk);

// 🤖 Lectura inteligente con respuesta natural
router.post("/ask/smart", handleSmartAsk);


router.post("/send-reminder", sendReminder);

// 🆕 Crear cotizaciones desde el agente AI
router.post("/ask/create-quotes-from-agent", createQuotesFromAgent);

export default router;
