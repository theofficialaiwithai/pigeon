import { Resend } from "resend";

export async function sendNotification({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? "noreply@pigeon.app",
      to,
      subject,
      text: body,
    });
  } catch (err) {
    // Never rethrow — a failed notification must never break the calling handler.
    console.error("[notifications] Failed to send email:", err);
  }
}
