import { Schema, model } from "mongoose";

const EvalSchema = new Schema({
  eval_id: { type: String, required: true, unique: true },
  eval_name: { type: String, required: true }, // Ej: "Certificación ISO", "Evaluación Técnica"
  vendor_id: { type: String, required: true }, // FK a Vendor
  start_date: { type: Date },
  due_date: { type: Date },
  type: { type: String, enum: ['ISO', 'Técnica', 'Auto'] }, // Podés extenderlo si hay más
  attach_id: { type: String } // Ej: doc001, doc005, etc.
});

export default model("Eval", EvalSchema);
