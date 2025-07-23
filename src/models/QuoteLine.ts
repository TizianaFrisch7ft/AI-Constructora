import { Schema, model } from "mongoose";

const QuoteLineSchema = new Schema({
  id: String,
  line_no: Number,
  product_id: String,
  reference: String,
  price: Number,
  qty: Number,
  delivery_date: Date,
  project_id: String
});

export default model("QuoteLine", QuoteLineSchema);