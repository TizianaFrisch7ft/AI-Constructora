import { Schema, model } from "mongoose";

const QuoteRequestSchema = new Schema({
  qr_id: { type: String, required: true, unique: true },
  vendor_id: { type: String, required: true }, // FK a Vendor
  date: { type: Date, required: true },
  reference: { type: String } // Ej: "Consolidado obra P0001 / Cronograma CC0001"
});

export default model("QuoteRequest", QuoteRequestSchema);
