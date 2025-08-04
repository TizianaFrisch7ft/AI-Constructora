import express from "express";
import {
  generateQuoteRequests,
  getAllQuoteRequests,
  getQuoteLinesById,
  updateQuoteRequestLine,
  deleteQuoteRequestLine
} from "../controllers/quoteRequestController";
import { agentTransactional } from "../controllers/agentTransactionalController";
// import { handleSmartTransactional } from "../controllers/agentControllers";

const router = express.Router();

// ✅ PONER ESTA ANTES que las rutas con :params
router.patch("/quote-request-lines/:id", updateQuoteRequestLine);
router.delete("/quote-request-lines/:id", deleteQuoteRequestLine);

// estas van después
router.get("/quote-request/:qr_id/lines", getQuoteLinesById);
router.get("/quote-request", getAllQuoteRequests);
router.post("/generate", generateQuoteRequests);
router.post("/agent-transactional", agentTransactional);
// router.post("/smart-transactional", handleSmartTransactional);

export default router;
