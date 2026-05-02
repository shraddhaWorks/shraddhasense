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

/** Saturday + Sunday count in the calendar month (UTC dates). */
export function weekendDaysInMonth(year: number, month: number) {
  const dim = daysInMonth(year, month);
  let count = 0;
  for (let d = 1; d <= dim; d++) {
    const dow = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
    if (dow === 0 || dow === 6) count += 1;
  }
  return count;
}
