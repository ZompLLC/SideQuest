import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | undefined;

// Requires a Gmail App Password (Google Account > Security > 2-Step
// Verification > App passwords) -- regular account passwords won't auth.
function getTransporter(): Transporter {
  if (!transporter) {
    const { GMAIL_USER, GMAIL_APP_PASSWORD } = process.env;
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      throw new Error(
        "GMAIL_USER and GMAIL_APP_PASSWORD must be set to send email.",
      );
    }
    transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
    });
  }
  return transporter;
}

export async function sendVerificationEmail(
  to: string,
  token: string,
): Promise<void> {
  const baseUrl = process.env.APP_BASE_URL;
  if (!baseUrl) {
    throw new Error("APP_BASE_URL is not set.");
  }
  const verifyUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(token)}`;

  // Gmail requires the `from` address to match the authenticated account.
  await getTransporter().sendMail({
    from: process.env.GMAIL_USER,
    to,
    subject: "Verify your email",
    text: `Verify your email by visiting: ${verifyUrl}\n\nThis link expires in 24 hours.`,
    html: `<p>Verify your email by clicking the link below.</p><p><a href="${verifyUrl}">${verifyUrl}</a></p><p>This link expires in 24 hours.</p>`,
  });
}
