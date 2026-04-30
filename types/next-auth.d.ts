import { Role } from "@prisma/client";
import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      username: string;
    } & DefaultSession["user"];
  }

}

declare module "next-auth/jwt" {
  interface JWT {
    role?: Role;
    username?: string;
  }
}
