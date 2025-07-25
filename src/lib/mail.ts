// src/lib/mail.ts
import nodemailer from "nodemailer";

export async function enviarMailPM(
  pmEmail: string,
  rfqId: string,
  rfqLink: string
) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Agente AI" <${process.env.SMTP_FROM}>`,
    to: pmEmail,
    subject: `🔔 Recordatorio: RFQ ${rfqId} pendiente`,
    text: `
Hola,

El RFQ ${rfqId} aún no ha sido completado. Podés verlo aquí:
${rfqLink}

Saludos,
Tu Agente AI
    `,
  });

  return info;
}
