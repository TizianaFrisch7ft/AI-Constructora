import OpenAI from "openai"
import dotenv from "dotenv"

import { executeDynamicWrite } from "./mongoWriteService"
import { getMongoWriteOp } from "./openaiService"
import {
  applyAliases,
  stripUnknownFields,
  normalize,
} from "./mongoShared"

import Vendor from "../models/Vendor"
import Project from "../models/Project"
import Quote from "../models/Quote"
import QuoteLine from "../models/QuoteLine"
import VendorEval from "../models/VendorEval"
import VendorEvalLine from "../models/VendorEvalLine"
import PreselectVendor from "../models/PreselectVendor"
import ProjectVendor from "../models/ProjectVendor"
import RFQ from "../models/RFQ"
import DeliveryIssue from "../models/DeliveryIssue"
import ConsumableReq from "../models/ConsumableReq"

dotenv.config()
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export const getSmartAnswerWithWrite = async (
  question: string,
  confirm = false
): Promise<{
  answer: string
  entities: { type: string; name: string }[]
}> => {
  try {
    console.log("📥 Pregunta recibida:", question)

    const [
      vendors, projects, quotes, quoteLines, vendorEvals,
      vendorEvalLines, preselects, projectVendors, rfqs, issues, consumables,
    ] = await Promise.all([
      Vendor.find().lean(), Project.find().lean(), Quote.find().lean(), QuoteLine.find().lean(),
      VendorEval.find().lean(), VendorEvalLine.find().lean(), PreselectVendor.find().lean(),
      ProjectVendor.find().lean(), RFQ.find().lean(), DeliveryIssue.find().lean(), ConsumableReq.find().lean(),
    ])

    console.log("📦 Datos cargados de Mongo")

    const context = {
      vendors, projects, quotes, quoteLines, vendorEvals,
      vendorEvalLines, preselects, projectVendors, rfqs, issues, consumables,
    }

    const system = `Sos un experto en gestión de compras y proyectos. Podés ver datos y también ejecutar operaciones en la base. Contestá en español, con precisión, sin inventar nada.`
    const user = `Datos: ${JSON.stringify(context)}\n\nPregunta: ${question}\n\n¿La consulta es de lectura o escritura? ¿Y qué acción debería hacerse si corresponde? Respondé sólo "read", "write", o "none".`

    const intentResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0,
    })

    const intent = intentResp.choices?.[0]?.message?.content?.toLowerCase()?.trim()
    console.log("🧠 Intención detectada:", intent)

    if (intent === "write") {
      const op = await getMongoWriteOp(question)
      console.log("🛠️ Operación propuesta:", op)

      if (
        !op ||
        typeof op !== "object" ||
        !("action" in op) ||
        op.action === "none" ||
        !("collection" in op)
      ) {
        throw new Error("El plan no tiene una acción de escritura válida.")
      }

      if (!confirm) {
        return {
          answer: `📝 Detecté una operación de escritura. Enviá \`confirm=true\` para ejecutarla.\n\n\`\`\`json\n${JSON.stringify(op, null, 2)}\n\`\`\``,
          entities: [],
        }
      }

      // ✅ Asignar ID automáticamente si falta
      const isInsert = op.action === "insertOne" || op.action === "insertMany"
      const key = normalize(op.collection)
      let data = (op as any).data

      if (isInsert) {
        const assignId = (obj: any) => {
          const clean = stripUnknownFields(key, applyAliases(key, obj))
          return {
            ...clean,
            id: clean.id ?? `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          }
        }

        data = Array.isArray(data) ? data.map(assignId) : assignId(data)
        ;(op as any).data = data
      }

      const result = await executeDynamicWrite(question, op)
      console.log("✅ Resultado ejecución:", result)

      return {
        answer: `✅ Se ejecutó correctamente la operación:\n\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``,
        entities: [],
      }
    }

    // 🔎 Consulta de lectura
    const finalUserPrompt = `Datos: ${JSON.stringify(context)}\n\nPregunta: ${question}`
    const finalResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: finalUserPrompt },
      ],
      temperature: 0.3,
    })

    const answer = finalResp.choices[0].message.content?.trim() || "No se pudo generar respuesta."
    const entities = detectEntities(answer, {
      Vendor: vendors, Project: projects, Quote: quotes,
      RFQ: rfqs, Consumable: consumables, Issue: issues,
    })

    return { answer, entities }
  } catch (err: any) {
    console.error("❌ Error en getSmartAnswerWithWrite:", err)
    throw new Error("Error generando la respuesta inteligente.")
  }
}

function detectEntities(
  answer: string,
  collections: Record<string, any[]>
): { type: string; name: string }[] {
  const lower = answer.toLowerCase()
  const entities: { type: string; name: string }[] = []
  const seen = new Set<string>()

  const rules: Record<string, string[]> = {
    Vendor: ["name", "legal_id"],
    Project: ["name", "client_name"],
    Quote: ["code", "project_id"],
    RFQ: ["title", "project_id"],
    Consumable: ["product_id", "req_id", "pm_name"],
    Issue: ["issue_code", "description"],
  }

  for (const [type, items] of Object.entries(collections)) {
    const fields = rules[type] || []
    items.forEach((item) => {
      for (const field of fields) {
        const raw = item?.[field]
        const value = String(raw || "").trim()
        if (value && lower.includes(value.toLowerCase())) {
          const key = `${type}-${value}`
          if (!seen.has(key)) {
            entities.push({ type, name: value })
            seen.add(key)
          }
          break
        }
      }
    })
  }

  return entities
}
