import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(4),
});

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret:
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "dev-secret-change-this",
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  providers: [
    Credentials({
      name: "Username and password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { username: parsed.data.username },
        });

        if (!user) return null;
        const passwordOk = await compare(parsed.data.password, user.passwordHash);
        if (!passwordOk) return null;

        return {
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, username: true },
        });
        token.role = dbUser?.role ?? "EMPLOYEE";
        token.username = dbUser?.username ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.sub ?? "");
        session.user.role = (token.role as "ADMIN" | "EMPLOYEE") ?? "EMPLOYEE";
        session.user.username = String(token.username ?? "");
      }
      return session;
    },
  },
};
