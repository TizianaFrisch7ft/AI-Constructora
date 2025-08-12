

/** ✅ Versión STRICT: se mantiene para el otro agente, no toca el string */
export function safeJSON<T>(input: string): T {
  try {
    return JSON.parse(input);
  } catch (err) {
    console.error("❌ Error al parsear JSON (strict):", err);
    throw new Error("Respuesta inválida del modelo.");
  }
}


export function safeJSONLoose(str: string) {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

export function safeJSONStrict<T = any>(raw: string): T {
  // El modelo debe devolver SOLO JSON. Lanzamos si hay otra cosa.
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    throw new Error("La respuesta del modelo no es JSON puro.");
  }
  // Encontrar cierre correcto (simple) y parsear
  // Asumimos que el modelo cumple. Si no, reintentarías una vez con un 'repair' prompt.
  return JSON.parse(trimmed) as T;
}
