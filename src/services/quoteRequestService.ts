import QuoteRequest from "../models/QuoteRequest";
import QuoteRequestLine from "../models/QuoteRequestLine";
import { v4 as uuidv4 } from "uuid";

interface ScheduleLine {
  cc_id: string;
  line_no: number;
  qty: number;
  um: string;
  product_id?: string;
  reference: string;
  reference_price?: number;
  currency?: string;
  desired_date?: string;
  vendor_list: string[];
  project_id: string;
}

export const generateQuotesByVendors = async (lines: ScheduleLine[]) => {
  const groupedByVendor: Record<string, ScheduleLine[]> = {};

  for (const line of lines) {
    for (const vendorId of line.vendor_list) {
      if (!groupedByVendor[vendorId]) groupedByVendor[vendorId] = [];
      groupedByVendor[vendorId].push(line);
    }
  }

  const quoteRequests = [];

  for (const [vendorId, vendorLines] of Object.entries(groupedByVendor)) {
    const qr_id = "QR" + uuidv4().slice(0, 8).toUpperCase();
    const date = new Date();

    const newQR = new QuoteRequest({
      qr_id,
      vendor_id: vendorId,
      date,
      reference: `Cotización generada desde líneas seleccionadas`
    });

    await newQR.save();

    for (let i = 0; i < vendorLines.length; i++) {
      const l = vendorLines[i];

      const qrLine = new QuoteRequestLine({
        qr_id,
        line_no: i + 1,
        qty: l.qty,
        um: l.um,
        product_id: l.product_id || null,
        reference: l.reference,
        reference_price: l.reference_price || null,
        currency: l.currency || "usd",
        desired_date: l.desired_date ? new Date(l.desired_date) : null,
        unit_price: null,
        promise_date: null,
        cc_id: l.cc_id,
        cc_id_line: l.line_no,
        status: "waiting"
      });

      await qrLine.save();
    }

    quoteRequests.push({ qr_id, vendor_id: vendorId });
  }

  return quoteRequests;
};
