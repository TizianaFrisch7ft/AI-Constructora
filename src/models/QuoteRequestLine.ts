import { Schema, model } from "mongoose";

const QuoteRequestLineSchema = new Schema({
  qr_id: { type: String, required: true }, // FK a QuoteRequest
  line_no: { type: Number, required: true },
  qty: { type: Number, required: true },
  um: { type: String },
  product_id: { type: String, required: true },
  reference: { type: String },
  reference_price: { type: Number },
  currency: { type: String, default: 'usd' },
  unit_price: { type: Number },
  desired_date: { type: Date },
  promise_date: { type: Date },
  cc_id: { type: String }, // FK a SchedulePur
  cc_id_line: { type: Number },
  status: { type: String, enum: ['win', 'close', 'done', 'waiting'] }
});

export default model("QuoteRequestLine", QuoteRequestLineSchema);
