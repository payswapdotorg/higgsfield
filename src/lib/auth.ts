import type { DefaultSession, NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import { GUEST_EMAIL } from "@/lib/session";

declare module "next-auth" {
  interface Session {
    user: { id?: string } & DefaultSession["user"];
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** NextAuth v4 options for HF Studio (dev-safe: no real credentials). */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET ?? "hf-studio-dev-secret",
  session: { strategy: "jwt" },
  providers: [
    // Google sign-in is enabled only when the env pair is configured.
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Guest",
      credentials: {
        email: { label: "Email", type: "text" },
      },
      async authorize(credentials) {
        const raw = typeof credentials?.email === "string" ? credentials.email : "";
        let email = raw.trim().toLowerCase();
        if (!EMAIL_RE.test(email)) {
          email = GUEST_EMAIL;
        }

        const user = await db.user.upsert({
          where: { email },
          update: {},
          create: { email, credits: 20, planTier: "free" },
        });

        return {
          id: user.id,
          name: user.username ?? email.split("@")[0],
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.email = user.email ?? token.email;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.email = token.email ?? session.user.email;
      }
      return session;
    },
  },
};
