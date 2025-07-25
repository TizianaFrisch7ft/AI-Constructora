import { Schema, model } from "mongoose";

const SchedulePurSchema = new Schema({
  cc_id: { type: String, required: true, unique: true }, // ID único del cronograma
  description: { type: String },
  project_id: { type: String, required: true }, // FK a Project
  pm_id: { type: String }, // Puede ser simple texto o FK a PM
  date: { type: Date },
  status: { type: String, enum: ['Close', 'Waiting', 'WIP'] } // valores posibles
});

export default model("SchedulePur", SchedulePurSchema);
