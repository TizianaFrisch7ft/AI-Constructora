// src/services/openaiService.ts
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import dotenv from "dotenv";
import { safeJSON } from "../utils/safeJSON";
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
      operation: WriteOp & {
        requiresConfirmation?: boolean;
        naturalSummary?: string;
      };
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
export const isComparisonRequest = (question: string, data?: any): boolean => {
  const lower = question.toLowerCase();
  const keywords = [
    "comparar", "comparación", "compará", "comparame", "cuál es mejor", "mejor precio",
    "más conveniente", " vs ", "versus", "cotización", "cotizaciones", "cuál conviene",
    "precio bajo", "diferencia de precio", "qué proveedor"
  ];
  if (keywords.some(k => lower.includes(k))) return true;
  // Si hay varias cotizaciones en data, forzar comparación
  if (data?.quoteLines && Array.isArray(data.quoteLines) && data.quoteLines.length > 1) return true;
  return false;
};

/** META real desde Mongoose (colecciones, campos y alias) */
function getModelMeta(): Record<string, { fields: string[]; aliases: Record<string, string> }> {
  const meta: Record<string, { fields: string[]; aliases: Record<string, string> }> = {};
  const allModels = mongoose.models as Record<string, mongoose.Model<any>>;

  for (const [name, model] of Object.entries(allModels)) {
    const schema = (model as any)?.schema as mongoose.Schema | undefined;
    const paths = Object.keys(schema?.paths ?? {});
    const aliases: Record<string, string> = {};

    const schemaPaths = Object.values(schema?.paths ?? {}) as any[];
    for (const p of schemaPaths) {
      const alias = p?.options?.alias;
      if (alias && typeof alias === "string" && typeof p.path === "string") {
        aliases[alias] = p.path as string;
      }
    }

    meta[name] = { fields: paths, aliases };
  }
  return meta;
}

/* ---------- Prompts ---------- */
const comparisonPrompt = `
Sos un experto en compras. Tu tarea es **comparar cotizaciones entre proveedores** y mostrarlo con claridad.

🧾 Instrucciones (OBLIGATORIAS):
1) Identificá los productos cotizados por cada proveedor (usá "reference" o "product_id") y **agrupá por misma moneda**.
2) Calculá la **mediana** del precio en cada grupo.
3) Marcá como **"Precio atípicamente bajo — posible error de tipeo o dato no fiable (ENGAÑOSO)"** toda oferta que cumpla:
   - price < 0.6 × mediana; **o**
   - price < (mediana − 2.5 × MAD) si calculás MAD (desvío absoluto mediano).
   Si hay < 3 precios válidos en un grupo, **no** marques outliers y aclaralo.
4) No descartes ofertas automáticamente: **sugerí verificar** con el proveedor (moneda, coma/punto decimal, unidades, alcance técnico, impuestos, garantía).
5) Mostrá **tabla Markdown**. Agregá una columna **"Notas"** para marcar los casos atípicos y recomendaciones.
6) Si hay más de dos proveedores, agregá columnas adicionales.
7) Cerrá con una **conclusión breve** explicando el criterio de selección y ADVERTÍ al usuario si hay precios engañosos o posibles errores de tipeo.

- “Ítem”: nombre del producto/referencia.
- “Proveedor X”: precio cotizado (con moneda).
- “Selección”: cuál conviene y por qué (ej: “Proveedor A por mejor precio total”).
- “Notas”: poné “Precio atípicamente bajo — posible error de tipeo o dato no fiable (ENGAÑOSO)” cuando aplique.

⚠️ Si no hay datos suficientes, devolvé **"No hay suficientes datos para hacer una comparación."**
`;


const NATURAL_PROMPT = (question: string, data: any) => `
Eres un asistente que responde consultas sobre nuestra base de datos de construcción.

Reglas de presentación:
1. Comienza con una frase natural (“Claro, esto es lo que encontré:”).
2. Presenta los datos recibidos en \`data\`:
   - Si vienen objetos simples, haz una lista.
   - Si son objetos con múltiples campos, haz una tabla en Markdown.
3. Al final, sección **Entidades detectadas:** con badges en línea → \`[tipo: valor]\`.
4. Si no hay resultados, “Lo siento, no encontré resultados para esa consulta.”.

Revisión de precios (aplicar si \`data.quoteLines\` existe):
- Agrupa por mismo \`reference\` o \`product_id\` y misma \`currency\`.
- Calcula la mediana del precio en cada grupo.
- Señala como **"Precio atípicamente bajo — posible error de tipeo o dato no fiable"** cualquier precio con:
  * price < 0.6 × mediana; o
  * price < (mediana − 2.5 × MAD) si calculas MAD.
- Si un grupo tiene < 3 precios válidos, no marques outliers y acláralo.
- Si te piden comparar cotizaciones de algun producto, si el precio en comparacion a los demas es muy bajo, marca como **"ENGAÑOSO"** y sugiere verificar con el proveedor.
- No descartes automáticamente: sugiere verificar **moneda, decimales, unidades, alcance técnico, impuestos y garantía**.
- Si presentas tabla comparativa, agrega una columna **"Notas"** y marca ahí los casos atípicos.

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

Reglas:
- Devolvé un objeto JSON que represente un plan de lectura (find/aggregate/steps).
- No incluyas comentarios ni texto fuera del JSON.

Pregunta del usuario:
"${question}"
`;

const WRITE_PROMPT = (question: string) => `
Sos un generador de planes de escritura para MongoDB.
Tu única tarea es devolver un JSON válido con una instrucción de escritura.

Reglas:
- Devolvé un objeto JSON con action/collection y data|filter|update según corresponda.
- No incluyas comentarios ni texto fuera del JSON.

Consulta del usuario:
"${question}"
`;

/* ---------- Funciones EXISTENTES (no se tocan firmas) ---------- */
export const getMongoQuery = async (question: string): Promise<ReadPlan> => {
  const resp = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    top_p: 0,
    messages: [{ role: "user", content: READ_PROMPT(question) }],
  });
  return safeJSON<ReadPlan>(resp.choices[0].message.content || "") ?? { steps: [] };
};

export const getMongoWriteOp = async (question: string): Promise<WriteOp> => {
  const resp = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    temperature: 0,
    top_p: 0,
    messages: [{ role: "user", content: WRITE_PROMPT(question) }],
  });
  return safeJSON<WriteOp>(resp.choices[0].message.content || "") ?? { action: "none" };
};

export const getNaturalAnswer = async (
  question: string,
  data: any
): Promise<string> => {
  // 🔹 Determinar si es una comparación real
  const cmp = isComparisonRequest(question, data);

  // Si es comparación, usamos el prompt especializado
  const messages: ChatCompletionMessageParam[] = cmp
    ? [
        { role: "system", content: comparisonPrompt },
        {
          role: "user",
          content: `Datos JSON:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``,
        },
      ]
    : [
        { role: "system", content: NATURAL_PROMPT(question, data) }
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
  const plan = safeJSON<CrudPlan>(raw) ?? { mode: "none" };

  // Guardia: validar colección propuesta por el planner
  const op: any = (plan as any).operation ?? {};
  const coll: string | undefined = op?.collection ?? op?.list?.collection;
  if (plan.mode !== "none" && coll && !collections.includes(coll)) {
    return { mode: "none" };
  }

  return plan;
}