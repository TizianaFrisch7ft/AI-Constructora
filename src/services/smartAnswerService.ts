// src/controllers/agent.ts
import OpenAI from "openai";
import dotenv from "dotenv";

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

export interface SmartEntity {
  type: string;
  id?: string;
  name: string;
  rut?: string;
  surname?: string;
  email?: string;
}

export const getSmartAnswer = async (question: string) => {
  try {
    // 1) Cargo datos desde Mongo
    const [
      vendors,
      projects,
      quotesRaw,
      quoteLines,
      evals,
      evalLines,
      projectVendors,
      pms,
      projectPMs,
      schedules,
      scheduleLines,
    ] = await Promise.all([
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

    const quotes = quotesRaw as Array<any>;

    // 2) Inicializo variables
    let linesToQuote: any[] = [];
    let offerQuoteCreation = false;

    // 3) Detecto si es pregunta de necesidades no cotizables
    const needsQuoteRegex = /\b(no\s+cotizad[ao]s?|sin\s+cotizar|sin\s+cotizaci[oó]n(?:es)?|no\s+tienen\s+(?:una\s+)?cotizaci[oó]n(?:es)?|necesidades\s+sin\s+cotizar|pendientes\s+de\s+cotizar)\b/i;
    const isAskingForNeeds =
      needsQuoteRegex.test(question) ||
      question.toLowerCase().includes("necesidades");

    if (isAskingForNeeds) {
      // --- Tu lógica de filtrado ---
      const dateMatch = /(\d{2}\/\d{2}\/\d{4})/.exec(question);
      const parsedCutoff = dateMatch
        ? new Date(dateMatch[1].split("/").reverse().join("-"))
        : null;

      const projectRegex = /\b(?:proyecto|obra|project)\s+([P][0-9]{4})\b/i;
      const projectMatch = projectRegex.exec(question);
      const projectId = projectMatch ? projectMatch[1] : null;

      const scheduleRegex = /\b(?:cronograma|schedule|cc)\s+([C][C][0-9]{4})\b/i;
      const scheduleMatch = scheduleRegex.exec(question);
      const scheduleId = scheduleMatch ? scheduleMatch[1] : null;

      const quotedLineKeys = new Set(
        quoteLines.map((q) => `${q.cc_id}_${q.cc_id_line}`)
      );

      linesToQuote = scheduleLines.filter((line) => {
        const lineKey = `${line.cc_id}_${line.line_no}`;
        const notQuoted = !quotedLineKeys.has(lineKey);

        const dateOK = parsedCutoff
          ? !!line.desired_date && new Date(line.desired_date) <= parsedCutoff
          : true;

        const projectOK = projectId
          ? line.project_id === projectId
          : true;

        const scheduleOK = scheduleId
          ? line.cc_id === scheduleId
          : true;

        return notQuoted && dateOK && projectOK && scheduleOK;
      });

      if (linesToQuote.length > 0) {
        offerQuoteCreation = true;
      }
    }

    // 4) Preparo el prompt según el caso
    const context = {
      vendors,
      projects,
      quotes,
      quoteLines,
      evals,
      evalLines,
      projectVendors,
      pms,
      projectPMs,
      schedules,
      scheduleLines,
    };

function formatLinesForPrompt(lines: any[]): string {
  return lines.map((l, idx) => {
    return `• ${l.reference || 'Sin referencia'}
  Cantidad: ${l.qty || '-'} ${l.um || ''}
  Precio de referencia: ${l.reference_price || '-'} USD
  Proyecto: ${l.project_id || '-'}
  Fecha deseada: ${l.desired_date ? new Date(l.desired_date).toLocaleDateString('es-AR') : '-'}
  Proveedores: ${(l.vendor_list || []).join(', ') || '-'}`;
  }).join('\n\n');
}


    const systemPrompt = `
Sos un experto en gestión de compras y proyectos.
Tenés acceso a datos internos en formato JSON.

REGLAS:
1. Si la pregunta es sobre necesidades no cotizables, usa exactamente la lista "linesToQuote" que te proporciona el sistema. 
2. No inventes ni elimines elementos. 
3. Si "linesToQuote" está vacío, responde: "No hay necesidades no cotizadas para el criterio solicitado".
4. Podés formatear la presentación, pero el set de datos debe ser idéntico.
5. Si la pregunta no es sobre necesidades, usá "context" para responder normalmente.
6. Siempre respondé en español claro y profesional.
`;

   const userPrompt = isAskingForNeeds
  ? `Estas son las necesidades no cotizadas calculadas por el sistema. No agregues ni quites nada, solo preséntalas en texto claro y profesional, sin usar formato JSON:\n${formatLinesForPrompt(linesToQuote)}`
  : `Datos: ${JSON.stringify(context)}\nPregunta: ${question}`;


    // 5) Llamo a OpenAI
    const chat = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      .chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      });

    const answer =
      chat.choices[0].message.content?.trim() || "No se pudo generar respuesta.";

    // 6) Detecto entidades
    const entities = detectEntities(answer, {
      Vendor: vendors,
      Project: projects,
      QuoteRequest: quotesRaw,
      QuoteRequestLine: quoteLines,
      Eval: evals,
      EvalLine: evalLines,
      ProjectVendor: projectVendors,
      PM: pms,
      ProjectPM: projectPMs,
      SchedulePur: schedules,
      SchedulePurLine: scheduleLines,
    }).filter((e) => ["Vendor", "Project", "PM", "QuoteRequest", "SchedulePur"].includes(e.type));

    return {
      answer,
      entities,
      offerQuoteCreation,
      linesToQuote,
    };
  } catch (err: any) {
    console.error("❌ Error en getSmartAnswer:", err);
    throw new Error("Error generando la respuesta inteligente.");
  }
};

// Función de detección de entidades
function detectEntities(
  answer: string,
  collections: Record<string, any[]>
): SmartEntity[] {
  const lower = answer.toLowerCase();
  const result: SmartEntity[] = [];
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
    for (const item of items) {
      for (const field of fields) {
        const raw = item?.[field];
        const val = String(raw || "").trim();
        if (val && lower.includes(val.toLowerCase())) {
          const key = `${type}|${field}|${val}`;
          if (seen.has(key)) break;
          seen.add(key);

          if (type === "Vendor") {
            result.push({ type, name: item.name, rut: item.legal_id });
          } else if (type === "PM") {
            result.push({
              type,
              id: String(item._id),
              name: `${item.name}${item.surname ? ` ${item.surname}` : ""}`,
              surname: item.surname,
              email: item.email,
            });
          } else {
            result.push({ type, name: val });
          }
          break;
        }
      }
    }
  }
  return result;
}
