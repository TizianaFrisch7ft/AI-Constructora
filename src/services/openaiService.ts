import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const getMongoQuery = async (question: string): Promise<any> => {
const prompt = `
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

Campos disponibles por colección (NO inventes otros):
vendors: ["id","name","reference_name","class","rubro","legal_type","legal_id","main_mail","in_contact_name","mobile","status","type","score_avg"]
projects: ["id","name"]
quotes: ["id","project_id","date"]
quotelines: ["id","line_no","product_id","reference","price","qty","delivery_date","project_id"]
vendorevals: ["eval_id","eval_name","vendor_id","start_date","due_date","type","attach_id"]
vendorevallines: ["eval_id","line_no","name","value","check","attach_id"]
preselectvendors: ["project_id","vendor_id","status"]
projectvendors: ["project_id","vendor_id","score","status"]

Sinónimos comunes → usa el campo correcto:
- categoría, category -> rubro
- tipo proveedor -> class
- estado -> status
- promedio, score -> score_avg
- ítems de cotización -> quotelines
- evaluación de proveedor -> vendorevals
- detalle de evaluación -> vendorevallines

### FORMATO DE RESPUESTA (obligatorio)
Devuelve un único objeto JSON como este:

{
  "collection": "<una de las colecciones permitidas>",
  "filter": { ... },          // objeto JSON. Si no hay filtros, usa {}
  "projection": { ... },      // opcional
  "limit": 100,               // opcional, entero
  "sort": { "campo": 1 }      // opcional, 1 asc / -1 desc
}

Reglas:
- Usa operadores MongoDB cuando corresponda ($gte, $lte, $in, $regex, etc.).
- Fechas en formato ISO "YYYY-MM-DD".
- No inventes colecciones ni campos.
- No agregues texto fuera del JSON ni comentarios.

Ejemplo:
Pregunta: "Mostrame los proveedores activos"
Respuesta:
{
  "collection": "vendors",
  "filter": { "status": "Activo" },
  "limit": 50
}

Pregunta del usuario:
"${question}"
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  });

  const content = response.choices[0].message.content || "";
  try {
    return JSON.parse(content);
  } catch (err) {
    throw new Error("La respuesta de OpenAI no fue un JSON válido.");
  }
};

export const getNaturalAnswer = async (question: string, data: any): Promise<string> => {
  const prompt = `
Estás respondiendo como un agente técnico para una empresa.
Dado lo siguiente:

Pregunta del usuario:
"${question}"

Resultados de la base de datos:
${JSON.stringify(data)}

Redactá una respuesta natural, clara y útil en español. Si no hay datos, indicá que no se encontraron resultados.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [{ role: "user", content: prompt }]
  });

  return response.choices[0].message.content?.trim() || "No se pudo generar una respuesta.";
};
