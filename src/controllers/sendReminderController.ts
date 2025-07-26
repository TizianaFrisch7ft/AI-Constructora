// src/controllers/sendReminderController.ts
import { Request, Response } from "express";
import { enviarMailPM } from "../lib/mail";
// prueba de commit Tizi - 26/07

export async function sendReminder(req: Request, res: Response) {
  const { rfqId, recipients } = req.body as {
    rfqId: string;
    recipients: { name: string; email: string }[];
  };

  const rfqLink = `${process.env.FRONTEND_URL}/rfq/${rfqId}`;

  try {
    await Promise.all(
      recipients.map(pm => enviarMailPM(pm.email, rfqId, rfqLink))
    );
    res.json({ success: true });
  } catch (err: any) {
    console.error("Error enviando recordatorios:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
