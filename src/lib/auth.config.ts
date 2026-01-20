import type { NextAuthConfig } from "next-auth";

/**
 * Edge-compatible auth config (no DB imports)
 * Used by middleware for session validation
 */
export const authConfig: NextAuthConfig = {
  providers: [], // Providers are added in auth.ts
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? "";
        token.role = (user as { role?: string }).role ?? "user";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) ?? "";
        session.user.role = (token.role as string) ?? "user";
      }
      return session;
    },
  },
  pages: {
    signIn: "/admin/giris",
    error: "/admin/giris",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
};
