// src/services/openaiService.ts
import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ---------- Tipos ---------- */
export type ReadQuery = {
  collection: string;
  filter?: Record<string, any>;
  projection?: Record<string, 0 | 1>;
  limit?: number;
  sort?: Record<string, 1 | -1>;
  skip?: number;
};

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
const safeJSON = <T>(txt: string): T => {
  try {
    return JSON.parse(txt) as T;
  } catch {
    // intenta sacar el primer bloque JSON válido
    const match = txt.match(/\{[\s\S]*\}$/m);
    if (match) return JSON.parse(match[0]) as T;
    throw new Error("La respuesta de OpenAI no fue un JSON válido.");
  }
};

/* ---------- Prompts ---------- */
const READ_PROMPT = (question: string) => `
Sos un generador de consultas para MongoDB.
Tu salida debe ser **EXCLUSIVAMENTE** un JSON válido (sin backticks ni texto extra).

Colecciones permitidas (usa el nombre EXACTO):
- vendors
- projects
- quotes
- quotelines
- vendorevals
- vendorevallines
- preselectvendors
- projectvendors

Campos disponibles por colección:
vendors: ["id","name","reference_name","class","rubro","legal_type","legal_id","main_mail","in_contact_name","mobile","status","type","score_avg"]
projects: ["id","name"]
quotes: ["id","project_id","date"]
quotelines: ["id","line_no","product_id","reference","price","qty","delivery_date","project_id"]
vendorevals: ["eval_id","eval_name","vendor_id","start_date","due_date","type","attach_id"]
vendorevallines: ["eval_id","line_no","name","value","check","attach_id"]
preselectvendors: ["project_id","vendor_id","status"]
projectvendors: ["project_id","vendor_id","score","status"]

Sinónimos → campo correcto:
categoría/category -> rubro
tipo proveedor -> class
estado -> status
promedio/score -> score_avg
ítems de cotización -> quotelines
evaluación de proveedor -> vendorevals
detalle de evaluación -> vendorevallines

### FORMATO RESPUESTA
{
  "collection": "<colección>",
  "filter": { ... },          // {} si no hay filtros
  "projection": { ... },      // opcional
  "limit": 100,               // opcional
  "sort": { "campo": 1 },     // opcional
  "skip": 0                   // opcional
}

Reglas:
- Operadores Mongo válidos ($gte, $lte, $in, $regex, etc.).
- Fechas ISO "YYYY-MM-DD".
- No inventes colecciones ni campos.
- Nada fuera del JSON.

Pregunta del usuario:
"${question}"
`;

const WRITE_PROMPT = (question: string) => `
Sos un generador de operaciones de ESCRITURA MongoDB.
Debés devolver **solo** un JSON válido.

Acciones permitidas: "insertOne","insertMany","updateOne","updateMany","deleteOne","deleteMany"

Colecciones permitidas:
vendors, projects, quotes, quotelines, vendorevals, vendorevallines, preselectvendors, projectvendors

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
- NO inventes colecciones ni campos.
- insert* -> usa "data".
- update* -> usa "update" (con $set, $inc, etc).
- delete* -> solo "filter".
- Fechas ISO "YYYY-MM-DD".
- Si no hay intención clara de escribir, responde {"action":"none"}.

Campos por colección (mismos que arriba).

Pregunta del usuario:
"${question}"
`;

const NATURAL_PROMPT = (question: string, data: any) => `
Estás respondiendo como un agente técnico para una empresa.

Pregunta del usuario:
"${question}"

Resultados de la base de datos:
${JSON.stringify(data)}

Redactá una respuesta natural, clara y útil en español. Si no hay datos, indicá que no se encontraron resultados.
`;

/* ---------- Funciones ---------- */
export const getMongoQuery = async (question: string): Promise<ReadQuery> => {
  const resp = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    top_p: 0,
    messages: [{ role: "user", content: READ_PROMPT(question) }],
  });
  return safeJSON<ReadQuery>(resp.choices[0].message.content || "");
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
