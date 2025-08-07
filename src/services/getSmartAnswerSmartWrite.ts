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
import QuoteRequest from "../models/QuoteRequest"
import QuoteRequestLine from "../models/QuoteRequestLine"
import Eval from "../models/Eval"
import EvalLine from "../models/Eval_line"
import ProjectVendor from "../models/ProjectVendor"
import PM from "../models/PM"
import ProjectPM from "../models/ProjectPM"
import SchedulePur from "../models/SchedulePur"
import SchedulePurLine from "../models/SchedulePurLine"

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
    ])

    console.log("📦 Datos cargados de Mongo")

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