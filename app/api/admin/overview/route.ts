import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysInMonth, requireRole } from "@/lib/server-utils";

export async function GET(request: Request) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const employees = await prisma.user.findMany({
      where: { adminId: admin.id, role: Role.EMPLOYEE },
      include: {
        attendances: {
          where: {
            workDate: {
              gte: new Date(Date.UTC(year, month - 1, 1)),
              lt: new Date(Date.UTC(year, month, 1)),
            },
          },
          orderBy: { workDate: "desc" },
        },
        leaves: {
          where: {
            leaveDate: {
              gte: new Date(Date.UTC(year, month - 1, 1)),
              lt: new Date(Date.UTC(year, month, 1)),
            },
          },
        },
        salaryCredits: {
          where: { month, year },
        },
      },
    });

    const monthDays = daysInMonth(year, month);
    const result = employees.map((employee) => {
      const fullLeaves = employee.leaves.filter((l) => l.type === "FULL_DAY").length;
      const halfLeaves = employee.leaves.filter((l) => l.type === "HALF_DAY").length;
      const leaveDays = fullLeaves + halfLeaves * 0.5;
      const perDay = Number(employee.monthlySalary) / monthDays;
      const leaveDeduction = perDay * leaveDays;
      const netSalary = Number(employee.monthlySalary) - leaveDeduction;

      return {
        id: employee.id,
        name: employee.name,
        username: employee.username,
        monthlySalary: Number(employee.monthlySalary),
        attendanceCount: employee.attendances.length,
        leaves: {
          fullDay: fullLeaves,
          halfDay: halfLeaves,
          totalLeaveDays: leaveDays,
        },
        salary: {
          calculatedNet: Math.max(0, Number(netSalary.toFixed(2))),
          creditedAmount: employee.salaryCredits[0]
            ? Number(employee.salaryCredits[0].netAmount)
            : 0,
        },
        latestAttendance: employee.attendances[0] ?? null,
      };
    });

    return NextResponse.json({ month, year, employees: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
