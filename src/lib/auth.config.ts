import type { NextAuthConfig } from "next-auth";

// Edge-safe Auth.js config (no bcrypt/Prisma imports) — shared by middleware
// and the full Node config in auth.ts. Providers are added in auth.ts.
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.username = user.username;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as "USER" | "ADMIN";
      }
      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
