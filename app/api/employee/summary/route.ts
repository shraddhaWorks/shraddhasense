import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysInMonth, normalizeDay, requireRole } from "@/lib/server-utils";
import { importPublicHolidaysForAdmin } from "@/lib/holidays";

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

function getMinutes(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function getDayType(attendance: { punchInAt: Date; punchOutAt: Date | null }) {
  if (!attendance.punchOutAt) return null;
  const punchInMinutes = getMinutes(attendance.punchInAt);
  const punchOutMinutes = getMinutes(attendance.punchOutAt);
  const isFullDayPunchIn = punchInMinutes >= 9 * 60 && punchInMinutes <= 11 * 60;
  const isFullDayPunchOut = punchOutMinutes >= 18 * 60 && punchOutMinutes <= 20 * 60;
  return isFullDayPunchIn && isFullDayPunchOut ? "FULL_DAY" : "HALF_DAY";
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

    const userRecord = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { monthlySalary: true, adminId: true },
    });

    // ensure public holidays are imported for this admin/year
    if (userRecord.adminId) {
      await importPublicHolidaysForAdmin(userRecord.adminId, monthStart.getUTCFullYear());
    }

    const [attendances, leaves, todayAttendance, holidays] = await Promise.all([
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
      userRecord.adminId
        ? prisma.holiday.findMany({
            where: {
              adminId: userRecord.adminId,
              date: { gte: monthStart, lt: nextMonthStart },
            },
          })
        : Promise.resolve([]),
    ]);

    const todayAttendanceWithType = todayAttendance
      ? {
          ...todayAttendance,
          dayType: getDayType(todayAttendance),
        }
      : null;

    // Separate full day and half day leaves (only approved)
    const approvedLeaves = leaves.filter((l) => l.status === "APPROVED");
    const approvedFullLeaves = approvedLeaves.filter((l) => l.type === "FULL_DAY").length;
    const approvedHalfLeaves = approvedLeaves.filter((l) => l.type === "HALF_DAY").length;

    // Count full days and half days from attendance
    const fullDayAttendances = attendances.filter((a) => getDayType(a) === "FULL_DAY").length;
    const halfDayAttendances = attendances.filter((a) => getDayType(a) === "HALF_DAY").length;

    // Calculate total working days in month (excluding weekends)
    const totalDaysInMonth = daysInMonth(year, month);
    let workingDaysInMonth = 0;
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dayOfWeek = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysInMonth++;
      }
    }

    // Count holidays
    const holidayDays = holidays.length;

    // Calculate absents (working days - attended days - approved leave days - holidays)
    const attendedDays = fullDayAttendances + halfDayAttendances * 0.5;
    const approveLeaveDays = approvedFullLeaves + approvedHalfLeaves * 0.5;
    const absentDays = Math.max(
      0,
      workingDaysInMonth - attendedDays - approveLeaveDays - holidayDays
    );

    // Calculate salary deduction (based on approved leaves + absents, NOT holidays)
    const leaveDays = approveLeaveDays + absentDays;
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
        fullDay: approvedFullLeaves,
        halfDay: approvedHalfLeaves,
        pending: leaves.filter((l) => l.status === "PENDING").length,
        rejected: leaves.filter((l) => l.status === "REJECTED").length,
      },
      attendance: {
        fullDays: fullDayAttendances,
        halfDays: halfDayAttendances,
      },
      absents: Math.round(absentDays * 100) / 100,
      holidays: holidayDays,
      shift: {
        start: "10:00 AM",
        end: "6:30 PM",
      },
      todayAttendance: todayAttendanceWithType,
      attendances,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
