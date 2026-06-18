import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysInMonth, requireRole } from "@/lib/server-utils";

function getDayType(attendance: { punchInAt: Date; punchOutAt: Date | null }) {
  if (!attendance.punchOutAt) return null;
  const punchInMinutes = attendance.punchInAt.getHours() * 60 + attendance.punchInAt.getMinutes();
  const punchOutMinutes = attendance.punchOutAt.getHours() * 60 + attendance.punchOutAt.getMinutes();
  const isFullDayPunchIn = punchInMinutes >= 9 * 60 && punchInMinutes <= 11 * 60;
  const isFullDayPunchOut = punchOutMinutes >= 18 * 60 && punchOutMinutes <= 20 * 60;
  return isFullDayPunchIn && isFullDayPunchOut ? "FULL_DAY" : "HALF_DAY";
}

export async function GET(request: Request) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    const [employees, holidays] = await Promise.all([
      prisma.user.findMany({
        where: { adminId: admin.id, role: Role.EMPLOYEE },
        include: {
          attendances: {
            where: {
              workDate: {
                gte: monthStart,
                lt: nextMonthStart,
              },
            },
            orderBy: { workDate: "desc" },
          },
          leaves: {
            where: {
              leaveDate: {
                gte: monthStart,
                lt: nextMonthStart,
              },
            },
          },
          salaryCredits: {
            where: { month, year },
          },
        },
      }),
      prisma.holiday.findMany({
        where: {
          adminId: admin.id,
          date: {
            gte: monthStart,
            lt: nextMonthStart,
          },
        },
      }),
    ]);

    const monthDays = daysInMonth(year, month);
    
    // Calculate working days in month (excluding weekends)
    let workingDaysInMonth = 0;
    for (let d = 1; d <= monthDays; d++) {
      const dayOfWeek = new Date(Date.UTC(year, month - 1, d)).getUTCDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDaysInMonth++;
      }
    }

    // Count holidays
    const holidayDays = holidays.length;

    const result = employees.map((employee) => {
      // Only count approved leaves
      const approvedLeaves = employee.leaves.filter((l) => l.status === "APPROVED");
      const approvedFullLeaves = approvedLeaves.filter((l) => l.type === "FULL_DAY").length;
      const approvedHalfLeaves = approvedLeaves.filter((l) => l.type === "HALF_DAY").length;

      // Count full days and half days from attendance
      const fullDayAttendances = employee.attendances.filter((a) => getDayType(a) === "FULL_DAY").length;
      const halfDayAttendances = employee.attendances.filter((a) => getDayType(a) === "HALF_DAY").length;

      // Calculate absents (excluding holidays)
      const attendedDays = fullDayAttendances + halfDayAttendances * 0.5;
      const approveLeaveDays = approvedFullLeaves + approvedHalfLeaves * 0.5;
      const absentDays = Math.max(0, workingDaysInMonth - attendedDays - approveLeaveDays - holidayDays);

      // Calculate salary deduction (no deduction for holidays)
      const leaveDays = approveLeaveDays + absentDays;
      const perDay = Number(employee.monthlySalary) / monthDays;
      const leaveDeduction = perDay * leaveDays;
      const netSalary = Number(employee.monthlySalary) - leaveDeduction;

      return {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        monthlySalary: Number(employee.monthlySalary),
        attendanceCount: employee.attendances.length,
        attendance: {
          fullDays: fullDayAttendances,
          halfDays: halfDayAttendances,
        },
        leaves: {
          fullDay: approvedFullLeaves,
          halfDay: approvedHalfLeaves,
          totalLeaveDays: approveLeaveDays,
          pending: employee.leaves.filter((l) => l.status === "PENDING").length,
          rejected: employee.leaves.filter((l) => l.status === "REJECTED").length,
        },
        absents: Math.round(absentDays * 100) / 100,
        salary: {
          calculatedNet: Math.max(0, Number(netSalary.toFixed(2))),
          creditedAmount: employee.salaryCredits[0]
            ? Number(employee.salaryCredits[0].netAmount)
            : 0,
        },
        latestAttendance: employee.attendances[0] ?? null,
      };
    });

    return NextResponse.json({ month, year, workingDaysInMonth, employees: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
