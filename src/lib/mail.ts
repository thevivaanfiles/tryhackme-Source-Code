import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
  if (transporter !== undefined) return transporter;
  const user = process.env.MAIL_USERNAME;
  // Gmail app passwords are shown with spaces; strip them.
  const pass = process.env.MAIL_PASSWORD?.replace(/\s+/g, "");
  if (!user || !pass) {
    transporter = null;
    return null;
  }
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
  return transporter;
}

const FROM =
  process.env.MAIL_FROM ||
  process.env.MAIL_USERNAME ||
  "Coding Club CTF <no-reply@localhost>";

async function send(to: string, subject: string, html: string): Promise<void> {
  const t = getTransporter();
  if (!t) {
    console.warn(`[mail] MAIL_USERNAME/PASSWORD not set — skipping email to ${to}`);
    return;
  }
  await t.sendMail({ from: FROM, to, subject, html });
}

// Verifies SMTP credentials/connection (used by health checks/tests).
export async function verifyMailTransport(): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;
  await t.verify();
  return true;
}

function shell(heading: string, lines: string[], buttonLabel: string, url: string): string {
  return `
  <div style="background:#05070f;padding:32px 0;font-family:Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:480px;margin:0 auto;background:#0b1120;border:1px solid rgba(255,255,255,0.08);border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span style="font-family:monospace;font-size:15px;color:#e2e8f0;font-weight:700;">tryhackme<span style="color:#34d399;">.codingclub</span></span>
      </div>
      <div style="padding:28px;">
        <h1 style="margin:0 0 12px;font-size:20px;color:#f1f5f9;">${heading}</h1>
        ${lines.map((l) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:#cbd5e1;">${l}</p>`).join("")}
        <a href="${url}" style="display:inline-block;margin:8px 0 16px;padding:12px 22px;border-radius:10px;background:linear-gradient(135deg,#34d399,#10b981);color:#04140d;font-weight:700;font-size:14px;text-decoration:none;">${buttonLabel}</a>
        <p style="margin:12px 0 0;font-size:12px;color:#64748b;">Or paste this link into your browser:</p>
        <p style="margin:4px 0 0;font-size:12px;word-break:break-all;color:#38bdf8;">${url}</p>
      </div>
    </div>
  </div>`;
}

export async function sendVerificationEmail(to: string, url: string): Promise<void> {
  await send(
    to,
    "Verify your email · Coding Club CTF",
    shell(
      "Confirm your email",
      [
        "Welcome to tryhackme! Confirm your email address to activate your account and start solving challenges.",
        "This link expires in 24 hours.",
      ],
      "Verify email",
      url,
    ),
  );
}

export async function sendPasswordResetEmail(to: string, url: string): Promise<void> {
  await send(
    to,
    "Reset your password · Coding Club CTF",
    shell(
      "Reset your password",
      [
        "We received a request to reset your password. Click below to choose a new one.",
        "This link expires in 1 hour. If you didn't request this, you can safely ignore this email.",
      ],
      "Reset password",
      url,
    ),
  );
}
