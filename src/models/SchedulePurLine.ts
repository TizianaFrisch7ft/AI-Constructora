import { Schema, model } from "mongoose";

const SchedulePurLineSchema = new Schema({
  cc_id: { type: String, required: true }, // FK a SchedulePur
  line_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  um: { type: String }, // unidad de medida
  product_id: { type: String }, // puede no usarse
  reference: { type: String, required: true }, // descripción del producto
  reference_price: { type: Number },
  currency: { type: String, default: 'usd' },
  desired_date: { type: Date },
  project_id: { type: String, required: false },
  vendor_list: [{ type: String }] // array de IDs de vendors
});

export default model("SchedulePurLine", SchedulePurLineSchema);
