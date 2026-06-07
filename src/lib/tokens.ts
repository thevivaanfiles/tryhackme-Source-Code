import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import type { TokenType } from "@/generated/prisma/client";

const TTL_MS: Record<TokenType, number> = {
  VERIFY: 24 * 60 * 60 * 1000, // 24h
  RESET: 60 * 60 * 1000, // 1h
};

// Creates a single-use token, replacing any existing token of the same type
// for that user. Returns the raw token to embed in an email link.
export async function createToken(userId: string, type: TokenType): Promise<string> {
  await db.emailToken.deleteMany({ where: { userId, type } });
  const token = randomBytes(32).toString("hex");
  await db.emailToken.create({
    data: { userId, token, type, expiresAt: new Date(Date.now() + TTL_MS[type]) },
  });
  return token;
}

// Validates and consumes a token. Returns the userId if valid (and deletes it),
// or null if missing/wrong-type/expired.
export async function consumeToken(
  token: string,
  type: TokenType,
): Promise<string | null> {
  const row = await db.emailToken.findUnique({ where: { token } });
  if (!row || row.type !== type) return null;
  await db.emailToken.delete({ where: { id: row.id } }).catch(() => {});
  if (row.expiresAt.getTime() < Date.now()) return null;
  return row.userId;
}
