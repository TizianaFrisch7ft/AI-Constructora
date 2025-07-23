// src/services/mongoWriteService.ts
import AuditLog from "../models/AuditLog";
import {
  normalize,
  applyAliases,
  stripUnknownFields,
  models,
} from "./mongoShared";

type WriteInput = {
  action: "insertOne" | "insertMany" | "updateOne" | "updateMany" | "deleteOne" | "deleteMany";
  collection: string;
  filter?: Record<string, any>;
  update?: Record<string, any>;
  data?: Record<string, any> | Record<string, any>[];
  options?: Record<string, any>;
};

export const executeDynamicWrite = async (question: string, op: WriteInput) => {
  if (process.env.ALLOW_WRITES !== "true") {
    throw new Error("Las escrituras están deshabilitadas. ALLOW_WRITES=false");
  }

  if (!op?.collection || !op?.action) throw new Error("Operación inválida: faltan campos");
  const key = normalize(op.collection);
  const Model = models[key];
  if (!Model) throw new Error("No se encontró la colección: " + op.collection);

  const isInsert = op.action.startsWith("insert");
  const isUpdate = op.action.startsWith("update");
  const isDelete = op.action.startsWith("delete");

  // --- Normalizo y limpio ---
  let filter = applyAliases(key, op.filter ?? {});
  filter = stripUnknownFields(key, filter);

  // ❗ Evitar updates/deletes sin filtro
  if ((isUpdate || isDelete) && Object.keys(filter).length === 0) {
    throw new Error("Filtro vacío o inválido para update/delete");
  }

  let update = op.update ?? {};
  if (isUpdate) update = stripUnknownFields(key, update);

  let data: any = op.data ?? {};
  if (isInsert) {
    if (Array.isArray(data)) {
      data = data.map(d => stripUnknownFields(key, applyAliases(key, d)));
    } else {
      data = stripUnknownFields(key, applyAliases(key, data));
    }
  }

  const options = op.options ?? {};

  // --- Before snapshot (solo para update/delete) ---
  let before: any = null;
  if (isUpdate || isDelete) {
    before = await Model.find(filter).lean();
  }

  // --- Ejecutar ---
  let rawResult: any;
  let after: any = null;

  switch (op.action) {
    case "insertOne":
      rawResult = await Model.create(data);
      after = rawResult.toObject ? rawResult.toObject() : rawResult;
      break;
    case "insertMany":
      rawResult = await Model.insertMany(data);
      after = rawResult.map((d: any) => (d.toObject ? d.toObject() : d));
      break;
    case "updateOne":
      rawResult = await Model.updateOne(filter, update, options);
      after = await Model.find(filter).lean();
      break;
    case "updateMany":
      rawResult = await Model.updateMany(filter, update, options);
      after = await Model.find(filter).lean();
      break;
    case "deleteOne":
      rawResult = await Model.deleteOne(filter);
      break;
    case "deleteMany":
      rawResult = await Model.deleteMany(filter);
      break;
    default:
      throw new Error("Acción no soportada: " + op.action);
  }

  // --- Auditoría ---
  await AuditLog.create({
    action: op.action,
    coll: key,
    filter,
    payload: isInsert ? data : update,
    options,
    result: rawResult,
    before,
    after,
    question,
    created_at: new Date(),
  });

  return {
    ok: true,
    action: op.action,
    collection: key,
    affected: isInsert ? (Array.isArray(after) ? after.length : 1) : rawResult?.modifiedCount ?? rawResult?.deletedCount ?? 0,
    before,
    after,
    raw: rawResult,
  };
};
