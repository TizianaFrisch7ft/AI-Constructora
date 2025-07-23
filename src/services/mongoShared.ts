// src/services/mongoShared.ts
import mongoose from "mongoose";
import Vendor from "../models/Vendor";
import Project from "../models/Project";
import Quote from "../models/Quote";
import QuoteLine from "../models/QuoteLine";
import VendorEval from "../models/VendorEval";
import VendorEvalLine from "../models/VendorEvalLine";
import PreselectVendor from "../models/PreselectVendor";
import ProjectVendor from "../models/ProjectVendor";

export const models: Record<string, mongoose.Model<any>> = {
  vendors: Vendor,
  projects: Project,
  quotes: Quote,
  quotelines: QuoteLine,
  vendorevals: VendorEval,
  vendorevallines: VendorEvalLine,
  preselectvendors: PreselectVendor,
  projectvendors: ProjectVendor,
};

export const FIELDS: Record<string, string[]> = {
  vendors: ["id","name","reference_name","class","rubro","legal_type","legal_id","main_mail","in_contact_name","mobile","status","type","score_avg"],
  projects: ["id","name"],
  quotes: ["id","project_id","date"],
  quotelines: ["id","line_no","product_id","reference","price","qty","delivery_date","project_id"],
  vendorevals: ["eval_id","eval_name","vendor_id","start_date","due_date","type","attach_id"],
  vendorevallines: ["eval_id","line_no","name","value","check","attach_id"],
  preselectvendors: ["project_id","vendor_id","status"],
  projectvendors: ["project_id","vendor_id","score","status"],
};

const FIELD_ALIAS: Record<string, Record<string, string>> = {
  vendors: {
    category: "rubro",
    promedio: "score_avg",
    score: "score_avg",
    tipo: "class",
    estado: "status",
    vendorid: "id",
    vendor_id: "id",
    vendorId: "id",     // por si llega con camelCase
  },
  // ...
};

export const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, "");

export const applyAliases = (col: string, filter: Record<string, any>) => {
  const aliases = FIELD_ALIAS[col] || {};
  const out: any = {};
  for (const k of Object.keys(filter || {})) {
    const realKey = aliases[k] || k;
    out[realKey] = filter[k];
  }
  return out;
};

export const stripUnknownFields = (col: string, obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;
  const allowed = new Set(FIELDS[col] || []);
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$")) {
      clean[key] = stripUnknownFields(col, obj[key]);
    } else if (allowed.has(key)) {
      const val = obj[key];
      clean[key] = val && typeof val === "object" && !Array.isArray(val)
        ? stripUnknownFields(col, val)
        : val;
    }
  }
  return clean;
};
