import mongoose from "mongoose"

const projectPMSchema = new mongoose.Schema({
  project_id: { type: String, required: true },
  pm_id: { type: String, required: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
})

const ProjectPM = mongoose.model("ProjectPM", projectPMSchema)
export default ProjectPM
