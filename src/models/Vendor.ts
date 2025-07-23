import { Schema, model } from "mongoose";

const VendorSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  reference_name: String,
  class: String,
  rubro: String,
  legal_type: String,
  legal_id: String,
  main_mail: String,
  main_contact_name: String,
  mobile: String,
  status: String,
  type: String,
  score_avg: Number,
  evaluation_status: String
});

export default model("Vendor", VendorSchema);
