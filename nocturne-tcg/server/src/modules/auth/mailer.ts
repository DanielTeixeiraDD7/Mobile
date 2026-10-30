import nodemailer from 'nodemailer';
import { env } from '../../env';

const transport = env.SMTP_URL ? nodemailer.createTransport(env.SMTP_URL) : null;
export const outbox: { to: string; subject: string; text: string }[] = [];

export async function sendMail(to: string, subject: string, text: string) {
  if (env.NODE_ENV === 'test') {
    outbox.push({ to, subject, text });
    return;
  }
  if (!transport) {
    console.info(`\n[mail] À : ${to}\n[mail] Objet : ${subject}\n${text}\n`);
    return;
  }
  await transport.sendMail({ from: env.MAIL_FROM, to, subject, text });
}
