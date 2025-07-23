import { Schema, model } from "mongoose";

const ProjectVendorSchema = new Schema({
  project_id: String,
  vendor_id: String,
  score: Number,
  status: String
});

export default model("ProjectVendor", ProjectVendorSchema);
