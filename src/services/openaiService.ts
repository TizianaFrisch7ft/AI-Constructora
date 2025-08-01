// src/services/openaiService.ts
import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import dotenv from "dotenv";
import { safeJSON } from "../utils/safeJSON"; // ajusta el path si es necesario

dotenv.config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

/* ---------- Tipos de plan de lectura/escritura ---------- */
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
