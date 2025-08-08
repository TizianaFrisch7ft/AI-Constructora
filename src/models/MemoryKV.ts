// models/MemoryKV.ts
import { Schema, model, models } from "mongoose";
const schema = new Schema({
  scope: { type: String, required: true },   // "vendor","project", etc.
  key:   { type: String, required: true },   // normalized name
  value: { type: String, required: true },   // id
}, { timestamps: true, indexes: [{ scope: 1, key: 1, unique: true }] });

export default models.MemoryKV || model("MemoryKV", schema);
