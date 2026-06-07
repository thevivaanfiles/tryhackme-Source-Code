"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createToken, consumeToken } from "@/lib/tokens";
import { getBaseUrl } from "@/lib/base-url";
import { sendPasswordResetEmail } from "@/lib/mail";
import { getEnvAdmin } from "@/lib/admin";

export type FormState = { error?: string; info?: string } | undefined;

// Step 1: request a reset link. Always reports success (no account enumeration).
export async function requestPasswordReset(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const generic = {
    info: "If an account exists for that email, a reset link is on its way.",
  };

  if (!email || getEnvAdmin()?.email === email) return generic;

  const user = await db.user.findUnique({ where: { email } });
  if (user) {
    try {
      const token = await createToken(user.id, "RESET");
      const base = await getBaseUrl();
      await sendPasswordResetEmail(email, `${base}/reset?token=${token}`);
    } catch (e) {
      console.error("[reset] failed to send email:", e);
    }
  }
  return generic;
}

// Step 2: consume the token and set the new password.
export async function resetPassword(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = String(formData.get("token") ?? "");
  const parsed = z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(200)
    .safeParse(formData.get("password"));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid password." };
  }

  const userId = await consumeToken(token, "RESET");
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Request a new one." };
  }

  const passwordHash = await bcrypt.hash(parsed.data, 10);
  // Resetting via an emailed link also proves email ownership.
  await db.user.update({
    where: { id: userId },
    data: { passwordHash, emailVerified: new Date() },
  });

  redirect("/login?reset=1");
}
