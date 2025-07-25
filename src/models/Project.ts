import { Schema, model } from "mongoose";

const ProjectSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  address_1: { type: String }, 
  state: { type: String },
  country: { type: String },
  status: { type: String, enum: ['Open', 'Close', 'Wip'] }, 
  start_date: { type: Date },
  desired_finish_date: { type: Date },
  finish_date: { type: Date } 
});

export default model("Project", ProjectSchema);
