import { Schema, model } from "mongoose";

const ProjectVendorSchema = new Schema({
  project_id: { type: String, required: true }, // FK a Project
  vendor_id: { type: String, required: true },  // FK a Vendor
  score: { type: Number, min: 0, max: 5 },
  ini_status: { type: String, enum: ['Activo', 'Pendiente'] },
  reason: { type: String } 
});

export default model("ProjectVendor", ProjectVendorSchema);
