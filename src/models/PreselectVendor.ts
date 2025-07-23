import { Schema, model } from "mongoose";

const PreselectVendorSchema = new Schema({
  project_id: String,
  vendor_id: String,
  status: String,
  comments: String
});

export default model("PreselectVendor", PreselectVendorSchema);
