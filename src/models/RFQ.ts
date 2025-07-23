import { Schema, model } from "mongoose";

const RFQSchema = new Schema(
  {
    rfq_id: { type: String, required: true, unique: true },
    project_id: { type: String, required: true },
    vendor_id: { type: String, required: true },
    products: [
      {
        product_id: { type: String, required: true },
        qty: { type: Number, required: true },
      },
    ],
    sent_at: { type: Date, required: true },
    responded_at: { type: Date },
    status: { type: String, enum: ["sent", "answered", "cancelled"], default: "sent" },
  },
  { versionKey: false, collection: "rfqs" }
);

export default model("RFQ", RFQSchema);
