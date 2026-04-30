import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function requireRole(role: Role) {
  const user = await requireUser();
  if (user.role !== role) {
    throw new Error("Forbidden");
  }
  return user;
}

export function normalizeDay(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}
