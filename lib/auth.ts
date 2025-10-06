import NextAuth, { type DefaultSession } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_ID! as string,
      clientSecret: process.env.GITHUB_SECRET! as string,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_ID! as string,
      clientSecret: process.env.GOOGLE_SECRET! as string,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
} satisfies Parameters<typeof NextAuth>[0];
