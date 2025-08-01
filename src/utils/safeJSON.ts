export function safeJSON<T>(input: string): T {
  try {
    return JSON.parse(input);
  } catch (err) {
    console.error("❌ Error al parsear JSON:", err);
    throw new Error("Respuesta inválida del modelo.");
  }
}
