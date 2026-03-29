import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";

const isDevAuth = process.env.DEV_AUTH === "true";

if (isDevAuth) {
  console.warn(
    "\x1b[33m⚠ DEV AUTH ENABLED — Credentials provider active, JWT session strategy\x1b[0m"
  );
}

import type { Provider } from "next-auth/providers";

const providers: Provider[] = [Google];

if (isDevAuth) {
  providers.push(
    Credentials({
      name: "Dev Login",
      credentials: {
        name: { label: "Name", type: "text" },
        email: { label: "Email", type: "email" },
      },
      async authorize(credentials) {
        const name = credentials.name as string;
        const email = credentials.email as string;
        if (!name || !email) return null;

        const user = await prisma.user.upsert({
          where: { email },
          update: { name },
          create: { name, email },
        });

        return { id: user.id, name: user.name, email: user.email };
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: {
    strategy: isDevAuth ? "jwt" : "database",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    session({ session, user, token }: any) {
      if (session.user) {
        session.user.id = user?.id ?? token?.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
});
