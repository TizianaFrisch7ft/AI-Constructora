import { Schema, model } from "mongoose";

const VendorEvalLineSchema = new Schema({
  eval_id: String,
  line_no: Number,
  name: String,
  value: Schema.Types.Mixed,
  check: String,
  attach_id: String
});

export default model("VendorEvalLine", VendorEvalLineSchema);