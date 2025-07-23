// src/services/mongoReadService.ts
import {
  models,
  normalize,
  applyAliases,
  stripUnknownFields,
  FIELDS,
} from "./mongoShared";
import { ReadPlan, FindStep, AggregateStep } from "./openaiService";

type AnyStep = FindStep | AggregateStep;

const sanitizeProjection = (col: string, proj?: Record<string, 0 | 1>) => {
  if (!proj) return undefined;
  const allowed = new Set(FIELDS[col] || []);
  const out: any = {};
  for (const k of Object.keys(proj)) {
    if (allowed.has(k) || k === "_id") out[k] = proj[k];
  }
  return Object.keys(out).length ? out : undefined;
};

const removeEmptyFilters = (obj: any): any => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      obj[k] = removeEmptyFilters(obj[k]);
      if (obj[k] && typeof obj[k] === "object" && Object.keys(obj[k]).length === 0) {
        delete obj[k];
      }
    }
  }
  return obj;
};

const fixProjectStage = (stage: any) => {
  const body = stage.$project;
  if (!body || typeof body !== "object") return stage;
  if (Object.keys(body).length === 0) stage.$project = { _id: 0 };
  return stage;
};

const cleanMatch = (col: string, matchObj: any) => {
  let m = applyAliases(col, matchObj || {});
  m = stripUnknownFields(col, m);
  m = removeEmptyFilters(m);
  return m;
};

const cleanPipeline = (col: string, pipeline: any[]): any[] => {
  const allowedStages = new Set([
    "$match",
    "$project",
    "$group",
    "$sort",
    "$limit",
    "$skip",
    "$unwind",
    "$lookup",
  ]);

  return (pipeline || []).map((stage: any) => {
    const keys = Object.keys(stage);
    if (keys.length !== 1) throw new Error("Stage inválido");
    const k = keys[0];
    if (!allowedStages.has(k)) throw new Error("Stage no permitido: " + k);

    if (k === "$match") stage.$match = cleanMatch(col, stage.$match);

    if (k === "$lookup") {
      const { from, localField, foreignField, as } = stage.$lookup || {};
      stage.$lookup = { from, localField, foreignField, as };
    }

    if (k === "$project") stage = fixProjectStage(stage);

    return stage;
  });
};

const runFind = async (step: FindStep) => {
  const key = normalize(step.collection);
  const Model = models[key];
  if (!Model) throw new Error("No existe la colección: " + step.collection);

  let filter = applyAliases(key, step.filter ?? {});
  filter = stripUnknownFields(key, filter);
  filter = removeEmptyFilters(filter);

  const projection = sanitizeProjection(key, step.projection);
  const limit = Number.isInteger(step.limit) ? step.limit! : 200;
  const skip = Number.isInteger(step.skip) ? step.skip! : 0;
  const sort = step.sort ?? undefined;

  return Model.find(filter, projection).sort(sort).skip(skip).limit(limit).lean();
};

const runAggregate = async (step: AggregateStep) => {
  const key = normalize(step.collection);
  const Model = models[key];
  if (!Model) throw new Error("No existe la colección: " + step.collection);

  const pipeline = cleanPipeline(key, step.pipeline || []);
  return Model.aggregate(pipeline).exec();
};

export const executeDynamicQuery = async (plan: ReadPlan) => {
  if ("steps" in plan && Array.isArray(plan.steps)) {
    const results: any[] = [];
    for (const s of plan.steps as AnyStep[]) {
      if (s.mode === "find") results.push(await runFind(s));
      else if (s.mode === "aggregate") results.push(await runAggregate(s));
      else throw new Error("Paso desconocido: " + JSON.stringify(s));
    }
    return results;
  }

  if ((plan as FindStep).mode === "find") return runFind(plan as FindStep);
  if ((plan as AggregateStep).mode === "aggregate") return runAggregate(plan as AggregateStep);

  throw new Error("Plan de lectura inválido");
};
