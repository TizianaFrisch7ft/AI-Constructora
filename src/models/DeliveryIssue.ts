import { Schema, model } from "mongoose";

const DeliveryIssueSchema = new Schema(
  {
    issue_id: { type: String, required: true, unique: true },
    vendor_id: { type: String, required: true },
    project_id: { type: String, required: true },
    type: { type: String, enum: ["delay", "quality"], required: true },
    description: { type: String },
    occurred_at: { type: Date, required: true },
    resolved: { type: Boolean, default: false },
  },
  { versionKey: false, collection: "deliveryissues" }
);

export default model("DeliveryIssue", DeliveryIssueSchema);
