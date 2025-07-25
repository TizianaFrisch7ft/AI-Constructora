import { Schema, model } from "mongoose";

const VendorSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  reference_name: { type: String },
  class: { type: String, enum: ['Material', 'Servicio'] },
  rubro: { type: String },
  legal_type: { type: String }, // ej: RUT
  legal_id: { type: String },
  main_mail: { type: String },
  main_contact_name: { type: String },
  mobile: { type: String },
  status: { type: String, enum: ['Activo', 'Inactivo'] }, 
  type: { type: String, enum: ['ready', 'draft'] },
  score_avg: { type: Number, min: 0, max: 5 },
  evaluation_status: { type: String }, // ej: 'Al día', 'Por vencer', etc.
  pay_terms: { type: String } // ej: '15 DD', '30 DD', etc.
});

export default model("Vendor", VendorSchema);
