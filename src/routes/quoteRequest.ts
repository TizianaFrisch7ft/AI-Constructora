import express from "express";
import {
  generateQuoteRequests,
  getAllQuoteRequests,
  getQuoteLinesById,
  updateQuoteRequestLine
} from "../controllers/quoteRequestController";

const router = express.Router();

// ✅ PONER ESTA ANTES que las rutas con :params
router.patch("/quote-request-lines/:id", updateQuoteRequestLine);

// estas van después
router.get("/quote-request/:qr_id/lines", getQuoteLinesById);
router.get("/quote-request", getAllQuoteRequests);
router.post("/generate", generateQuoteRequests);

export default router;
