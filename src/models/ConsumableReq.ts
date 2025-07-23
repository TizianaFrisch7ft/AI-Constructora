import { Schema, model } from "mongoose";

const ConsumableReqSchema = new Schema(
  {
    req_id: { type: String, required: true, unique: true },
    project_id: { type: String, required: true },
    pm_id: { type: String, required: true },
    pm_name: { type: String, required: true },
    product_id: { type: String, required: true },
    qty: { type: Number, required: true },
    due_date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "sent_to_rfq", "quoted", "ordered"],
      default: "pending",
    },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: "consumablereqs" }
);

export default model("ConsumableReq", ConsumableReqSchema);
