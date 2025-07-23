import { Schema, model } from "mongoose";

const ProjectSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true }
});

export default model("Project", ProjectSchema);

