// src/services/openaiService.ts
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import dotenv from "dotenv";
import { safeJSON } from "../utils/safeJSON"; // ajusta el path si es necesario
import mongoose from "mongoose";

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ---------- Tipos de plan de lectura/escritura (EXISTENTES) ---------- */
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

/* ---------- NUEVOS tipos para planner CRUD sin romper lo demás ---------- */
export type CrudPlan =
  | {
      mode: "write";
      operation: (WriteOp & {
        requiresConfirmation?: boolean;
        naturalSummary?: string;
      });
    }
  | {
      mode: "read";
      operation: {
        list: {
          collection: string;
          filter?: any;
          projection?: any;
          sort?: any;
          limit?: number;
        };
        naturalSummary?: string;
      };
    }
  | { mode: "none" };

/* ---------- Helpers ---------- */
const isComparisonRequest = (question: string): boolean => {
  const lower = question.toLowerCase();
  return (
    lower.includes("comparar") ||
    lower.includes("comparación") ||
    lower.includes("cuál es mejor") ||
    lower.includes("mejor precio") ||
    lower.includes("más conveniente") ||
    lower.includes(" vs ") ||
    lower.includes("versus")
  );
};

/** META real desde Mongoose (colecciones, campos y alias) */
function getModelMeta(): Record<string, { fields: string[]; aliases: Record<string, string> }> {
  const meta: Record<string, { fields: string[]; aliases: Record<string, string> }> = {};
  for (const [name, model] of Object.entries(mongoose.models)) {
   
    const schema = (model as any).schema as mongoose.Schema;
    const paths = Object.keys(schema?.paths || {});
    const aliases: Record<string, string> = {};

    Object.values(schema?.paths || {}).forEach((p: any) => {
      if (p?.options?.alias && typeof p.path === "string") {
        aliases[p.options.alias as string] = p.path as string;
      }
    });
    meta[name] = { fields: paths, aliases };
  }
  return meta;
}

/* ---------- Prompts ---------- */
const comparisonPrompt = `
Sos un experto en compras. Tu tarea es **comparar cotizaciones entre proveedores** y mostrarlo con claridad.

🧾 Instrucciones:
1. Identificá los productos cotizados por cada proveedor.
2. Armá una tabla exacta en Markdown:

| Ítem | Proveedor A | Proveedor B | Selección |
|------|-------------|-------------|-----------|

- “Ítem”: nombre del producto o referencia.
- “Proveedor A” y “Proveedor B”: precio cotizado.
- “Selección”: cuál es mejor y por qué (ej: “Proveedor A (por mejor precio)”).
- Si un proveedor no cotizó, poné “-”.

3. Si hay más de dos proveedores, agregá columnas adicionales.
4. Al final, una conclusión breve del criterio de elección.

⚠️ Si no hay datos suficientes, devolvé **“No hay suficientes datos para hacer una comparación.”**
`;

const NATURAL_PROMPT = (question: string, data: any) => `
Eres un asistente que responde consultas sobre nuestra base de datos de construcción.

1. Comienza con una frase natural (“Claro, esto es lo que encontré:”, etc).
2. Presenta los datos recibidos en \`data\`:
   - Si vienen objetos simples, haz una lista.
   - Si son objetos con múltiples campos, haz una tabla en Markdown.
3. Al final, sección **Entidades detectadas:** con badges en línea → \`[tipo: valor]\`.
4. Si no hay resultados, “Lo siento, no encontré resultados para esa consulta.”

Consulta:
\`\`\`
${question}
\`\`\`

Datos JSON:
\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`;

const READ_PROMPT = (question: string) => `
Sos un generador de consultas para MongoDB.
Tu salida debe ser **EXCLUSIVAMENTE** un JSON válido (sin backticks ni texto extra).

... aquí va el resto de tu prompt de lectura ...

Pregunta del usuario:
"${question}"
`;

const WRITE_PROMPT = (question: string) => `
Sos un generador de planes de escritura para MongoDB.
Tu única tarea es devolver un JSON válido con una instrucción de escritura.

... aquí va el resto de tu prompt de escritura ...

Consulta del usuario:
"${question}"
`;

/* ---------- Funciones EXISTENTES (no se tocan) ---------- */
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

export const getNaturalAnswer = async (
  question: string,
  data: any
): Promise<string> => {
  const cmp = isComparisonRequest(question);

  const messages: ChatCompletionMessageParam[] = cmp
    ? [
        { role: "system", content: comparisonPrompt },
        {
          role: "user",
          content: `Datos JSON:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
        },
      ]
    : [
        {
          role: "system",
          content: NATURAL_PROMPT(question, data),
        },
      ];
  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages,
  });

  return resp.choices[0].message.content?.trim() || "No se pudo generar una respuesta.";
};

/* ---------- NUEVO planner CRUD que NO rompe lo anterior ---------- */
export async function getMongoCrudPlan(question: string): Promise<CrudPlan> {
  const meta = getModelMeta();
  const collections = Object.keys(meta);

  const system = `
Sos un planner de operaciones CRUD para MongoDB. Respondés SOLO JSON válido.
Usá EXCLUSIVAMENTE colecciones y campos provistos en "meta".
Salidas permitidas:

1) Escritura:
{
  "mode": "write",
  "operation": {
    "action": "insertOne"|"insertMany"|"updateOne"|"updateMany"|"deleteOne"|"deleteMany",
    "collection": "<ExactName>",
    "data": object | object[]?,
    "filter": object?,
    "update": object?,
    "options": object?,
    "requiresConfirmation": boolean?,
    "naturalSummary": "texto breve"
  }
}

2) Lectura/listar:
{
  "mode": "read",
  "operation": {
    "list": {
      "collection": "<ExactName>",
      "filter": object?,
      "projection": object?,
      "sort": object?,
      "limit": number?
    },
    "naturalSummary": "texto breve"
  }
}

3) Ninguna:
{ "mode": "none" }

Reglas:
- "collection" debe estar en meta.
- Campos en data/filter/update solo de meta[collection].fields o alias meta[collection].aliases.
- Si es riesgoso (deleteMany/updateMany sin filtro claro) setea "requiresConfirmation": true.
- Si no hay info suficiente, devolvé {"mode":"none"}.
`;

  const user = `
meta: ${JSON.stringify(meta, null, 2)}

instrucción: ${question}

Devolvé SOLO un JSON válido como se especifica (sin comentarios ni backticks).
`;

  const resp = await openai.chat.completions.create({
    model: "gpt-4o",
    temperature: 0,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const raw = resp.choices?.[0]?.message?.content?.trim() || `{"mode":"none"}`;
  let plan: CrudPlan;
  try {
    plan = JSON.parse(raw) as CrudPlan;
  } catch {
    return { mode: "none" };
  }

  const op: any = (plan as any).operation;
  const coll: string | undefined = op?.collection || op?.list?.collection;
  if (plan.mode !== "none" && coll && !collections.includes(coll)) {
    return { mode: "none" };
  }

  return plan;
}
