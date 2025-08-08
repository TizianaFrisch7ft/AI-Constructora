// src/services/getSmartAnswerSmartWrite.ts
import dotenv from "dotenv";
import mongoose from "mongoose";

import { executeDynamicWrite } from "./mongoWriteService";
import { getMissingFieldsForCollection } from "../utils/getRequiredFields";


import { getMongoCrudPlan, getNaturalAnswer } from "./openaiService";
import { applyAliases, stripUnknownFields, normalize } from "./mongoShared";

// store para slot-filling
import {
  getPending,
  savePending,
  clearPending,
  mergeFields,
  type PendingWrite,
} from "./pendingWriteStore";

import Vendor from "../models/Vendor";
import Project from "../models/Project";
import QuoteRequest from "../models/QuoteRequest";
import QuoteRequestLine from "../models/QuoteRequestLine";
import Eval from "../models/Eval";
import EvalLine from "../models/Eval_line";
import ProjectVendor from "../models/ProjectVendor";
import PM from "../models/PM";
import ProjectPM from "../models/ProjectPM";
import SchedulePur from "../models/SchedulePur";
import SchedulePurLine from "../models/SchedulePurLine";

dotenv.config();

/* =========================
   Type guards para WriteOp
   ========================= */
// Si ya exportás WriteOp desde openaiService, preferí importarlo:
// import type { WriteOp } from "./openaiService";
type WriteOp =
  | {
      action: "insertOne" | "insertMany";
      collection: string;
      data: Record<string, any> | Record<string, any>[];
      options?: Record<string, any>;
      naturalSummary?: string;
      requiresConfirmation?: boolean;
    }
  | {
      action: "updateOne" | "updateMany";
      collection: string;
      filter: Record<string, any>;
      update: Record<string, any>;
      options?: Record<string, any>;
      naturalSummary?: string;
      requiresConfirmation?: boolean;
    }
  | {
      action: "deleteOne" | "deleteMany";
      collection: string;
      filter: Record<string, any>;
      options?: Record<string, any>;
      naturalSummary?: string;
      requiresConfirmation?: boolean;
    }
  | { action: "none"; naturalSummary?: string; requiresConfirmation?: boolean };

function isInsert(op: WriteOp): op is Extract<WriteOp, { action: "insertOne" | "insertMany" }> {
  return op.action === "insertOne" || op.action === "insertMany";
}
function isUpdate(op: WriteOp): op is Extract<WriteOp, { action: "updateOne" | "updateMany" }> {
  return op.action === "updateOne" || op.action === "updateMany";
}
function isDelete(op: WriteOp): op is Extract<WriteOp, { action: "deleteOne" | "deleteMany" }> {
  return op.action === "deleteOne" || op.action === "deleteMany";
}

/* =========================
   Requisitos por colección
   ========================= */
const REQUIRED_BY_COLLECTION: Record<string, string[]> = {
  vendor: ["name", "legal_id"], // ajustá según tu schema
  project: ["name"],
  // ...
};

type Dict = Record<string, any>;

function computeRequired(op: WriteOp): { requiredFields: string[]; baseFilled: Dict } {
  const coll = normalize((op as any).collection || "");
  const required = REQUIRED_BY_COLLECTION[coll] || [];
  const baseFilled: Dict = {};

  // si es insert y viene data base, precargamos los que ya estén completos
  if (isInsert(op) && op.data && !Array.isArray(op.data)) {
    for (const k of required) {
      if (op.data[k] != null && op.data[k] !== "") baseFilled[k] = op.data[k];
    }
  }
  // si es update y trae update.$set, también podría prellenar (opcional)
  if (isUpdate(op) && op.update && typeof op.update === "object") {
    const possible = { ...(op.update.$set || {}), ...op.update };
    for (const k of required) {
      if (possible[k] != null && possible[k] !== "") baseFilled[k] = possible[k];
    }
  }

  return { requiredFields: required, baseFilled };
}

function hasAllFields(p: PendingWrite) {
  return p.missingFields.length === 0;
}

/* =========================
   Servicio principal
   ========================= */
export const getSmartAnswerWithWrite = async (
  question: string,
  confirm = false,
  conversationId?: string,
  userProvided?: Dict
): Promise<{
  answer: string;
  entities: { type: string; name: string }[];
  nextAction?: "ask_missing_fields" | "execute" | "none";
  missingFields?: string[];
}> => {
  try {
    console.log("📥 Pregunta recibida:", question);

    // 0) Si hay op pendiente para esta conversación → intentamos completar y ejecutar
    if (conversationId) {
      const pending = getPending(conversationId);
      if (pending) {
        const merged = mergeFields(pending, userProvided || inferFieldsFromQuestion(question));

        if (!hasAllFields(merged)) {
          savePending(conversationId, merged);
          return {
            answer: `Me falta: **${merged.missingFields.join(", ")}**. Decime esos valores y sigo.`,
            entities: [],
            nextAction: "ask_missing_fields",
            missingFields: merged.missingFields,
          };
        }

        // Ya tengo todo → pido confirm o ejecuto
        if (!confirm) {
          savePending(conversationId, merged);
          return {
            answer:
              `Tengo todo para **${merged.action}** en **${merged.collection}**.\n` +
              `Decime \`confirm=true\` para ejecutar.\n\n` +
              "```json\n" + JSON.stringify(merged, null, 2) + "\n```",
            entities: [],
            nextAction: "execute",
          };
        }

        const result = await executeDynamicWrite(question, toWriteInput(merged), {
          dryRun: false,
          requireConfirm: true,
        });
        clearPending(conversationId);
        return {
          answer: "✅ Operación ejecutada:\n\n```json\n" + JSON.stringify(result, null, 2) + "\n```",
          entities: [],
          nextAction: "none",
        };
      }
    }

    // 1) Planner CRUD
    const plan = await getMongoCrudPlan(question);
    console.log("🧭 Plan:", JSON.stringify(plan, null, 2));

    // 2) Modo WRITE (create/update/delete)
    if (plan.mode === "write" && "operation" in plan) {
      const op = plan.operation as WriteOp;

      if (op.action === "none") {
        return { answer: "No veo una operación de escritura válida.", entities: [], nextAction: "none" };
      }

      if (!("collection" in op) || !(op as any).collection) {
        return { answer: "El plan no indica 'collection'.", entities: [], nextAction: "none" };
      }

      // Pre-asignar IDs en insert (limpio + id auto cuando falte)
      if (isInsert(op) && op.data) {
        const key = normalize(op.collection);
        const assignId = (obj: Record<string, any>) => {
          const clean = stripUnknownFields(key, applyAliases(key, obj));
          return {
            ...clean,
            id: clean.id ?? `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          };
        };
        (op as any).data = Array.isArray(op.data)
          ? (op.data as any[]).map(assignId)
          : assignId(op.data as Record<string, any>);
      }

      // Slot-filling: determinar campos requeridos por colección
      const { requiredFields, baseFilled } = computeRequired(op);

      // Construir pending en base al tipo de acción
      const pending: PendingWrite = {
        action: op.action as PendingWrite["action"],
        collection: normalize((op as any).collection),
        ...(isInsert(op) ? { data: (op as any).data } : {}),
        ...(isUpdate(op) ? { filter: (op as any).filter, update: (op as any).update } : {}),
        ...(isDelete(op) ? { filter: (op as any).filter } : {}),
        options: (isInsert(op) || isUpdate(op) || isDelete(op)) ? (op as any).options : undefined,
        requiredFields,
        missingFields: [],
        filled: { ...baseFilled },
        naturalSummary: (op as any).naturalSummary,
      };

      // Heurística: completar desde la misma frase
      mergeFields(pending, inferFieldsFromQuestion(question));
      pending.missingFields = pending.requiredFields.filter(
        (f) => pending.filled[f] == null || pending.filled[f] === ""
      );

      if (pending.missingFields.length > 0) {
        if (!conversationId) {
          return {
            answer:
              `Para **${pending.collection}** necesito: ${pending.requiredFields.join(", ")}.\n` +
              `Me falta **${pending.missingFields.join(", ")}**. Reintentá pasando un \`conversationId\` para continuar paso a paso.`,
            entities: [],
            nextAction: "ask_missing_fields",
            missingFields: pending.missingFields,
          };
        }
        savePending(conversationId, pending);
        return {
          answer: `Perfecto. Para crear/actualizar en **${pending.collection}** me falta: **${pending.missingFields.join(", ")}**.`,
          entities: [],
          nextAction: "ask_missing_fields",
          missingFields: pending.missingFields,
        };
      }

      // No faltan campos → confirmar o ejecutar
      if (!confirm) {
        if (conversationId) savePending(conversationId, pending);
        return {
          answer:
            `Tengo todo para **${pending.action}** en **${pending.collection}**.\n` +
            `Decime \`confirm=true\` para ejecutar.\n\n` +
            "```json\n" + JSON.stringify(pending, null, 2) + "\n```",
          entities: [],
          nextAction: "execute",
        };
      }

      const result = await executeDynamicWrite(question, toWriteInput(pending), {
        dryRun: false,
        requireConfirm: true,
      });
      if (conversationId) clearPending(conversationId);
      return {
        answer: "✅ Operación ejecutada:\n\n```json\n" + JSON.stringify(result, null, 2) + "\n```",
        entities: [],
        nextAction: "none",
      };
    }

    // 3) Modo READ (listar / consultar)
    if (plan.mode === "read" && "operation" in plan) {
      // Tipado laxo porque el plan de lectura puede ser steps/aggregate/etc.
      const op: any = plan.operation;
      const { collection, filter = {}, projection = {}, sort = {}, limit = 50 } = op.list || {};
      const Model = (mongoose.models as Record<string, mongoose.Model<any>>)[collection];
      if (!Model) {
        return { answer: `No encuentro la colección ${collection} para listar.`, entities: [], nextAction: "none" };
      }
      const rows = await Model.find(filter, projection).sort(sort).limit(limit).lean();
      const natural = op.naturalSummary || "Resultado";
      const answer = `${natural}:\n\n\`\`\`json\n${JSON.stringify(rows, null, 2)}\n\`\`\``;

      const [vendors, projects, quotes, quoteLines, evals, evalLines, projectVendors, pms, projectPMs, schedules, scheduleLines] =
        await Promise.all([
          Vendor.find().lean(),
          Project.find().lean(),
          QuoteRequest.find().lean(),
          QuoteRequestLine.find().lean(),
          Eval.find().lean(),
          EvalLine.find().lean(),
          ProjectVendor.find().lean(),
          PM.find().lean(),
          ProjectPM.find().lean(),
          SchedulePur.find().lean(),
          SchedulePurLine.find().lean(),
        ]);

      const entities = detectEntities(answer, {
        Vendor: vendors,
        Project: projects,
        QuoteRequest: quotes,
        QuoteRequestLine: quoteLines,
        Eval: evals,
        EvalLine: evalLines,
        ProjectVendor: projectVendors,
        PM: pms,
        ProjectPM: projectPMs,
        SchedulePur: schedules,
        SchedulePurLine: scheduleLines,
      });

      return { answer, entities, nextAction: "none" };
    }

    // 4) Fallback lectura natural con contexto
    const [vendors, projects, quotes, quoteLines, evals, evalLines, projectVendors, pms, projectPMs, schedules, scheduleLines] =
      await Promise.all([
        Vendor.find().lean(),
        Project.find().lean(),
        QuoteRequest.find().lean(),
        QuoteRequestLine.find().lean(),
        Eval.find().lean(),
        EvalLine.find().lean(),
        ProjectVendor.find().lean(),
        PM.find().lean(),
        ProjectPM.find().lean(),
        SchedulePur.find().lean(),
        SchedulePurLine.find().lean(),
      ]);

    const context = { vendors, projects, quotes, quoteLines, evals, evalLines, projectVendors, pms, projectPMs, schedules, scheduleLines };
    const naturalAns = (await getNaturalAnswer(question, context))?.trim() || "No se pudo generar respuesta.";

    const entities = detectEntities(naturalAns, {
      Vendor: vendors,
      Project: projects,
      QuoteRequest: quotes,
      QuoteRequestLine: quoteLines,
      Eval: evals,
      EvalLine: evalLines,
      ProjectVendor: projectVendors,
      PM: pms,
      ProjectPM: projectPMs,
      SchedulePur: schedules,
      SchedulePurLine: scheduleLines,
    });

    return { answer: naturalAns, entities, nextAction: "none" };
  } catch (err: any) {
    console.error("❌ Error en getSmartAnswerWithWrite:", err);
    throw new Error("Error generando la respuesta inteligente.");
  }
};

/* =========================
   Helpers
   ========================= */
function inferFieldsFromQuestion(q: string): Dict {
  // Heurística muy simple; podés mejorarla con un mini LLM si querés
  const mMail = q.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i);
  const mLegal = q.match(/\b\d{2}-\d{3,}\b/); // ej. 20-123
  const mName = q.match(/(?:proveedor|vendor|llamado|nombre)\s+([a-z0-9áéíóúüñ ._-]{2,})/i);
  const out: Dict = {};
  if (mMail) out.main_mail = mMail[0];
  if (mLegal) out.legal_id = mLegal[0];
  if (mName) out.name = mName[1].trim();
  return out;
}

function toWriteInput(op: PendingWrite) {
  // Ajuste final de payloads según acción (y limpieza)
  const coll = normalize(op.collection);
  const patched: any = { ...op };

  if (op.action.startsWith("insert")) {
    if (op.data && !Array.isArray(op.data)) {
      patched.data = stripUnknownFields(coll, applyAliases(coll, op.data));
    }
  }
  if (op.action.startsWith("update")) {
    // Si el filtro viene vacío, mongoWriteService pedirá confirm extra (guard-rail)
  }
  return patched;
}

function detectEntities(
  answer: string,
  collections: Record<string, any[]>
): { type: string; name: string }[] {
  const lower = answer.toLowerCase();
  const out: { type: string; name: string }[] = [];
  const seen = new Set<string>();
  const rules: Record<string, string[]> = {
    Vendor: ["name", "legal_id"],
    Project: ["name", "id"],
    QuoteRequest: ["qr_id", "reference"],
    QuoteRequestLine: ["reference", "product_id"],
    Eval: ["eval_id", "eval_name"],
    EvalLine: ["name"],
    ProjectVendor: ["project_id", "vendor_id"],
    PM: ["name", "surname", "email"],
    ProjectPM: ["project_id", "pm_id", "name", "surname"],
    SchedulePur: ["cc_id", "description"],
    SchedulePurLine: ["reference", "product_id"],
  };
  for (const [type, items] of Object.entries(collections)) {
    const fields = rules[type] || [];
    (items as any[]).forEach((item: Record<string, any>) => {
      for (const field of fields) {
        const raw = item?.[field];
        const val = String(raw ?? "").trim();
        if (val && lower.includes(val.toLowerCase())) {
          const key = `${type}-${val}`;
          if (!seen.has(key)) {
            out.push({ type, name: val });
            seen.add(key);
          }
          break;
        }
      }
    });
  }
  return out;
}
