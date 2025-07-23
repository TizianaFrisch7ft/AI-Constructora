import { Schema, model } from "mongoose";

const VendorEvalSchema = new Schema({
  eval_id: { type: String, required: true, unique: true },
  eval_name: String,
  vendor_id: String,
  start_date: Date,
  due_date: Date,
  type: String,
  attach_id: String
});

export default model("VendorEval", VendorEvalSchema);
