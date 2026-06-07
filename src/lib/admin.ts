import { timingSafeEqual } from "node:crypto";

// The default admin is a system credential defined entirely in the environment
// (ADMIN_EMAIL / ADMIN_PASSWORD) — there is no corresponding row in the
// database. It carries this sentinel id so we can recognise it everywhere.
export const ENV_ADMIN_ID = "env-admin";

export type EnvAdmin = { email: string; password: string; username: string };

// Reads the default-admin credentials from the environment, or null if they
// aren't configured (in which case env-admin login is disabled).
export function getEnvAdmin(): EnvAdmin | null {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password, username: process.env.ADMIN_USERNAME?.trim() || "admin" };
}

// Constant-time string comparison to avoid leaking the password via timing.
export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

// True when the given email+password match the configured default admin.
export function matchesEnvAdmin(email: string, password: string): boolean {
  const admin = getEnvAdmin();
  if (!admin) return false;
  return email.trim().toLowerCase() === admin.email && safeEqual(password, admin.password);
}

export function isEnvAdmin(user: { id?: string } | null | undefined): boolean {
  return user?.id === ENV_ADMIN_ID;
}
