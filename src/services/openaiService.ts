// src/services/openaiService.ts
import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ---------- Tipos ---------- */
export type FindStep = {
  mode: "find";
  collection: string;
  filter?: Record<string, any>;
  projection?: Record<string, 0 | 1>;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  skip?: number;
};

export type AggregateStep = {
  mode: "aggregate";
  collection: string;
  pipeline: any[];
};

export type ReadPlan =
  | FindStep
  | AggregateStep
  | { steps: Array<FindStep | AggregateStep> };

export type WriteOp =
  | {
      action: "insertOne" | "insertMany";
      collection: string;
      data: Record<string, any> | Record<string, any>[];
      options?: Record<string, any>;
    }
  | {
      action: "updateOne" | "updateMany";
      collection: string;
      filter: Record<string, any>;
      update: Record<string, any>;
      options?: Record<string, any>;
    }
  | {
      action: "deleteOne" | "deleteMany";
      collection: string;
      filter: Record<string, any>;
      options?: Record<string, any>;
    }
  | { action: "none" };

/* ---------- Helpers ---------- */
const cleanLLMText = (txt: string) =>
  txt
    .replace(/```json|```/g, "")
    .replace(/ISODate\(\"([^"]+)\"\)/g, '"$1"')
    .replace(/\$number(Int|Long)\(\"(\d+)\"\)/g, "$2");

const safeJSON = <T>(txt: string): T => {
  const cleaned = cleanLLMText(txt.trim());
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}$/m);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("La respuesta de OpenAI no fue un JSON válido.");
  }
};

/* ---------- Prompts ---------- */
const COLLECTION_LIST = `
Colecciones permitidas (usa el nombre EXACTO):
- vendors
- projects
- quotes
- quotelines
- vendorevals
- vendorevallines
- preselectvendors
- projectvendors
- rfqs
- consumablereqs
- deliveryissues
`;

const FIELDS_DESC = `
Campos disponibles por colección:
vendors: ["id","name","reference_name","class","rubro","legal_type","legal_id","main_mail","in_contact_name","mobile","status","type","score_avg"]
projects: ["id","name"]
quotes: ["id","project_id","vendor_id","date"]
quotelines: ["id","line_no","product_id","reference","price","qty","delivery_date","project_id"]
vendorevals: ["eval_id","eval_name","vendor_id","start_date","due_date","type","attach_id"]
vendorevallines: ["eval_id","line_no","name","value","check","attach_id"]
preselectvendors: ["project_id","vendor_id","status"]
projectvendors: ["project_id","vendor_id","score","status"]
rfqs: ["rfq_id","project_id","vendor_id","products","sent_at","responded_at","status"]
consumablereqs: ["req_id","project_id","pm_id","pm_name","product_id","qty","due_date","status","created_at"]
deliveryissues: ["issue_id","vendor_id","project_id","type","description","occurred_at","resolved"]
`;

const READ_PROMPT = (question: string) => `
Sos un generador de consultas para MongoDB.
Tu salida debe ser **EXCLUSIVAMENTE** un JSON válido (sin backticks ni texto extra).

Podés devolver:
1) Find simple
{
  "mode": "find",
  "collection": "...",
  "filter": {...},
  "projection": {...},
  "limit": 100,
  "sort": {"campo": 1},
  "skip": 0
}

2) Aggregate
{
  "mode": "aggregate",
  "collection": "...",
  "pipeline": [ { "$match": {...} }, { "$group": {...} }, ... ]
}

3) Secuencia de pasos
{
  "steps": [ {<find|aggregate>}, {<find|aggregate>} ]
}

${COLLECTION_LIST}

${FIELDS_DESC}

Sinónimos → campo correcto:
categoría/category -> rubro
tipo proveedor -> class
estado -> status
promedio/score -> score_avg
ítems de cotización -> quotelines
evaluación de proveedor -> vendorevals
detalle de evaluación -> vendorevallines
RFQ -> rfqs
requerimiento de consumible -> consumablereqs
problema de entrega / calidad -> deliveryissues

Reglas:
- Solo esas colecciones y campos.
- Operadores Mongo válidos: $gte, $lte, $in, $regex, $eq, $ne, $and, $or, etc.
- Fechas como string "YYYY-MM-DD".
- Si necesitás totales/mínimos/etc., usá aggregate con $match,$project,$group,$sort,$limit,$skip,$unwind,$lookup.
- NO agregues nada fuera del JSON.

**CASO ESPECIAL - “precios más bajos por producto y consolidar por proveedor y por obra”**
Usá este patrón (ajustá filtros si hace falta):
{
  "mode": "aggregate",
  "collection": "quotelines",
  "pipeline": [
    { "$lookup": { "from": "quotes", "localField": "id", "foreignField": "id", "as": "q" } },
    { "$unwind": "$q" },
    { "$project": {
        "project_id": "$q.project_id",
        "vendor_id": "$q.vendor_id",
        "product_id": 1,
        "reference": 1,
        "price": 1,
        "qty": 1
    }},
    { "$sort": { "project_id": 1, "product_id": 1, "price": 1 } },
    { "$group": {
        "_id": { "project_id": "$project_id", "product_id": "$product_id" },
        "line": { "$first": "$$ROOT" }
    }},
    { "$group": {
        "_id": { "project_id": "$line.project_id", "vendor_id": "$line.vendor_id" },
        "items": {
          "$push": { "product_id": "$line.product_id", "reference": "$line.reference", "qty": "$line.qty", "price": "$line.price" }
        }
    }},
    { "$sort": { "_id.project_id": 1, "_id.vendor_id": 1 } }
  ]
}

Pregunta del usuario:
"${question}"
`;

const WRITE_PROMPT = (question: string) => `
Sos un generador de operaciones de ESCRITURA MongoDB.
Debés devolver **solo** un JSON válido.

Acciones permitidas: "insertOne","insertMany","updateOne","updateMany","deleteOne","deleteMany"

${COLLECTION_LIST}

Salida obligatoria:
{
  "action": "<acción>",
  "collection": "<colección>",
  "filter": { ... },          // requerido para update/delete
  "update": { ... },          // requerido para update*
  "data": { ... } | [ ... ],  // requerido para insert*
  "options": { ... }          // opcional
}

Reglas:
- NO inventes colecciones ni campos. Usá los campos válidos informados.
- insert* -> "data".
- update* -> "update" ($set, $inc, etc).
- delete* -> solo "filter".
- Fechas "YYYY-MM-DD".
- Si no hay intención clara de escribir: {"action":"none"}.

Pregunta del usuario:
"${question}"
`;

const NATURAL_PROMPT = (question: string, data: any) => `
Estás respondiendo como un agente técnico.

IMPORTANTE:
- Si hay datos, NO digas que no hay resultados.
- Usa exactamente lo que hay en "data".
- Agrupa y presenta claro (títulos, listas, tablas).
- Si no hay datos, decilo.

Pregunta:
${question}

Datos (JSON):
${JSON.stringify(data)}

Redactá en español usando **Markdown limpio**.
`;

/* ---------- Funciones ---------- */
export const getMongoQuery = async (question: string): Promise<ReadPlan> => {
  const resp = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    top_p: 0,
    messages: [{ role: "user", content: READ_PROMPT(question) }],
  });
  return safeJSON<ReadPlan>(resp.choices[0].message.content || "");
};

export const getMongoWriteOp = async (question: string): Promise<WriteOp> => {
  const resp = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    top_p: 0,
    messages: [{ role: "user", content: WRITE_PROMPT(question) }],
  });
  return safeJSON<WriteOp>(resp.choices[0].message.content || "");
};

export const getNaturalAnswer = async (question: string, data: any): Promise<string> => {
  const resp = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0.2,
    messages: [{ role: "user", content: NATURAL_PROMPT(question, data) }],
  });
  return resp.choices[0].message.content?.trim() || "No se pudo generar una respuesta.";
};
