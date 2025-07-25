import { Schema, model } from "mongoose";

const EvalLineSchema = new Schema({
  eval_id: { type: String, required: true }, // ID de la evaluación padre
  line_no: { type: Number, required: true }, // número de línea de la evaluación
  name: { type: String, required: true }, // texto del criterio
  value: { type: Schema.Types.Mixed }, // puede ser 'Y', 'N' o número (ej: 3.5)
  check: { type: String, enum: ['Y', 'N'], default: 'N' },
  attach_id: { type: String } // archivo relacionado
});

export default model("EvalLine", EvalLineSchema);
