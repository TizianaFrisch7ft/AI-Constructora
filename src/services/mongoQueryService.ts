// src/services/mongoQueryService.ts
import mongoose from "mongoose";
import Vendor from "../models/Vendor";
import Project from "../models/Project";
import Quote from "../models/Quote";
import QuoteLine from "../models/QuoteLine";
import VendorEval from "../models/VendorEval";
import VendorEvalLine from "../models/VendorEvalLine";
import PreselectVendor from "../models/PreselectVendor";
import ProjectVendor from "../models/ProjectVendor";

type QueryInput = {
  collection: string;
  filter?: Record<string, any>;
  projection?: Record<string, 0 | 1>;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
};

const models: Record<string, mongoose.Model<any>> = {
  vendors: Vendor,
  projects: Project,
  quotes: Quote,
  quotelines: QuoteLine,
  vendorevals: VendorEval,
  vendorevallines: VendorEvalLine,
  preselectvendors: PreselectVendor,
  projectvendors: ProjectVendor,
};

// Campos válidos por colección (evita que el LLM meta campos fantasmas)
const FIELDS: Record<string, string[]> = {
  vendors: ["id","name","reference_name","class","rubro","legal_type","legal_id","main_mail","in_contact_name","mobile","status","type","score_avg"],
  projects: ["id","name"],
  quotes: ["id","project_id","date"],
  quotelines: ["id","line_no","product_id","reference","price","qty","delivery_date","project_id"],
  vendorevals: ["eval_id","eval_name","vendor_id","start_date","due_date","type","attach_id"],
  vendorevallines: ["eval_id","line_no","name","value","check","attach_id"],
  preselectvendors: ["project_id","vendor_id","status"],
  projectvendors: ["project_id","vendor_id","score","status"],
};

// Alias simples por colección (corrige errores del prompt)
const FIELD_ALIAS: Record<string, Record<string, string>> = {
  vendors: {
    category: "rubro",
    promedio: "score_avg",
    score: "score_avg",
    tipo: "class",
    estado: "status",
  },
  // podés agregar alias para otras colecciones si querés
};

const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s_-]+/g, "");

const applyAliases = (col: string, filter: Record<string, any>) => {
  const aliases = FIELD_ALIAS[col] || {};
  const out: any = {};
  for (const k of Object.keys(filter || {})) {
    const realKey = aliases[k] || k;
    out[realKey] = filter[k];
  }
  return out;
};

const stripUnknownFields = (col: string, obj: any): any => {
  if (!obj || typeof obj !== "object") return obj;
  const allowed = new Set(FIELDS[col] || []);
  const clean: any = {};
  for (const key of Object.keys(obj)) {
    // Mantener operadores Mongo ($gte, $in, etc.)
    if (key.startsWith("$")) {
      clean[key] = stripUnknownFields(col, obj[key]);
    } else if (allowed.has(key)) {
      const val = obj[key];
      if (val && typeof val === "object" && !Array.isArray(val)) {
        clean[key] = stripUnknownFields(col, val);
      } else {
        clean[key] = val;
      }
    }
  }
  return clean;
};

export const executeDynamicQuery = async (query: QueryInput) => {
  if (!query?.collection) throw new Error("Consulta inválida: falta 'collection'");
  const key = normalize(query.collection);
  const Model = models[key];
  if (!Model) throw new Error("No se encontró la colección: " + query.collection);

  // Filtros
  let filter = query.filter ?? {};
  filter = applyAliases(key, filter);
  filter = stripUnknownFields(key, filter);

  const projection = query.projection ?? undefined;
  const limit = Number.isInteger(query.limit) ? query.limit! : 200;
  const skip = Number.isInteger(query.skip) ? query.skip! : 0;
  const sort = query.sort ?? undefined;

  // Opcional: log para debug
  // console.log("🔎 Ejecutando find:", { key, filter, projection, sort, limit, skip });

  const data = await Model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean();
  return data;
};
