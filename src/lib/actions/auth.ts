"use server";

import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signIn, signOut } from "@/lib/auth";
import { registerSchema } from "@/lib/validation";
import { getEnvAdmin, matchesEnvAdmin } from "@/lib/admin";
import { createToken } from "@/lib/tokens";
import { getBaseUrl } from "@/lib/base-url";
import { sendVerificationEmail } from "@/lib/mail";

export type FormState =
  | { error?: string; info?: string; email?: string; needsVerify?: boolean }
  | undefined;

const DEST = "/challenges";

// Generates a verification token and emails the link. Never throws.
async function dispatchVerification(userId: string, email: string) {
  try {
    const token = await createToken(userId, "VERIFY");
    const base = await getBaseUrl();
    await sendVerificationEmail(email, `${base}/api/verify?token=${token}`);
  } catch (e) {
    console.error("[verify] failed to send email:", e);
  }
}

export async function loginAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");

  // Env admin bypasses DB + verification.
  if (!matchesEnvAdmin(email, password)) {
    const user = await db.user.findUnique({ where: { email } });
    const ok = user && !user.disabled && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return { error: "Invalid email or password." };
    if (!user.emailVerified) {
      return {
        error: "Your email isn't verified yet. Check your inbox for the link.",
        needsVerify: true,
        email,
      };
    }
  }

  try {
    await signIn("credentials", { email, password, redirectTo: DEST });
  } catch (error) {
    if (error instanceof AuthError) return { error: "Invalid email or password." };
    throw error; // re-throw NEXT_REDIRECT
  }
}

export async function registerAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
    usn: formData.get("usn"),
    year: formData.get("year"),
    branch: formData.get("branch"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const email = parsed.data.email.toLowerCase();
  const { username, password, name, usn, year, branch } = parsed.data;

  if (getEnvAdmin()?.email === email) {
    return { error: "That email is reserved." };
  }

  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { username }, { usn }] },
    select: { email: true, username: true, usn: true },
  });
  if (existing) {
    const field =
      existing.email === email
        ? "email"
        : existing.username === username
          ? "username"
          : "USN";
    return { error: `That ${field} is already registered.` };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await db.user.create({
    data: { email, username, passwordHash, name, usn, year, branch },
  });

  await dispatchVerification(user.id, email);

  // Verification is required before login — don't sign in yet.
  return {
    info: `We've sent a verification link to ${email}. Click it to activate your account.`,
    email,
  };
}

// Re-sends the verification email. Always reports success (no account enumeration).
export async function resendVerification(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const user = await db.user.findUnique({ where: { email } });
  if (user && !user.emailVerified) {
    await dispatchVerification(user.id, email);
  }
  return {
    info: `If ${email || "that account"} needs verification, a new link is on its way.`,
  };
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}
