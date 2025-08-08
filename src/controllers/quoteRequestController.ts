// src/controllers/quoteRequestController.ts
import { Request, Response } from "express";
import QuoteRequest from "../models/QuoteRequest";
import QuoteRequestLine from "../models/QuoteRequestLine";
import Vendor from "../models/Vendor";
import { generateQrId } from "../utils/generateQrId";

import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import nodemailer from "nodemailer";

/* =========================
   Helpers PDF
   ========================= */
type QuoteLineDTO = {
  _id?: string;
  qr_id: string;
  line_no: number;
  qty: number;
  um?: string;
  product_id?: string;
  reference?: string;
  reference_price?: number;
  unit_price?: number;
  currency?: string;
  desired_date?: string | Date | null;
  status?: string;
};

type QuoteForPDF = {
  qr_id: string;
  vendor_id: string;
  vendor_name?: string;
  date: string | Date;
  reference?: string;
  lines: QuoteLineDTO[];
};

const ensureDir = async (dir: string) => {
  await fs.promises.mkdir(dir, { recursive: true });
};

const toDate = (d?: string | Date | null) => (d ? new Date(d) : undefined);

// ✅ Branding básico (podés ajustar texto y ruta del logo)
const BRAND = {
  name: "Ventus Construcciones",
  address: "Montevideo, Uruguay",
  email: "info@ventusconstrucciones.com",
  phone: "(+598) 2622 1134",
  // poné tu logo aquí; si no existe, simplemente no lo dibuja
  logoPath: path.join(process.cwd(), "src", "assets", "logo.png"),
};

// 🎨 PDF bonito, con header + logo, paneles y tabla escalada
async function buildQuotePdfBuffer(
  q: QuoteForPDF,
  opts?: {
    narrative?: string;   // texto libre de condiciones
    taxPct?: number;      // IVA % (por defecto 0)
    currency?: string;    // fuerza moneda si querés
    showRefPrice?: boolean; // mostrar columna Precio Ref.
  }
): Promise<{ buffer: Buffer; filename: string }> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 48 });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("error", reject);
    doc.on("end", () =>
      resolve({ buffer: Buffer.concat(chunks), filename: `${q.qr_id}.pdf` })
    );

    // Helpers
    const pageW = doc.page.width;
    const margin = 48;
    const toDateStr = (d?: string | Date | null) =>
      d ? new Date(d).toLocaleDateString("es-AR") : "-";

    const pickCcy = () =>
      (opts?.currency ||
        q.lines.find((l) => l?.currency)?.currency ||
        "USD").toString().toUpperCase();

    const ccy = pickCcy();
    const fmt = (n?: number) =>
      typeof n === "number"
        ? new Intl.NumberFormat("es-AR", { style: "currency", currency: ccy }).format(n)
        : "-";
    const safe = (s?: string) => (s ?? "").toString();

    /* =========================
       HEADER con barra + logo
       ========================= */
    doc.save();
    doc.rect(0, 0, pageW, 72).fill("#111827");
    doc.restore();

    try {
      if (BRAND.logoPath && fs.existsSync(BRAND.logoPath)) {
        doc.image(BRAND.logoPath, margin, 16, { fit: [120, 40] });
      }
    } catch {
      // si no hay logo, seguimos sin romper
    }

    doc
      .fillColor("#FFFFFF")
      .fontSize(18)
      .text("Solicitud de Cotización", margin + 140, 18);

    doc
      .fontSize(10)
      .text(BRAND.name, margin + 140, 42)
      .text(
        `${BRAND.address}${BRAND.phone ? " | Tel: " + BRAND.phone : ""} | ${BRAND.email}`,
        margin + 140,
        56
      );

    doc
      .fontSize(11)
      .text(`QR: ${q.qr_id}`, pageW - margin - 180, 22, { width: 180, align: "right" })
      .text(`Fecha: ${toDateStr(q.date)}`, pageW - margin - 180, 38, { width: 180, align: "right" });

    /* =========================
       PANELS (Proveedor / Solicitud)
       ========================= */
    const panelTop = 90;
    const colGap = 18;
    const panelColW = (pageW - margin * 2 - colGap) / 2;

    // Proveedor
    doc.fillColor("#111827").fontSize(12).text("Proveedor", margin, panelTop);
    doc.save().rect(margin, panelTop + 16, panelColW, 64).fill("#F9FAFB").restore();
    doc
      .fontSize(10)
      .fillColor("#111827")
      .text(
        `Nombre: ${q.vendor_name ? `${q.vendor_name} (${q.vendor_id})` : q.vendor_id}`,
        margin + 10,
        panelTop + 26,
        { width: panelColW - 20 }
      );

    // Datos de la solicitud
    doc
      .fillColor("#111827")
      .fontSize(12)
      .text("Datos de la solicitud", margin + panelColW + colGap, panelTop);
    doc
      .save()
      .rect(margin + panelColW + colGap, panelTop + 16, panelColW, 64)
      .fill("#F9FAFB")
      .restore();
    doc
      .fontSize(10)
      .fillColor("#111827")
      .text(`Referencia: ${q.reference || "-"}`, margin + panelColW + colGap + 10, panelTop + 26, {
        width: panelColW - 20,
      })
      .text(`Moneda: ${ccy}`, margin + panelColW + colGap + 10, panelTop + 44, {
        width: panelColW - 20,
      });

    // línea divisoria
    doc
      .moveTo(margin, panelTop + 96)
      .lineTo(pageW - margin, panelTop + 96)
      .strokeColor("#E5E7EB")
      .lineWidth(1)
      .stroke();

    doc.y = panelTop + 108;

    /* =========================
       TABLA de líneas
       ========================= */
    const showRef = opts?.showRefPrice ?? true; // mostramos Precio Ref por defecto
    const headers = showRef
      ? ["#", "Código", "Descripción", "Cant.", "UM", "Precio Ref.", "Precio", "Subtotal"]
      : ["#", "Código", "Descripción", "Cant.", "UM", "Precio", "Subtotal"];

    // anchos base y escalado a página
    const usable = pageW - margin * 2;
    const baseWidths = showRef
      ? [26, 90, 220, 50, 40, 80, 70, 82]
      : [26, 100, 250, 50, 40, 80, 90];

    const totalW = baseWidths.reduce((a, b) => a + b, 0);
    const scale = usable / totalW;
    const colWidths: number[] = baseWidths.map((w) => w * scale);

    let y = doc.y;

    // encabezado de tabla
    const drawTableHeader = () => {
      doc.save();
      doc.rect(margin, y, usable, 22).fill("#F3F4F6").restore();
      doc.fillColor("#111827").font("Helvetica-Bold").fontSize(9);

      let x = margin;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x + 4, y + 6, { width: colWidths[i] - 8 });
        x += colWidths[i];
      }
      y += 22;
      doc.y = y;
    };

    drawTableHeader();

    const drawRow = (cells: (string | number)[], zebra: boolean) => {
      // salto de página
      if (y > doc.page.height - 96) {
        doc.addPage();
        y = doc.y = margin;
        drawTableHeader();
      }

      if (zebra) {
        doc.save();
        doc.rect(margin, y, usable, 20).fill("#FAFAFA").restore();
      }

      doc.fillColor("#111827").font("Helvetica").fontSize(9);
      let xx = margin;
      for (let i = 0; i < cells.length; i++) {
        doc.text(String(cells[i] ?? ""), xx + 4, y + 5, {
          width: colWidths[i] - 8,
          ellipsis: true,
        });
        xx += colWidths[i];
      }
      y += 20;
      doc.y = y;
    };

    let subtotalNum = 0;
    q.lines
      .sort((a, b) => (a.line_no || 0) - (b.line_no || 0))
      .forEach((l, idx) => {
        const qty = typeof l.qty === "number" ? l.qty : undefined;
        const up = typeof l.unit_price === "number" ? l.unit_price : undefined;
        const sub = qty != null && up != null ? qty * up : undefined;
        if (typeof sub === "number") subtotalNum += sub;

        const baseCells: (string | number)[] = [
          l.line_no ?? "",
          safe(l.product_id) || "-",
          safe(l.reference) || "-",
          qty ?? "-",
          safe(l.um) || "-",
        ];

        const priceCells = showRef
          ? [
              l.reference_price != null ? fmt(l.reference_price) : "-",
              up != null ? fmt(up) : "-",
              sub != null ? fmt(sub) : "-",
            ]
          : [up != null ? fmt(up) : "-", sub != null ? fmt(sub) : "-"];

        drawRow([...baseCells, ...priceCells], idx % 2 === 1);
      });

    // Totales
    const ivaPct = typeof opts?.taxPct === "number" ? opts!.taxPct! : 0;
    const iva = subtotalNum * (ivaPct / 100);
    const total = subtotalNum + iva;

    y += 6;
    doc.moveTo(margin, y).lineTo(pageW - margin, y).strokeColor("#E5E7EB").lineWidth(1).stroke();
    y += 10;

    const totalsRightCol = 220;
    const totalsX = pageW - margin - totalsRightCol;

    const lineTotal = (label: string, value: string) => {
      doc.font("Helvetica").fontSize(10).fillColor("#111827").text(label, totalsX, y, {
        width: totalsRightCol - 110,
        align: "right",
      });
      doc.font("Helvetica-Bold").text(value, totalsX + totalsRightCol - 100, y, {
        width: 100,
        align: "right",
      });
      y += 16;
    };

    lineTotal("Subtotal:", fmt(subtotalNum));
    if (ivaPct > 0) lineTotal(`IVA (${ivaPct}%):`, fmt(iva));
    lineTotal("Total:", fmt(total));
    y += 10;

    // Condiciones / narrativa (opcional)
    if (opts?.narrative) {
      doc.moveDown(0.5);
      doc.font("Helvetica-Bold").fontSize(12).fillColor("#111827").text("Condiciones");
      doc.moveDown(0.3);
      doc.save().rect(margin, doc.y, pageW - margin * 2, 1000).fill("#F9FAFB").restore();

      const startY = doc.y + 8;
      doc.font("Helvetica").fontSize(10).fillColor("#111827");
      const paragraphs = opts.narrative.split(/\n+/);
      let yy = startY;
      paragraphs.forEach((p) => {
        const text = p.trim();
        if (!text) return;
        doc.text(text, margin + 10, yy, { width: pageW - margin * 2 - 20 });
        yy = doc.y + 6;
      });
    }

    // Footer
    doc
      .fontSize(8)
      .fillColor("#6B7280")
      .text("Generado automáticamente por el sistema de compras.", margin, doc.page.height - 40, {
        align: "right",
      });

    doc.end();
  });
}

/* =========================
   Mailer (nodemailer)
   ========================= */
const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || "no-reply@example.com";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true para 465, false para otros
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

async function sendVendorEmailWithPdf(opts: {
  to: string;
  vendorName?: string;
  qrId: string;
  pdfBuffer: Buffer;
  filename: string;
}) {
  const { to, vendorName, qrId, pdfBuffer, filename } = opts;

  const subject = `Solicitud de cotización ${qrId}`;
  const lines = [
    vendorName ? `Hola ${vendorName},` : `Hola,`,
    "",
    `Te enviamos adjunta la solicitud de cotización **${qrId}**.`,
    "Por favor, revisá el detalle en el PDF y respondé con tu mejor oferta.",
    "",
    "Saludos,",
    "Compras",
  ];

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text: lines.join("\n"),
    attachments: [
      {
        filename,
        content: pdfBuffer,
      },
    ],
  });
}

/* =========================
   Crear cotizaciones por selección (existente)
   ========================= */
export const generateQuoteRequests = async (req: Request, res: Response) => {
  try {
    let { selectedLines } = req.body;

    if (!Array.isArray(selectedLines) || selectedLines.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se recibieron líneas válidas.",
      });
    }

    // Normalizamos datos mínimos para cada línea
    selectedLines = selectedLines.map((line: any) => {
      const product_id = line.product_id
        ? String(line.product_id).trim()
        : (line.reference || `ITEM_${line.line_no}`)
            .toUpperCase()
            .replace(/\s+/g, "_");

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
        const existingLines = await QuoteRequestLine.find({
          cc_id: line.cc_id,
          cc_id_line: line.line_no,
        });

        let isDuplicate = false;
        if (existingLines.length > 0) {
          for (const existingLine of existingLines) {
            const quote = await QuoteRequest.findOne({
              qr_id: existingLine.qr_id,
              vendor_id: vendor,
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

    const result: Array<{ qr_id: string; vendor_id: string; lines: any[] }> = [];

    for (const [vendor_id, lines] of Object.entries(vendorGroups)) {
      const qr_code = await generateQrId();

      await QuoteRequest.create({
        qr_id: qr_code,
        vendor_id,
        date: new Date(),
        reference: "Generado desde selección de líneas",
      });

      const qrLines = await Promise.all(
        (lines as any[]).map((line: any, index: number) =>
          QuoteRequestLine.create({
            qr_id: qr_code,
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

      result.push({ qr_id: qr_code, vendor_id, lines: qrLines });
    }

    if (result.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No se crearon cotizaciones. Revisa vendors y líneas válidas.",
      });
    }

    return res.status(201).json({
      success: true,
      message: `${result.length} cotización(es) generadas correctamente.`,
      result,
    });
  } catch (error: any) {
    console.error("❌ Error generando quotes:", error);
    return res.status(500).json({
      success: false,
      message: "Error interno al generar cotizaciones.",
      detalle: error?.message,
    });
  }
};

/* =========================
   NUEVO: Generar PDF + enviar por mail al vendor
   ========================= */
export const sendQuoteRequestsPdf = async (req: Request, res: Response) => {
  try {
    const outDir = path.join(process.cwd(), "storage", "qr-pdfs");
    await ensureDir(outDir);

    const qrIdsFromSimple: string[] = Array.isArray(req.body?.qr_ids) ? req.body.qr_ids : [];
    const qrIdsFromRequests: Array<{ qr_id: string; vendor_name?: string }> =
      Array.isArray(req.body?.requests) ? req.body.requests : [];

    const items: Array<{ qr_id: string; vendor_name?: string }> = [
      ...qrIdsFromSimple.map((qr_id) => ({ qr_id })),
      ...qrIdsFromRequests.map((r) => ({ qr_id: r.qr_id, vendor_name: r.vendor_name })),
    ];

    if (items.length === 0) {
      return res.status(400).json({ success: false, message: "Body inválido. Enviá 'qr_ids' o 'requests'." });
    }

    const results: Array<{
      qr_id: string;
      vendor_id?: string;
      vendor_email?: string;
      file_name?: string;
      file_path?: string;
      emailed?: boolean;
      error?: string;
    }> = [];

    for (const { qr_id, vendor_name: vendorNameFromClient } of items) {
      const entry: any = { qr_id, emailed: false };

      try {
        const header = await QuoteRequest.findOne({ qr_id }).lean();
        if (!header) {
          entry.error = "RFQ no encontrada";
          results.push(entry);
          continue;
        }

        const allLines = await QuoteRequestLine.find({ qr_id }).lean();
        // ✅ solo líneas waiting
        const waitingLines = (allLines as any[]).filter(
          (l) => String(l.status || "").trim().toLowerCase() === "waiting"
        );

        if (waitingLines.length === 0) {
          entry.error = "Sin líneas en 'waiting' para enviar";
          results.push(entry);
          continue;
        }

        const vendor_id = String((header as any).vendor_id || "");
        entry.vendor_id = vendor_id;

        const vendor = await Vendor.findOne({
          $or: [{ vendor_id }, { id: vendor_id }, { code: vendor_id }],
        }).lean();

        const vendorEmail =
          (vendor as any)?.main_mail ||
          (vendor as any)?.email ||
          (vendor as any)?.mail ||
          "";

        if (!vendorEmail) {
          entry.error = "Vendor sin email (main_mail/email)";
          results.push(entry);
          continue;
        }
        entry.vendor_email = vendorEmail;

        // Armar payload SOLO con waiting
        const payload: QuoteForPDF = {
          qr_id,
          vendor_id,
          vendor_name: vendorNameFromClient || (vendor as any)?.name || undefined,
          date: header.date as any,
          reference: (header as any)?.reference || undefined,
          lines: waitingLines.map((l: any) => ({
            ...l,
            desired_date: l.desired_date ? new Date(l.desired_date) : null,
          })),
        };

        const { buffer, filename } = await buildQuotePdfBuffer(payload);
        const outPath = path.join(outDir, filename);
        await fs.promises.writeFile(outPath, buffer);

        entry.file_name = filename;
        entry.file_path = `/downloads/qr-pdfs/${filename}`;

        await sendVendorEmailWithPdf({
          to: vendorEmail,
          vendorName: payload.vendor_name,
          qrId: payload.qr_id,
          pdfBuffer: buffer,
          filename,
        });

        entry.emailed = true;
        results.push(entry);
      } catch (e: any) {
        entry.error = e?.message || "Error inesperado";
        results.push(entry);
      }
    }

    return res.json({
      success: true,
      message: `Procesadas ${results.length} RFQ(s).`,
      results,
      note:
        "Para servir los PDFs por HTTP, montá el estático: app.use('/downloads', express.static(path.join(process.cwd(), 'storage')))",
    });
  } catch (err: any) {
    console.error("❌ Error generando/enviando PDFs:", err);
    return res
      .status(500)
      .json({ success: false, message: "Error generando/enviando PDFs.", detalle: err?.message });
  }
};

/* =========================
   GET /api/quote-request
   ========================= */
export const getAllQuoteRequests = async (req: Request, res: Response) => {
  try {
    const quotes = await QuoteRequest.find().sort({ date: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener cotizaciones." });
  }
};

/* =========================
   GET /api/quote-request/:qr_id/lines
   ========================= */
export const getQuoteLinesById = async (req: Request, res: Response) => {
  try {
    const qr_id = req.params.qr_id;
    const lines = await QuoteRequestLine.find({ qr_id });
    res.json(lines);
  } catch (err) {
    res.status(500).json({ message: "Error al obtener líneas de cotización." });
  }
};

/* =========================
   PATCH /api/quote-request-lines/:id
   ========================= */
export const updateQuoteRequestLine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { unit_price, reference_price, status } = req.body;

    const line = await QuoteRequestLine.findById(id);
    if (!line) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }

    // Permitir cambiar status de 'done' a 'waiting' y limpiar unit_price
    if (typeof status === "string" && status === "waiting" && (line as any).status === "done") {
      (line as any).status = "waiting";
      if (unit_price === undefined || unit_price === null || unit_price === "") {
        (line as any).unit_price = undefined;
      }
      await line.save();
      return res.json({ success: true, message: "Línea actualizada correctamente.", line });
    }

    // Solo se permite modificar precios si está en 'waiting'
    if ((line as any).status !== "waiting") {
      return res.status(400).json({
        message: "Solo se pueden modificar líneas en estado 'waiting'.",
      });
    }

    let updated = false;
    if (typeof unit_price === "number" && unit_price > 0) {
      (line as any).unit_price = unit_price;
      (line as any).status = "done";
      updated = true;
    }
    if (typeof reference_price === "number" && reference_price > 0) {
      (line as any).reference_price = reference_price;
      updated = true;
    }

    if (!updated) {
      return res
        .status(400)
        .json({ message: "No se proporcionó ningún valor válido para actualizar." });
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

/* =========================
   DELETE /api/quote-request-lines/:id
   ========================= */
export const deleteQuoteRequestLine = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const line = await QuoteRequestLine.findById(id);
    if (!line) {
      return res.status(404).json({ message: "Línea no encontrada." });
    }
    if ((line as any).status !== "done") {
      return res.status(400).json({ message: "Solo se pueden eliminar líneas en estado 'done'." });
    }
    await (line as any).deleteOne();
    res.json({ success: true, message: "Línea eliminada correctamente." });
  } catch (error: any) {
    console.error("❌ Error eliminando línea de quote:");
    console.error("📌 Mensaje:", error?.message);
    console.error("📌 Stack:", error?.stack);
    res.status(500).json({ message: "Error interno al eliminar la línea." });
  }
};
