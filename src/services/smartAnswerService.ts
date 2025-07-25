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

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getSmartAnswer = async (
  question: string
): Promise<{
  answer: string;
  entities: { type: string; name: string }[];
}> => {
  try {
    const [
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

    const system = `Sos un experto en gestión de compras y proyectos. Tenés acceso a los datos internos en JSON. Contestá en español, con precisión, sin inventar nada.`;
    const user = `Datos: ${JSON.stringify(context)}\n\nPregunta: ${question}`;

    const chat = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.3,
    });

    const answer =
      chat.choices[0].message.content?.trim() ||
      "No se pudo generar respuesta.";

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

    // 🔍 Solo las entidades clave
    const allowedTypes = ["Vendor", "Project", "PM", "QuoteRequest", "SchedulePur"];
    const filteredEntities = entities.filter((e) => allowedTypes.includes(e.type));

    return {
      answer,
      entities: filteredEntities,
    };

  } catch (err: any) {
    console.error("❌ Error en getSmartAnswer:", err);
    throw new Error("Error generando la respuesta inteligente.");
  }
};

// ✅ FUNCIÓN PARA DETECTAR ENTIDADES MENCIONADAS
// Modifica la función detectEntities para incluir RUT (legal_id), SCORE y NOMBRE (name) en Vendor
function detectEntities(
  answer: string,
  collections: Record<string, any[]>
): { type: string; name: string; rut?: string; surname?: string }[] {
  const lower = answer.toLowerCase();
  const entities: { type: string; name: string; rut?: string; surname?: string }[] = [];
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
    items.forEach((item) => {
      for (const field of fields) {
        const raw = item?.[field];
        const value = String(raw || "").trim();
        if (value && lower.includes(value.toLowerCase())) {
          const key = `${type}-${value}`;
          if (!seen.has(key)) {
            if (type === "Vendor") {
              entities.push({
                type,
                name: item.name,
                rut: item.legal_id,
              });
            } else if (type === "PM") {
              entities.push({
                type,
                name: item.name,
                surname: item.surname,
              });
            } else {
              entities.push({ type, name: value });
            }
            seen.add(key);
          }
          break; // match único por item
        }
      }
    });
  }

  return entities;
}
