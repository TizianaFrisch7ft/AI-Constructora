import { Request, Response } from "express";
import QuoteRequest from "../models/QuoteRequest";
import QuoteRequestLine from "../models/QuoteRequestLine";
import { generateQrId } from "../utils/generateQrId";

export const generateQuoteRequests = async (req: Request, res: Response) => {
  try {
    const { selectedLines } = req.body;

    if (!Array.isArray(selectedLines) || selectedLines.length === 0) {
      return res.status(400).json({ message: "No se recibieron líneas válidas." });
    }

    const vendorGroups: { [key: string]: any[] } = {};

    for (const line of selectedLines as any[]) {
      for (const vendor of (line.vendor_list || []) as string[]) {
        // Verificamos si ya existe una QuoteRequestLine para esta línea y proveedor
        const existingLine = await QuoteRequestLine.findOne({
          cc_id: line.cc_id,
          cc_id_line: line.line_no,
          qr_id: { $exists: true }
        });

        if (existingLine) {
          // Buscar la QuoteRequest correspondiente y comparar vendor_id
          const qr = await QuoteRequest.findOne({ qr_id: existingLine.qr_id, vendor_id: vendor });
          if (qr) {
            console.log(`🔁 Ya existe una quote para línea ${line.line_no} y proveedor ${vendor}`);
            continue; // Salteamos si ya existe
          }
        }

        if (!vendorGroups[vendor]) vendorGroups[vendor] = [];
        vendorGroups[vendor].push(line);
      }
    }

    const result = [];

    for (const [vendor_id, lines] of Object.entries(vendorGroups)) {
      const qr_id = await generateQrId();

      await QuoteRequest.create({
        qr_id,
        vendor_id,
        date: new Date(),
        reference: "Generado desde selección de líneas",
      });

      const qrLines = await Promise.all(
        lines.map((line: any, index: number) =>
          QuoteRequestLine.create({
            qr_id,
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
            status: "waiting",
          })
        )
      );

      result.push({ qr_id, vendor_id, lines: qrLines });
    }

    return res.status(201).json({
      message: "Quote Requests generadas correctamente.",
      result,
    });
  } catch (error: any) {
    console.error("❌ Error generando quotes:");
    console.error("📌 Mensaje:", error?.message);
    console.error("📌 Stack:", error?.stack);
    console.error("📌 Body recibido:", req.body);

    return res.status(500).json({
      message: "Error interno al generar cotizaciones.",
      detalle: error?.message,
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
