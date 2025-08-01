import { Request, Response } from "express";
import SchedulePurLine from "../models/SchedulePurLine";
import QuoteRequest from "../models/QuoteRequest";
import QuoteRequestLine from "../models/QuoteRequestLine";

export const getAllSchedulePurLines = async (req: Request, res: Response) => {
  try {
    const lines = await SchedulePurLine.find();

    const enrichedLines = await Promise.all(
      lines.map(async (line) => {
        const relatedQuotes = await QuoteRequestLine.find({
          cc_id: line.cc_id,
          cc_id_line: line.line_no,
        });

        const vendorIds: string[] = [];

        for (const qrLine of relatedQuotes) {
          const quote = await QuoteRequest.findOne({ qr_id: qrLine.qr_id });
          if (quote?.vendor_id) {
            vendorIds.push(quote.vendor_id);
          }
        }

        return {
          ...line.toObject(),
          alreadyQuotedVendors: vendorIds,
        };
      })
    );

    res.json(enrichedLines);
  } catch (err) {
    console.error("Error trayendo líneas:", err);
    res.status(500).json({ error: "Error cargando líneas" });
  }
};

