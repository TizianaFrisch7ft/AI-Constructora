import AuditLog from "../models/AuditLog"
import { normalize, applyAliases, stripUnknownFields, models } from "./mongoShared"

export interface WriteInput {
  action: "insertOne" | "insertMany" | "updateOne" | "updateMany" | "deleteOne" | "deleteMany" | "none"
  collection?: string
  data?: any
  filter?: any
  update?: any
  options?: any
}


export const executeDynamicWrite = async (question: string, op: WriteInput) => {
  if (!op || typeof op !== "object") {
    throw new Error("La operación recibida es inválida o no está definida.")
  }

  if (process.env.ALLOW_WRITES !== "true") {
    throw new Error("Las escrituras están deshabilitadas. ALLOW_WRITES=false")
  }

  if (op.action === "none") {
    console.warn("⚠️ Acción 'none' recibida. No se ejecuta ninguna operación.")
    return {
      ok: false,
      message: "Operación no ejecutada porque se indicó 'none'",
    }
  }

  if (!op.collection || !op.action) {
    throw new Error("Operación inválida: faltan campos obligatorios como 'collection' o 'action'")
  }

  const key = normalize(op.collection)
  const Model = models[key]
  if (!Model) {
    throw new Error(`No se encontró la colección: ${op.collection}`)
  }

  const isInsert = op.action.startsWith("insert")
  const isUpdate = op.action.startsWith("update")
  const isDelete = op.action.startsWith("delete")

  if (isInsert && !op.data) {
    throw new Error("Falta el campo 'data' requerido para operaciones de inserción.")
  }

  if ((isUpdate || isDelete) && !op.filter) {
    throw new Error("Falta el campo 'filter' requerido para operaciones de actualización o eliminación.")
  }

  let filter = applyAliases(key, op.filter ?? {})
  filter = stripUnknownFields(key, filter)

  let update = op.update ?? {}
  if (isUpdate) update = stripUnknownFields(key, update)

  let data: any = op.data ?? {}
  if (isInsert) {
    if (Array.isArray(data)) {
      data = data.map(d => stripUnknownFields(key, applyAliases(key, d)))
    } else {
      data = stripUnknownFields(key, applyAliases(key, data))
    }
  }

  const options = op.options ?? {}
  let result: any

  if (isInsert) {
    result = op.action === "insertOne"
      ? await Model.create(data)
      : await Model.insertMany(data)
  } else if (isUpdate) {
    const before = await Model.find(filter).lean()
    const raw = op.action === "updateOne"
      ? await Model.updateOne(filter, update, options)
      : await Model.updateMany(filter, update, options)
    const after = await Model.find(filter).lean()
    result = {
      ok: true,
      action: op.action,
      collection: key,
      affected: raw.modifiedCount ?? raw.matchedCount ?? 0,
      before,
      after,
      raw,
    }
  } else if (isDelete) {
    const before = await Model.find(filter).lean()
    const raw = op.action === "deleteOne"
      ? await Model.deleteOne(filter)
      : await Model.deleteMany(filter)
    result = {
      ok: true,
      action: op.action,
      collection: key,
      affected: raw.deletedCount ?? 0,
      before,
      after: null,
      raw,
    }
  } else {
    throw new Error("Acción no soportada: " + op.action)
  }

  // Guardar auditoría
  await AuditLog.create({
    action: op.action,
    coll: key,
    filter,
    payload: isInsert ? data : update,
    options,
    result,
    question,
  })

  return result
}
