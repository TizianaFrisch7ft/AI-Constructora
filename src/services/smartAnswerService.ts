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

export const getSmartAnswer = async (
  question: string
): Promise<{
  answer: string;
  entities: SmartEntity[];
  offerReminder?: boolean;
  reminderRecipients?: { name: string; email: string }[];
  rfqId?: string | null;
  offerQuoteCreation?: boolean;
  linesToQuote?: any[];
}> => {
  try {
    // 1) Cargo todos los datos
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

    // 2) Llamada a OpenAI
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
    const systemPrompt = `Sos un experto en gestión de compras y proyectos. Tenés acceso a los datos internos en JSON. Contestá en español, con precisión, sin inventar nada.`;
    const userPrompt = `Datos: ${JSON.stringify(context)}\n\nPregunta: ${question}`;

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
      chat.choices[0].message.content?.trim() ||
      "No se pudo generar respuesta.";

    // 3) Detección de entidades
    const allEntities = detectEntities(answer, {
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
    });
    const allowedTypes = [
      "Vendor",
      "Project",
      "PM",
      "QuoteRequest",
      "SchedulePur",
    ];
    const entities = allEntities.filter((e) =>
      allowedTypes.includes(e.type)
    );

    // 4) Lógica de recordatorios
    const pmReminderRegex =
      /(?=.*\b(?:pm|project\s*manager)\b)(?=.*\b(?:cotiz|cotización|quote|rfq)\b)/i;
    let offerReminder = false;
    let reminderRecipients: { name: string; email: string }[] = [];

    if (pmReminderRegex.test(question)) {
      const pmEntities = entities.filter(
        (e) => e.type === "PM" && e.email && e.id
      );

      const pmRFQMap: Record<string, string[]> = {};
      for (const q of quotes) {
        const pmId = String((q as any).pm_id || "");
        const status = String((q as any).status || "").toLowerCase();
        if (!pmRFQMap[pmId]) pmRFQMap[pmId] = [];
        pmRFQMap[pmId].push(status);
      }

      const pmsIncumplidores = new Set<string>();
      for (const [pmId, statuses] of Object.entries(pmRFQMap)) {
        const allCompleted = statuses.every((s) =>
          ["completed", "done"].includes(s)
        );
        if (!allCompleted) {
          pmsIncumplidores.add(pmId);
        }
      }

      reminderRecipients = pmEntities
        .filter((pm) => pm.id && pmsIncumplidores.has(pm.id))
        .map((pm) => ({ name: pm.name, email: pm.email! }));

      offerReminder = reminderRecipients.length > 0;
    }

    const rfq = quotes.find(
      (q) =>
        reminderRecipients.some((r) =>
          String((q as any).rfq_id || (q as any).qr_id || "")
            .toLowerCase()
            .includes(r.name.toLowerCase().split(" ")[0])
        ) &&
        String((q as any).status || "").toLowerCase() !== "completed"
    );
    const rfqId = rfq ? String((rfq as any)._id) : null;

    // 5) Lógica para detectar "necesidades no cotizadas"
    let offerQuoteCreation = false;
    let linesToQuote: any[] = [];

    // Ampliamos las frases que disparan la lógica
    const needsQuoteRegex = /\b(no\s+cotizad[ao]s?|sin\s+cotizar|sin\s+cotizaci[oó]n(?:es)?|no\s+tienen\s+(?:una\s+)?cotizaci[oó]n(?:es)?(?:\s+asociad[ao]s?)?|no\s+cuentan\s+con\s+cotizaci[oó]n(?:es)?|a[uú]n\s+no\s+han\s+sido\s+cotizad[ao]s?|necesidades\s+sin\s+cotizar|falt(?:a|ante)s?\s+(?:de\s+)?cotiz[ao]r|pendientes\s+(?:de\s+)?cotiz[ao]r)\b/i;

    if (needsQuoteRegex.test(question) || needsQuoteRegex.test(answer)) {
      // Detectar fecha de corte en la pregunta
      const dateMatch = /(\d{2}\/\d{2}\/\d{4})/.exec(question);
      const parsedCutoff = dateMatch
        ? new Date(dateMatch[1].split("/").reverse().join("-"))
        : null;
        
      // Detectar proyectos mencionados directamente en la pregunta
      const projectRegex = /\b(?:proyecto|obra|project)\s+([P][0-9]{4})\b/i;
      const projectMatch = projectRegex.exec(question);
      const projectId = projectMatch ? projectMatch[1] : null;
      
      // Detectar cronogramas mencionados directamente en la pregunta
      const scheduleRegex = /\b(?:cronograma|schedule|cc)\s+([C][C][0-9]{4})\b/i;
      const scheduleMatch = scheduleRegex.exec(question);
      const scheduleId = scheduleMatch ? scheduleMatch[1] : null;

      const quotedLineKeys = new Set(
        quoteLines.map((q) => `${q.cc_id}_${q.cc_id_line}`)
      );

      // Detectar proyectos mencionados en la pregunta o respuesta
      const projectEntities = entities.filter(e => e.type === "Project");
      const projectMentioned = projectEntities.length > 0 || projectId !== null;
      
      // Detectar cronogramas mencionados en la pregunta o respuesta
      const schedulePurEntities = entities.filter(e => e.type === "SchedulePur");
      const scheduleMentioned = schedulePurEntities.length > 0 || scheduleId !== null;

      linesToQuote = scheduleLines.filter((line) => {
        const lineKey = `${line.cc_id}_${line.line_no}`;
        
        // Criterio 1: No debe estar ya cotizada
        const notQuoted = !quotedLineKeys.has(lineKey);
        
        // Criterio 2: Debe cumplir con la fecha de corte si se especificó
        const dateOK = parsedCutoff
          ? !!line.desired_date && new Date(line.desired_date) <= parsedCutoff
          : true;
        
        // Criterio 3: Debe pertenecer al proyecto mencionado si se especificó
        let projectOK = true;
        if (projectMentioned) {
          if (projectId) {
            // Si se mencionó un ID de proyecto directamente
            projectOK = line.project_id === projectId;
          } else {
            // Si se detectaron entidades de proyecto
            projectOK = projectEntities.some(pe => line.project_id === pe.name || 
                                      (typeof line.project_id === 'string' && line.project_id.includes(pe.name)));
          }
        }
        
        // Criterio 4: Debe pertenecer al cronograma mencionado si se especificó
        let scheduleOK = true;
        if (scheduleMentioned) {
          if (scheduleId) {
            // Si se mencionó un ID de cronograma directamente
            scheduleOK = line.cc_id === scheduleId;
          } else {
            // Si se detectaron entidades de cronograma
            scheduleOK = schedulePurEntities.some(se => line.cc_id === se.name || 
                                          (typeof line.cc_id === 'string' && line.cc_id.includes(se.name)));
          }
        }
        
        return notQuoted && dateOK && projectOK && scheduleOK;
      });

      if (linesToQuote.length > 0) {
        offerQuoteCreation = true;
      }
    }

    return {
      answer,
      entities,
      offerReminder,
      reminderRecipients,
      rfqId,
      offerQuoteCreation,
      linesToQuote, // Esto lo mandás al frontend para pasarlo directo a generateQuoteRequests
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
    Project: ["name", "id", "project_id"],
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
        if (val && val.length > 2 && lower.includes(val.toLowerCase())) {
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
