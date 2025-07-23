import { Schema, model } from "mongoose";

const QuoteSchema = new Schema(
  {
    id: { type: String, required: true, unique: true },
    project_id: { type: String, required: true },
    vendor_id: { type: String, required: true },   // 👈 NUEVO
    date: { type: Date, required: true },
  },
  { versionKey: false, collection: "quotes" }
);

export default model("Quote", QuoteSchema);
