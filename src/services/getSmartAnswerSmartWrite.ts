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
import QuoteRequest from "../models/QuoteRequest";
import QuoteRequestLine from "../models/QuoteRequestLine"
import Eval from "../models/Eval"
import EvalLine from "../models/Eval_line"
import ProjectVendor from "../models/ProjectVendor"
import PM from "../models/PM"
import ProjectPM from "../models/ProjectPM"
import SchedulePur from "../models/SchedulePur"
import SchedulePurLine from "../models/SchedulePurLine"
import { 
  generateQrId, 
  generateVendorId, 
  generateProjectId, 
  generateScheduleId, 
  generateEvalId, 
  generatePMId 
} from "../utils/generateQrId"

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
        const assignId = async (obj: any) => {
          const clean = stripUnknownFields(key, applyAliases(key, obj))
          
          // Generar IDs específicos según la colección
          let autoId: string;
          switch (key) {
            case "vendor":
              autoId = await generateVendorId();
              break;
            case "project":
              autoId = await generateProjectId();
              break;
            case "quoterequest":
              // Para QuoteRequest, el campo es qr_id, no id
              if (!clean.qr_id) {
                clean.qr_id = await generateQrId();
              }
              return clean;
            case "schedulepur":
              // Para SchedulePur, el campo es cc_id, no id
              if (!clean.cc_id) {
                clean.cc_id = await generateScheduleId();
              }
              return clean;
            case "eval":
              // Para Eval, el campo es eval_id, no id
              if (!clean.eval_id) {
                clean.eval_id = await generateEvalId();
              }
              return clean;
            case "pm":
              autoId = await generatePMId();
              break;
            default:
              autoId = `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }
          
          return {
            ...clean,
            id: clean.id ?? autoId,
          }
        }

        // Esperar a que se resuelvan todas las promesas de asignación de ID
        data = Array.isArray(data) 
          ? await Promise.all(data.map(assignId)) 
          : await assignId(data);
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

export const getSmartAnswerWithWriteConversational = async (
  question: string,
  context: any = {},
  confirm = false
): Promise<{
  reply: string;
  context: any;
  entities: { type: string; name: string }[];
}> => {
  try {
    // 1. Detectar intención si no hay contexto
    if (!context?.intent) {
      // Ejemplo: crear cotización
      if (/cotizaci[oó]n|cotizar|crear.*cotiz/i.test(question)) {
        return {
          reply: "Genial, para crear la cotización decime estos datos separados por coma: nombre, fecha, proveedor.",
          context: { intent: "crear_cotizacion", step: 1 },
          entities: [],
        };
      }
      // ...otros intents
      return {
        reply: "¿Qué acción querés realizar? Por ejemplo: crear una cotización.",
        context: {},
        entities: [],
      };
    }

    // 2. Si ya hay intención, pedir los datos que faltan
    if (context.intent === "crear_cotizacion" && context.step === 1) {
      const [nombre, fecha, proveedor] = question.split(",");
      if (!nombre || !fecha || !proveedor) {
        return {
          reply: "Faltan datos. Por favor decime: nombre, fecha, proveedor.",
          context,
          entities: [],
        };
      }
      // Aquí podrías crear la cotización en la base de datos...
      // Simulación:
      return {
        reply: `¡Listo! Se creó la cotización "${nombre.trim()}" para el proveedor ${proveedor.trim()} con fecha ${fecha.trim()}.`,
        context: {},
        entities: [
          { type: "QuoteRequest", name: nombre.trim() },
          { type: "Vendor", name: proveedor.trim() },
        ],
      };
    }

    // ...otros flujos conversacionales
    return {
      reply: "No entendí la acción. ¿Podés reformular?",
      context,
      entities: [],
    };
  } catch (err: any) {
    console.error("❌ Error en getSmartAnswerWithWriteConversational:", err);
    return {
      reply: "Error interno en el agente conversacional.",
      context,
      entities: [],
    };
  }
};


export const getSmartAnswerWithWriteUnified = async (
  question: string,
  context: any = {},
  confirm = false
): Promise<{
  reply: string;
  context: any;
  entities: { type: string; name: string }[];
}> => {
  try {
    // 1. Preparar historial/conversación previa si existe
    const conversationHistory = context?.history || [];
    
    // 2. MANEJAR CASOS ESPECIALES ANTES DE LLAMAR A OPENAI
    
    // Caso especial: Usuario dice "continuar" y ya hay un plan previo
    if (conversationHistory.length > 0 && context.plan && /^(continuar|continúa|continue|crear|si|yes|ok)$/i.test(question.trim())) {
      const userWantsToContinue = true;
      const plan = {
        ...context.plan,
        missing_fields: [] // Ya no faltan campos, usuario quiere continuar
      };
      
      // Ir directo a la ejecución
      if (plan.intent === "create" && plan.provided_fields && Object.keys(plan.provided_fields).length > 0) {
        if (plan.entity === "Vendor") {
          const vendorId = await generateVendorId();
          const vendorData = {
            id: vendorId,
            type: "ready",
            status: "Activo",
            ...plan.provided_fields,
          };
          const newVendor = await Vendor.create(vendorData);
          return {
            reply: `¡Perfecto! Creé el proveedor "${newVendor.name}" con ID: ${vendorId}. Todos los datos fueron guardados correctamente.`,
            entities: [{ type: "Vendor", name: newVendor.name }],
            context: { history: [], plan: null }, // Limpiar contexto después de crear
          };
        } else if (plan.entity === "Project") {
          const projectId = await generateProjectId();
          const projectData = {
            id: projectId,
            status: "Open",
            ...plan.provided_fields,
          };
          const newProject = await Project.create(projectData);
          return {
            reply: `¡Perfecto! Creé el proyecto "${newProject.name}" con ID: ${projectId}. Todos los datos fueron guardados correctamente.`,
            entities: [{ type: "Project", name: newProject.name }],
            context: { history: [], plan: null },
          };
        } else if (plan.entity === "QuoteRequest") {
          const qr_id = await generateQrId();
          const newQuote = await QuoteRequest.create({
            qr_id,
            ...plan.provided_fields,
          });
          return {
            reply: `¡Perfecto! Creé la cotización con ID: ${qr_id}. Todos los datos fueron guardados correctamente.`,
            entities: [{ type: "QuoteRequest", name: qr_id }],
            context: { history: [], plan: null },
          };
        }
      }
    }
    
    // 3. Si no es un caso especial, continuar con el flujo normal de OpenAI
    const system = `Sos un asistente conversacional muy natural para gestión de compras y proyectos. 

Analiza lo que dice el usuario y respondé SIEMPRE con un JSON simple:

{
  "intent": "create|delete|update|read",
  "entity": "Vendor|Project|QuoteRequest|otros",
  "provided_fields": {"campo": "valor"},
  "can_create": true/false,
  "next_prompt": "mensaje natural al usuario"
}

REGLAS PARA CREAR PROVEEDORES:
1. Para Vendor.class usa SOLO: "Material" o "Servicio" (nunca otra cosa)
2. Si mencionan electricidad/construcción/productos → class: "Material"
3. Si mencionan consultoría/limpieza/servicios → class: "Servicio"
4. IMPORTANTE: Solo marcá can_create: true si tenés AL MENOS 4 campos: name, class, email y teléfono
5. Si solo tenés name + class → can_create: false, pedí más datos
6. Siempre intentá conseguir: email, teléfono, RUT/CUIT, rubro, persona de contacto

EJEMPLOS:
- "LOLA, materiales" → can_create: false, next_prompt: "Genial! Ya tengo el nombre y tipo. ¿Me pasás el email y teléfono del proveedor?"
- "Empresa XYZ, Material, email@xyz.com, 099123456" → can_create: true, next_prompt: "¡Perfecto! ¿Querés agregar RUT y rubro o creamos ya?"
- "Crear proveedor" → can_create: false, next_prompt: "Dale! ¿Cómo se llama y de qué tipo es?"

PARA OTROS:
- Project: si tenés name → can_create: true  
- QuoteRequest: si tenés vendor_id + date → can_create: true`;

    let userPrompt = `Usuario dice: ${question}`;
    
    // Si hay conversación previa, incluir contexto
    if (conversationHistory.length > 0 && context.plan) {
      const previousData = JSON.stringify(context.plan.provided_fields || {});
      userPrompt = `Conversación:
Antes teníamos: ${previousData}
Ahora el usuario dice: ${question}

COMBINA todo lo anterior con lo nuevo. RECUERDA: para Vendor necesito AL MENOS name, class, email y teléfono para can_create: true`;
    }

    // 2. Pedir a OpenAI el plan conversacional
    const planResp = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.1,
    });

    let plan;
    try {
      let rawResponse = planResp.choices[0].message.content || "{}";
      console.log("🤖 Respuesta cruda de OpenAI:", rawResponse);
      
      // Limpiar la respuesta de markdown si existe
      rawResponse = rawResponse.replace(/```json\s*/g, '').replace(/```\s*$/g, '').trim();
      
      // Limpiar caracteres de control que pueden romper el JSON
      rawResponse = rawResponse
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Eliminar caracteres de control
        .replace(/\n/g, '\\n') // Escapar saltos de línea
        .replace(/\r/g, '\\r') // Escapar retornos de carro
        .replace(/\t/g, '\\t'); // Escapar tabs
      
      console.log("🧹 Respuesta limpia:", rawResponse);
      
      plan = JSON.parse(rawResponse);
      console.log("📋 Plan parseado:", plan);
    } catch (e) {
      console.error("❌ Error parseando JSON:", e);
      console.error("❌ Respuesta cruda:", planResp.choices[0].message.content);
      return {
        reply: "Error procesando la respuesta del modelo. Reformulá tu consulta.",
        context,
        entities: [],
      };
    }

    // COMBINAR DATOS DEL HISTORIAL CON NUEVOS DATOS (mejorado y siempre activo)
    // Normalizar nombres de campos para evitar perder datos por diferencias de nombre
    function normalizeFields(fields: Record<string, any>) {
      const map: Record<string, string> = {
        email: "main_mail",
        mail: "main_mail",
        correo: "main_mail",
        correo_electronico: "main_mail",
        telefono: "mobile",
        teléfono: "mobile",
        mobile: "mobile",
        celular: "mobile",
        nombre: "name",
        tipo: "class",
        clase: "class",
      };
      const out: Record<string, any> = {};
      for (const k in fields) {
        const key = map[k.toLowerCase()] || k;
        out[key] = fields[k];
      }
      return out;
    }

    // Siempre combinar datos previos y nuevos
    const oldData = context.plan?.provided_fields ? normalizeFields(context.plan.provided_fields) : {};
    const newData = plan.provided_fields ? normalizeFields(plan.provided_fields) : {};
    plan.provided_fields = { ...oldData, ...newData };

    // Mantener intent si no cambió
    if (!plan.intent && context.plan?.intent) {
      plan.intent = context.plan.intent;
      plan.entity = context.plan.entity;
    }
    console.log("🔄 Combinado:", plan.provided_fields);

    // Si puede crear O el usuario dice continuar → CREAR (pero solo si realmente puede)
    const userWantsToContinue = /continuar|crear|listo|si|sí|ok|dale|confirm|ya/i.test(question.trim());
    
    if (plan.can_create && (userWantsToContinue || plan.can_create)) {
      console.log("🚀 Creando con:", plan.provided_fields);
      
      if (plan.intent === "create" && plan.entity === "Vendor") {
        // Verificar que tenga los datos mínimos antes de crear (ser más exigente)
        if (!plan.provided_fields.name || !plan.provided_fields.class) {
          return {
            reply: "Necesito al menos el nombre y tipo del proveedor. ¿Me los pasás?",
            context: { ...context, history: [...conversationHistory, { user: question, plan }], plan },
            entities: [],
          };
        }
        
        // Si solo tiene nombre y clase, pedir más datos
        const hasContact = plan.provided_fields.main_mail || plan.provided_fields.mobile;
        if (!hasContact) {
          return {
            reply: "Genial! Ya tengo el nombre y tipo. Para completar el proveedor necesito al menos el email o teléfono. ¿Me los pasás?",
            context: { ...context, history: [...conversationHistory, { user: question, plan }], plan },
            entities: [],
          };
        }
        
        // Normalizar los datos antes de crear
        const normalizedFields = { ...plan.provided_fields };
        
        // Normalizar class field - asegurar que sea Material o Servicio
        if (normalizedFields.class) {
          const classValue = normalizedFields.class.toLowerCase();
          if (classValue.includes('material') || classValue.includes('electricidad') || classValue.includes('construcción') || classValue.includes('producto')) {
            normalizedFields.class = "Material";
          } else if (classValue.includes('servicio') || classValue.includes('consultoría') || classValue.includes('limpieza') || classValue.includes('mantenimiento')) {
            normalizedFields.class = "Servicio";
          } else {
            // Por defecto, si no está claro, asumir Material
            normalizedFields.class = "Material";
          }
        }
        
        const vendorId = await generateVendorId();
        const vendorData = {
          id: vendorId,
          type: "ready",
          status: "Activo",
          ...normalizedFields,
        };
        
        console.log("🏗️ Creando proveedor con datos normalizados:", vendorData);
        const newVendor = await Vendor.create(vendorData);
        return {
          reply: `¡Listo! Creé el proveedor "${newVendor.name}" con ID: ${vendorId} 🎉`,
          context: {},
          entities: [{ type: "Vendor", name: newVendor.name }],
        };
      } else if (plan.intent === "create" && plan.entity === "Project") {
        if (!plan.provided_fields.name) {
          return {
            reply: "Necesito el nombre del proyecto para crear. ¿Cómo se llama?",
            context: { ...context, history: [...conversationHistory, { user: question, plan }], plan },
            entities: [],
          };
        }
        
        const projectId = await generateProjectId();
        const projectData = {
          id: projectId,
          status: "Open",
          ...plan.provided_fields,
        };
        
        const newProject = await Project.create(projectData);
        return {
          reply: `¡Listo! Creé el proyecto "${newProject.name}" con ID: ${projectId} 🎉`,
          context: {},
          entities: [{ type: "Project", name: newProject.name }],
        };
      } else if (plan.intent === "create" && plan.entity === "QuoteRequest") {
        if (!plan.provided_fields.vendor_id || !plan.provided_fields.date) {
          return {
            reply: "Necesito el proveedor y fecha para crear la cotización. ¿Me los pasás?",
            context: { ...context, history: [...conversationHistory, { user: question, plan }], plan },
            entities: [],
          };
        }
        
        const qr_id = await generateQrId();
        const newQuote = await QuoteRequest.create({
          qr_id,
          ...plan.provided_fields,
        });
        return {
          reply: `¡Listo! Creé la cotización con ID: ${qr_id} 🎉`,
          context: {},
          entities: [{ type: "QuoteRequest", name: qr_id }],
        };
      }
    }

    // Si no puede crear todavía, continuar conversación
    const newHistory = [...conversationHistory, { user: question, plan }];
    return {
      reply: plan.next_prompt,
      context: { ...context, history: newHistory, plan },
      entities: [],
    };

  } catch (err: any) {
    console.error("❌ Error en getSmartAnswerWithWriteUnified:", err);
    return {
      reply: "Error interno en el agente conversacional.",
      context,
      entities: [],
    };
  }
};
