import { Request, Response } from "express";

// Conversational agent para flujos transaccionales
export const agentTransactional = async (req: Request, res: Response) => {
  const { message, context } = req.body;

  // 1. Detectar intención si no hay contexto
  if (!context?.intent) {
    if (/cronograma.*compra/i.test(message)) {
      return res.json({
        reply: "Genial, para crear el cronograma de compras decime estos datos separados por coma: nombre del cronograma, fecha de inicio, fecha de fin, responsable.",
        context: { intent: "crear_cronograma", step: 1 }
      });
    }
    // ...otros intents
    return res.json({ reply: "¿Qué acción querés realizar? Por ejemplo: crear un cronograma de compras.", context: {} });
  }

  // 2. Si ya hay intención, pedir los datos que faltan
  if (context.intent === "crear_cronograma" && context.step === 1) {
    // Parsear datos del mensaje
    const [nombre, fechaInicio, fechaFin, responsable] = message.split(",");
    if (!nombre || !fechaInicio || !fechaFin || !responsable) {
      return res.json({
        reply: "Faltan datos. Por favor decime: nombre del cronograma, fecha de inicio, fecha de fin, responsable.",
        context
      });
    }
    // Aquí podrías crear el cronograma en la base de datos...
    return res.json({
      reply: `¡Listo! Se creó el cronograma "${nombre.trim()}" de ${fechaInicio.trim()} a ${fechaFin.trim()} a cargo de ${responsable.trim()}.`,
      context: {}
    });
  }

  // ...otros flujos conversacionales
  return res.json({ reply: "No entendí la acción. ¿Podés reformular?", context });
};
