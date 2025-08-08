// src/services/pendingWriteStore.ts
type Dict = Record<string, any>;

export type PendingWrite = {
  action: "insertOne" | "insertMany" | "updateOne" | "updateMany" | "deleteOne" | "deleteMany";
  collection: string;
  data?: Dict | Dict[];     // para insert
  filter?: Dict;            // para update/delete
  update?: Dict;            // para update
  options?: Dict;
  // estado conversacional
  requiredFields: string[];
  missingFields: string[];
  filled: Dict;             // acumulado del usuario
  // opcional
  naturalSummary?: string;
};

const memory = new Map<string, PendingWrite>();

export function savePending(conversationId: string, op: PendingWrite) {
  memory.set(conversationId, op);
}

export function getPending(conversationId: string): PendingWrite | undefined {
  return memory.get(conversationId);
}

export function clearPending(conversationId: string) {
  memory.delete(conversationId);
}

/** Merge user payload into pending op and recompute missing */
export function mergeFields(op: PendingWrite, userPayload: Dict) {
  op.filled = { ...op.filled, ...userPayload };

  // Si el plan original trae "data" (insertOne) como base, combinamos:
  if (op.action.startsWith("insert") && op.data && !Array.isArray(op.data)) {
    op.data = { ...op.data, ...op.filled };
  }
  if (op.action.startsWith("update") && op.update) {
    op.update = { ...op.update, $set: { ...(op.update.$set || {}), ...op.filled } };
  }

  op.missingFields = op.requiredFields.filter((f) => op.filled[f] == null || op.filled[f] === "");
  return op;
}
