// src/routes/quoteRequest.routes.ts
import express from "express";

import {
  generateQuoteRequests,
  getAllQuoteRequests,
  getQuoteLinesById,
  updateQuoteRequestLine,
  deleteQuoteRequestLine,
  sendQuoteRequestsPdf,
  generateQuoteRequestsPdf,
  sendQuoteRequestPdfEmail,
} from "../controllers/quoteRequestController";


const router = express.Router();

/**
 * ⚠️ Orden importa: primero rutas estáticas/con prefijos claros,
 * luego las que tienen :params para evitar capturas indeseadas.
 */

// --- Líneas de cotización (editar/eliminar por _id) ---
router.patch("/quote-request-lines/:id", updateQuoteRequestLine);
router.delete("/quote-request-lines/:id", deleteQuoteRequestLine);

// --- Acciones de QuoteRequest sin params ---
router.post("/quote-request/send-pdf", sendQuoteRequestsPdf);     // existente (genera y envía)
router.post("/quote-request/generate-pdf", generateQuoteRequestsPdf); // NUEVO: solo genera PDF
router.post("/quote-request/send-pdf-email", sendQuoteRequestPdfEmail); // NUEVO: solo envía email
router.post("/quote-request/generate", generateQuoteRequests);    // 👈 nuevo path consistente
router.post("/generate", generateQuoteRequests);                  // (legacy) mantener por compat

// --- Lecturas ---
router.get("/quote-request", getAllQuoteRequests);
router.get("/quote-request/:qr_id/lines", getQuoteLinesById);


// router.post("/smart-transactional", handleSmartTransactional);

export default router;
