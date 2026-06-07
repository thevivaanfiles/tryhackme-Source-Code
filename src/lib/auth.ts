import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import authConfig from "@/lib/auth.config";
import { ENV_ADMIN_ID, getEnvAdmin, matchesEnvAdmin } from "@/lib/admin";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const email = parsed.data.email.toLowerCase();

        // Default admin lives in the environment, not the database.
        if (matchesEnvAdmin(email, parsed.data.password)) {
          const admin = getEnvAdmin()!;
          return {
            id: ENV_ADMIN_ID,
            email: admin.email,
            name: admin.username,
            username: admin.username,
            role: "ADMIN",
          };
        }

        const user = await db.user.findUnique({ where: { email } });
        if (!user || user.disabled) return null;
        // Email must be verified before login (env admin handled above).
        if (!user.emailVerified) return null;

        const ok = await bcrypt.compare(parsed.data.password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.username,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
});
