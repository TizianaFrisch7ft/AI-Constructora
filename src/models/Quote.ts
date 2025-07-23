import { Schema, model } from "mongoose";

const QuoteSchema = new Schema({
  id: { type: String, required: true, unique: true },
  project_id: String,
  date: Date
});

export default model("Quote", QuoteSchema);
