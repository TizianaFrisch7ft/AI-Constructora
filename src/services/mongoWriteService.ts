// src/services/mongoWriteService.ts
import mongoose from "mongoose";
import AuditLog from "../models/AuditLog";
import { normalize, applyAliases, stripUnknownFields, models } from "./mongoShared";

export interface WriteInput {
  action:
    | "insertOne"
    | "insertMany"
    | "updateOne"
    | "updateMany"
    | "deleteOne"
    | "deleteMany"
    | "none";
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

// Resultado genérico para mantener compatibilidad
export type ExecuteResult = {
  ok: boolean;
  action?: WriteInput["action"];
  collection?: string;
  // campos opcionales según acción
  inserted?: any | any[];
  before?: any[];
  after?: any[] | null;
  raw?: any;
  dryRun?: boolean;
  plan?: any;
  confirmRequired?: boolean;
  reason?: string;
  message?: string;
};

export const executeDynamicWrite = async (
  question: string,
  op: WriteInput,
  opt: ExecOptions = {}
): Promise<ExecuteResult> => {
  if (!op || typeof op !== "object") throw new Error("La operación recibida es inválida.");
  if (op.action === "none") return { ok: false, message: "Acción 'none'." };

  if (process.env.ALLOW_WRITES !== "true") {
    throw new Error("Las escrituras están deshabilitadas. ALLOW_WRITES=false");
  }

  if (!op.collection || !op.action) {
    throw new Error("Operación inválida: faltan 'collection' o 'action'.");
  }

  const key = normalize(op.collection);

  // Aseguramos que models sea indexable por string
  const Model = (models as Record<string, mongoose.Model<any>>)[key];
  if (!Model) throw new Error(`No se encontró la colección: ${op.collection}`);

  const isInsert = op.action.startsWith("insert");
  const isUpdate = op.action.startsWith("update");
  const isDelete = op.action.startsWith("delete");

  if (isInsert && !op.data) throw new Error("Falta 'data' para inserción.");
  if ((isUpdate || isDelete) && !op.filter) throw new Error("Falta 'filter' para update/delete.");

  // Forzamos a objeto plano para evitar unions raras
  let filter: Record<string, any> = applyAliases(key, (op.filter ?? {}) as Record<string, any>);
  filter = stripUnknownFields(key, filter) as Record<string, any>;

  let update: Record<string, any> = (op.update ?? {}) as Record<string, any>;
  if (isUpdate) update = stripUnknownFields(key, update) as Record<string, any>;

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
      // insertOne: usamos create con array para session
      if (op.action === "insertOne") {
        const created = await (Model as mongoose.Model<any>)
          .create([data], { session });
        raw = created?.[0];
      } else {
        // insertMany
        raw = await (Model as mongoose.Model<any>)
          .insertMany(data, { session });
      }

      await (AuditLog as mongoose.Model<any>).create(
        [
          {
            action: op.action,
            coll: key,
            filter: null,
            payload: data,
            options: op.options,
            result: { ok: true, inserted: Array.isArray(raw) ? raw.length : 1 },
            question,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return {
        ok: true,
        action: op.action,
        collection: key,
        inserted: raw,
      };
    }

    if (isUpdate) {
      const before = await (Model as mongoose.Model<any>)
        .find(filter)
        .lean()
        .session(session)
        .exec();

      if (op.action === "updateOne") {
        raw = await (Model as mongoose.Model<any>)
          .updateOne(filter, update, op.options || {})
          .session(session)
          .exec();
      } else {
        raw = await (Model as mongoose.Model<any>)
          .updateMany(filter, update, op.options || {})
          .session(session)
          .exec();
      }

      const after = await (Model as mongoose.Model<any>)
        .find(filter)
        .lean()
        .session(session)
        .exec();

      await (AuditLog as mongoose.Model<any>).create(
        [
          {
            action: op.action,
            coll: key,
            filter,
            payload: update,
            options: op.options,
            result: {
              ok: true,
              matched: (raw as any)?.matchedCount,
              modified: (raw as any)?.modifiedCount,
            },
            question,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return {
        ok: true,
        action: op.action,
        collection: key,
        before,
        after,
        raw,
      };
    }

    if (isDelete) {
      const before = await (Model as mongoose.Model<any>)
        .find(filter)
        .lean()
        .session(session)
        .exec();

      if (op.action === "deleteOne") {
        raw = await (Model as mongoose.Model<any>)
          .deleteOne(filter)
          .session(session)
          .exec();
      } else {
        raw = await (Model as mongoose.Model<any>)
          .deleteMany(filter)
          .session(session)
          .exec();
      }

      await (AuditLog as mongoose.Model<any>).create(
        [
          {
            action: op.action,
            coll: key,
            filter,
            payload: null,
            options: op.options,
            result: { ok: true, deleted: (raw as any)?.deletedCount },
            question,
          },
        ],
        { session }
      );

      await session.commitTransaction();
      return {
        ok: true,
        action: op.action,
        collection: key,
        before,
        after: null,
        raw,
      };
    }

    throw new Error("Acción no soportada: " + op.action);
  } catch (e) {
    await session.abortTransaction();
    throw e;
  } finally {
    session.endSession();
  }
};
