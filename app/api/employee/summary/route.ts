import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysInMonth, normalizeDay, requireRole } from "@/lib/server-utils";

function calculateStreak(dates: Date[]) {
  if (dates.length === 0) return 0;
  const normalized = dates
    .map((d) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())))
    .sort((a, b) => b.getTime() - a.getTime());

  let streak = 1;
  for (let i = 1; i < normalized.length; i++) {
    const expected = normalized[i - 1].getTime() - 24 * 60 * 60 * 1000;
    if (normalized[i].getTime() === expected) {
      streak++;
      continue;
    }
    break;
  }
  return streak;
}

export async function GET(request: Request) {
  try {
    const user = await requireRole(Role.EMPLOYEE);
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));
    const today = normalizeDay(new Date());

    const [attendances, leaves, todayAttendance] = await Promise.all([
      prisma.attendance.findMany({
        where: { userId: user.id, workDate: { gte: monthStart, lt: nextMonthStart } },
        orderBy: { workDate: "desc" },
      }),
      prisma.leave.findMany({
        where: { userId: user.id, leaveDate: { gte: monthStart, lt: nextMonthStart } },
      }),
      prisma.attendance.findUnique({
        where: { userId_workDate: { userId: user.id, workDate: today } },
      }),
    ]);

    const userRecord = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { monthlySalary: true },
    });

    const fullLeaves = leaves.filter((l) => l.type === "FULL_DAY").length;
    const halfLeaves = leaves.filter((l) => l.type === "HALF_DAY").length;
    const leaveDays = fullLeaves + halfLeaves * 0.5;
    const perDay = Number(userRecord.monthlySalary) / daysInMonth(year, month);
    const deduction = perDay * leaveDays;
    const netSalary = Math.max(0, Number((Number(userRecord.monthlySalary) - deduction).toFixed(2)));
    const streak = calculateStreak(attendances.map((a) => a.workDate));

    return NextResponse.json({
      month,
      year,
      attendanceCount: attendances.length,
      streak,
      salary: {
        base: Number(userRecord.monthlySalary),
        deduction: Number(deduction.toFixed(2)),
        net: netSalary,
      },
      leaves: {
        fullDay: fullLeaves,
        halfDay: halfLeaves,
      },
      shift: {
        start: "10:00 AM",
        end: "6:30 PM",
      },
      todayAttendance,
      attendances,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
