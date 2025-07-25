import mongoose from "mongoose"
import Vendor from "../models/Vendor"
import Project from "../models/Project"
import QuoteRequest from "../models/QuoteRequest"
import QuoteRequestLine from "../models/QuoteRequestLine"
import Eval from "../models/Eval"
import EvalLine from "../models/Eval_line"
import ProjectVendor from "../models/ProjectVendor"
import PM from "../models/PM"
import ProjectPM from "../models/ProjectPM"
import SchedulePur from "../models/SchedulePur"
import SchedulePurLine from "../models/SchedulePurLine"

export const normalize = (s: string) =>
  s.trim().toLowerCase().replace(/[\s_-]+/g, "")

export const models: Record<string, mongoose.Model<any>> = {
  vendor: Vendor,
  project: Project,
  quoterequest: QuoteRequest,
  quoterequestline: QuoteRequestLine,
  eval: Eval,
  evalline: EvalLine,
  projectvendor: ProjectVendor,
  pm: PM,
  projectpm: ProjectPM,
  schedulepur: SchedulePur,
  schedulepurline: SchedulePurLine,
}

export const FIELDS: Record<string, string[]> = {
  vendor: ["id", "name", "legal_id", "category", "status"],
  project: ["id", "name", "client_name", "status"],
  quoterequest: ["qr_id", "reference", "project_id"],
  quoterequestline: ["id", "qr_id", "product_id", "reference"],
  eval: ["eval_id", "eval_name", "project_id"],
  evalline: ["name", "criteria", "score", "eval_id"],
  projectvendor: ["project_id", "vendor_id", "status"],
  pm: ["id", "name", "surname", "email"],
  projectpm: ["project_id", "pm_id", "name", "surname"],
  schedulepur: ["cc_id", "description", "project_id"],
  schedulepurline: ["reference", "product_id", "cc_id"],
}

export const applyAliases = (
  col: string,
  filter: Record<string, any>
): Record<string, any> => {
  const key = normalize(col)
  const allowed = FIELDS[key] || []
  const out: Record<string, any> = {}

  for (const [k, v] of Object.entries(filter)) {
    const norm = normalize(k)
    const match = allowed.find((f) => normalize(f) === norm)
    if (match) {
      out[match] = v
    }
  }

  return out
}

export const stripUnknownFields = (col: string, obj: any): any => {
  const key = normalize(col)
  const allowed = FIELDS[key] || []
  const result: any = {}

  for (const [k, v] of Object.entries(obj)) {
    if (allowed.includes(k)) {
      result[k] = v
    }
  }

  return result
}
