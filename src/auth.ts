import "server-only";

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import bcrypt from "bcryptjs";

import { db } from "@/lib/server/db";
import type { UserRole } from "@/lib/auth/roles";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        if (user.id) token.id = user.id;
        if ("role" in user && user.role) {
          token.role = user.role as UserRole;
        }
      }
      return token;
    },

    session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
  },

  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        let user;
        try {
          user = await db.user.findUnique({
            where: { email: parsed.data.email },
            select: {
              id: true,
              email: true,
              name: true,
              password: true,
              role: true,
              image: true,
            },
          });
        } catch {
          return null;
        }

        if (!user?.password) return null;

        const passwordMatch = await bcrypt.compare(
          parsed.data.password,
          user.password,
        );
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),
  ],
});
