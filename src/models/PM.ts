import mongoose from "mongoose"

const pmSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  surname: { type: String, required: true },
})

const PM = mongoose.model("PM", pmSchema)
export default PM
