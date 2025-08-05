// src/controllers/quoteRequestController.ts
import { Request, Response } from "express";
import QuoteRequest from "../models/QuoteRequest";
import QuoteRequestLine from "../models/QuoteRequestLine";
import { generateQrId } from "../utils/generateQrId";

export const generateQuoteRequests = async (req: Request, res: Response) => {
  try {
    let { selectedLines } = req.body;

    if (!Array.isArray(selectedLines) || selectedLines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se recibieron líneas válidas."
      });
    }

    // Normalizamos datos mínimos para cada línea
    selectedLines = selectedLines.map((line: any) => {
      const product_id = line.product_id
        ? String(line.product_id).trim()
        : (line.reference || `ITEM_${line.line_no}`).toUpperCase().replace(/\s+/g, "_");

      const vendor_list = Array.isArray(line.vendor_list) ? line.vendor_list : [];

      return { ...line, product_id, vendor_list };
    });

    const vendorGroups: { [vendor_id: string]: any[] } = {};
    const processedKeys = new Set<string>();

    for (const line of selectedLines) {
      for (const vendor of line.vendor_list) {
        const uniqueKey = `${line.cc_id}-${line.line_no}-${vendor}`;
        if (processedKeys.has(uniqueKey)) continue;

        // Evitamos duplicados ya existentes en DB
        // Primero buscamos todas las líneas que coincidan con cc_id y cc_id_line
        const existingLines = await QuoteRequestLine.find({
          cc_id: line.cc_id,
          cc_id_line: line.line_no
        });
        
        // Luego verificamos si alguna de esas líneas pertenece a una cotización para este vendor
        let isDuplicate = false;
        if (existingLines.length > 0) {
          for (const existingLine of existingLines) {
            // Buscamos la cotización usando el qr_id (string)
            const quote = await QuoteRequest.findOne({ 
              qr_id: existingLine.qr_id, 
              vendor_id: vendor 
            });
            if (quote) {
              isDuplicate = true;
              break;
            }
          }
        }
        
        if (isDuplicate) continue;

        if (!vendorGroups[vendor]) vendorGroups[vendor] = [];
        vendorGroups[vendor].push(line);

        processedKeys.add(uniqueKey);
      }
    }

    const result = [];

    for (const [vendor_id, lines] of Object.entries(vendorGroups)) {
      // Generar código humano
      const qr_code = await generateQrId();

      // Crear la QuoteRequest en DB
      const newQR = await QuoteRequest.create({
        qr_id: qr_code,
        vendor_id,
        date: new Date(),
        reference: "Generado desde selección de líneas"
      });

      // Crear líneas
      const qrLines = await Promise.all(
        lines.map((line: any, index: number) =>
          QuoteRequestLine.create({
            qr_id: qr_code, // Usar el código humano legible en lugar del ObjectId
            line_no: index + 1,
            qty: line.qty,
            um: line.um,
            product_id: line.product_id,
            reference: line.reference,
            reference_price: line.reference_price,
            currency: line.currency || "usd",
            desired_date: line.desired_date,
            cc_id: line.cc_id,
            cc_id_line: line.line_no,
            status: "waiting"
          })
        )
      );

      result.push({ qr_id: qr_code, vendor_id, lines: qrLines });
    }

    if (result.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se crearon cotizaciones. Revisa vendors y líneas válidas."
      });
    }

    return res.status(201).json({
      success: true,
      message: `${result.length} cotización(es) generadas correctamente.`,
      result
    });

  } catch (error: any) {
    console.error("❌ Error generando quotes:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al generar cotizaciones.",
      detalle: error?.message
    });
  }
};


// GET /api/quote-request
export const getAllQuoteRequests = async (req: Request, res: Response) => {
  try {
    const quotes = await QuoteRequest.find().sort({ date: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener cotizaciones." });
  }
};

// GET /api/quote-request/:qr_id/lines
export const getQuoteLinesById = async (req: Request, res: Response) => {
  try {
    const qr_id = req.params.qr_id;
    const lines = await QuoteRequestLine.find({ qr_id });
    res.json(lines);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener líneas de cotización." });
  }
};

// PATCH /api/quote-request-lines/:id
export const updateQuoteRequestLine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { unit_price, reference_price, status } = req.body;

    const line = await QuoteRequestLine.findById(id);
    if (!line) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }

    // Permitir cambiar status de 'done' a 'waiting' y limpiar unit_price
    if (typeof status === "string" && status === "waiting" && line.status === "done") {
      line.status = "waiting";
      if (unit_price === undefined || unit_price === null || unit_price === "") {
        line.unit_price = undefined;
      }
      await line.save();
      return res.json({ success: true, message: "Línea actualizada correctamente.", line });
    }

    // Solo se permite modificar precios si está en 'waiting'
    if (line.status !== "waiting") {
      return res.status(400).json({ message: "Solo se pueden modificar líneas en estado 'waiting'." });
    }

    let updated = false;
    if (typeof unit_price === "number" && unit_price > 0) {
      line.unit_price = unit_price;
      line.status = "done";
      updated = true;
    }
    if (typeof reference_price === "number" && reference_price > 0) {
      line.reference_price = reference_price;
      updated = true;
    }

    if (!updated) {
      return res.status(400).json({ message: "No se proporcionó ningún valor válido para actualizar." });
    }

    await line.save();
    res.json({ success: true, message: "Línea actualizada correctamente.", line });
  } catch (error: any) {
    console.error("❌ Error actualizando línea de quote:");
    console.error("📌 Mensaje:", error?.message);
    console.error("📌 Stack:", error?.stack);
    res.status(500).json({ message: "Error interno al actualizar la línea." });
  }
};

// DELETE /api/quote-request-lines/:id
export const deleteQuoteRequestLine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const line = await QuoteRequestLine.findById(id);
    if (!line) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }
    // Solo permitir eliminar si está en 'done'
    if (line.status !== "done") {
      return res.status(400).json({ message: "Solo se pueden eliminar líneas en estado 'done'." });
    }
    await line.deleteOne();
    res.json({ success: true, message: "Línea eliminada correctamente." });
  } catch (error: any) {
    console.error("❌ Error eliminando línea de quote:");
    console.error("📌 Mensaje:", error?.message);
    console.error("📌 Stack:", error?.stack);
    res.status(500).json({ message: "Error interno al eliminar la línea." });
  }
};
