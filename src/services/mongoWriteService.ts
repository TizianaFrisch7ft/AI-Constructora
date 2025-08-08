// src/services/mongoWriteService.ts
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog";
import { normalize, applyAliases, stripUnknownFields, models } from "./mongoShared";

export interface WriteInput {
  action: "insertOne" | "insertMany" | "updateOne" | "updateMany" | "deleteOne" | "deleteMany" | "none";
  collection?: string;
  data?: any;
  filter?: any;
  update?: any;
  options?: any;
}

type ExecOptions = {
  dryRun?: boolean;
  requireConfirm?: boolean; // bloquea *Many con filtro vacío
};

export const executeDynamicWrite = async (question: string, op: WriteInput, opt: ExecOptions = {}) => {
  if (!op || typeof op !== "object") throw new Error("La operación recibida es inválida.");
  if (op.action === "none") return { ok: false, message: "Acción 'none'." };

  if (process.env.ALLOW_WRITES !== "true") {
    throw new Error("Las escrituras están deshabilitadas. ALLOW_WRITES=false");
  }

  if (!op.collection || !op.action) {
    throw new Error("Operación inválida: faltan 'collection' o 'action'.");
  }

  const key = normalize(op.collection);
  const Model = (models as Record<string, mongoose.Model<any>>)[key];
  if (!Model) throw new Error(`No se encontró la colección: ${op.collection}`);

  const isInsert = op.action.startsWith("insert");
  const isUpdate = op.action.startsWith("update");
  const isDelete = op.action.startsWith("delete");

  if (isInsert && !op.data) throw new Error("Falta 'data' para inserción.");
  if ((isUpdate || isDelete) && !op.filter) throw new Error("Falta 'filter' para update/delete.");

  let filter = applyAliases(key, op.filter ?? {});
  filter = stripUnknownFields(key, filter);

  let update = op.update ?? {};
  if (isUpdate) update = stripUnknownFields(key, update);

  let data: any = op.data ?? {};
  if (isInsert) {
    const clean = (d: any) => stripUnknownFields(key, applyAliases(key, d));
    data = Array.isArray(data) ? (data as any[]).map((d: any) => clean(d)) : clean(data);
  }

  const riskyMany =
    ((isDelete && op.action === "deleteMany") || (isUpdate && op.action === "updateMany")) &&
    Object.keys(filter).length === 0;

  if (opt.requireConfirm && riskyMany) {
    return {
      ok: false,
      confirmRequired: true,
      reason: "Operación riesgosa (*Many con filtro vacío).",
      plan: { ...op, collection: key, filter, update, data },
    };
  }

  if (opt.dryRun) {
    return { ok: true, dryRun: true, plan: { ...op, collection: key, filter, update, data } };
  }

  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let raw: any;

    if (isInsert) {
      raw = op.action === "insertOne"
        ? (await (Model as any).create([data], { session }))[0]
        : await (Model as any).insertMany(data, { session });

      await (AuditLog as any).create([{
        action: op.action,
        coll: key,
        filter: null,
        payload: data,
        options: op.options,
        result: { ok: true, inserted: Array.isArray(raw) ? raw.length : 1 },
        question,
      }], { session });

      await session.commitTransaction();
      return { ok: true, action: op.action, collection: key, inserted: raw };
    }

    if (isUpdate) {
      const before = await (Model as any).find(filter).lean().session(session);
      raw = op.action === "updateOne"
        ? await (Model as any).updateOne(filter, update, op.options || {}).session(session)
        : await (Model as any).updateMany(filter, update, op.options || {}).session(session);
      const after = await (Model as any).find(filter).lean().session(session);

      await (AuditLog as any).create([{
        action: op.action,
        coll: key,
        filter,
        payload: update,
        options: op.options,
        result: { ok: true, matched: raw.matchedCount, modified: raw.modifiedCount },
        question,
      }], { session });

      await session.commitTransaction();
      return { ok: true, action: op.action, collection: key, before, after, raw };
    }

    if (isDelete) {
      const before = await (Model as any).find(filter).lean().session(session);
      raw = op.action === "deleteOne"
        ? await (Model as any).deleteOne(filter).session(session)
        : await (Model as any).deleteMany(filter).session(session);

      await (AuditLog as any).create([{
        action: op.action,
        coll: key,
        filter,
        payload: null,
        options: op.options,
        result: { ok: true, deleted: raw.deletedCount },
        question,
      }], { session });

      await session.commitTransaction();
      return { ok: true, action: op.action, collection: key, before, after: null, raw };
    }

    throw new Error("Acción no soportada: " + op.action);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};
