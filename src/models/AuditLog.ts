// src/models/AuditLog.ts
import { Schema, model } from "mongoose";

const AuditLogSchema = new Schema(
  {
    action: { type: String, required: true },
    coll:   { type: String, required: true },
    filter: { type: Object },
    payload:{ type: Object },
    options:{ type: Object },
    result: { type: Object },
    before: { type: Object },
    after:  { type: Object },
    question:{ type: String },
    created_at: { type: Date, default: Date.now },
  },
  { versionKey: false, collection: "auditlogs" }
);

export default model("AuditLog", AuditLogSchema);
