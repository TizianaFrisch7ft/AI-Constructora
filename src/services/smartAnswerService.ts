import OpenAI from "openai";
import dotenv from "dotenv";

import Vendor from "../models/Vendor";
import Project from "../models/Project";
import Quote from "../models/Quote";
import QuoteLine from "../models/QuoteLine";
import VendorEval from "../models/VendorEval";
import VendorEvalLine from "../models/VendorEvalLine";
import PreselectVendor from "../models/PreselectVendor";
import ProjectVendor from "../models/ProjectVendor";
import RFQ from "../models/RFQ";
import DeliveryIssue from "../models/DeliveryIssue";
import ConsumableReq from "../models/ConsumableReq";

dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const getSmartAnswer = async (question: string): Promise<{
  answer: string;
  entities: { type: string; name: string }[];
}> => {
  try {
    const [
      vendors,
      projects,
      quotes,
      quoteLines,
      vendorEvals,
      vendorEvalLines,
      preselects,
      projectVendors,
      rfqs,
      issues,
      consumables,
    ] = await Promise.all([
      Vendor.find().lean(),
      Project.find().lean(),
      Quote.find().lean(),
      QuoteLine.find().lean(),
      VendorEval.find().lean(),
      VendorEvalLine.find().lean(),
      PreselectVendor.find().lean(),
      ProjectVendor.find().lean(),
      RFQ.find().lean(),
      DeliveryIssue.find().lean(),
      ConsumableReq.find().lean(),
    ]);

    const context = {
      vendors,
      projects,
      quotes,
      quoteLines,
      vendorEvals,
      vendorEvalLines,
      preselects,
      projectVendors,
      rfqs,
      issues,
      consumables,
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

    const answer = chat.choices[0].message.content?.trim() || "No se pudo generar respuesta.";

    const entities = detectEntities(answer, {
      Vendor: vendors,
      Project: projects,
      Quote: quotes,
      RFQ: rfqs,
      Consumable: consumables,
      Issue: issues,
    });

    return {
      answer,
      entities,
    };
  } catch (err: any) {
    console.error("❌ Error en getSmartAnswer:", err);
    throw new Error("Error generando la respuesta inteligente.");
  }
};

// ✅ FUNCION CENTRAL PARA DETECTAR ENTIDADES MENCIONADAS
function detectEntities(
  answer: string,
  collections: Record<string, any[]>
): { type: string; name: string }[] {
  const lower = answer.toLowerCase();
  const entities: { type: string; name: string }[] = [];
  const seen = new Set<string>();

  const rules: Record<string, string[]> = {
    Vendor: ["name", "legal_id"],
    Project: ["name", "client_name"],
    Quote: ["code", "project_id"],
    RFQ: ["title", "project_id"],
    Consumable: ["product_id", "req_id", "pm_name"],
    Issue: ["issue_code", "description"],
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
            entities.push({ type, name: value });
            seen.add(key);
          }
          break; // match único por item
        }
      }
    });
  }

  return entities;
}
