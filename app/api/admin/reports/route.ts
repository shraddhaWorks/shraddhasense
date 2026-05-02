import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { daysInMonth, requireRole, weekendDaysInMonth } from "@/lib/server-utils";

export async function GET(request: Request) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") ?? "").trim().toLowerCase();
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    const employees = await prisma.user.findMany({
      where: {
        adminId: admin.id,
        role: Role.EMPLOYEE,
      },
      include: {
        attendances: {
          where: { workDate: { gte: monthStart, lt: nextMonthStart } },
          orderBy: { workDate: "desc" },
        },
        leaves: {
          where: { leaveDate: { gte: monthStart, lt: nextMonthStart } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const monthDays = daysInMonth(year, month);
    const weekendDays = weekendDaysInMonth(year, month);
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const monthLabel = `${monthNames[month - 1]} ${year}`;

    const reportRows = employees
      .map((employee) => {
        const fullLeaves = employee.leaves.filter((l) => l.type === "FULL_DAY").length;
        const halfLeaves = employee.leaves.filter((l) => l.type === "HALF_DAY").length;
        const leaveDays = fullLeaves + halfLeaves * 0.5;
        const perDay = Number(employee.monthlySalary) / monthDays;
        const leaveDeduction = leaveDays * perDay;
        const netSalary = Math.max(0, Number(employee.monthlySalary) - leaveDeduction);

        return {
          id: employee.id,
          name: employee.name,
          username: employee.username,
          attendanceDays: employee.attendances.length,
          fullDayLeaves: fullLeaves,
          halfDayLeaves: halfLeaves,
          leaveDays,
          baseSalary: Number(employee.monthlySalary),
          leaveDeduction: Number(leaveDeduction.toFixed(2)),
          netSalary: Number(netSalary.toFixed(2)),
        };
      })
      .filter((row) => {
        if (!search) return true;
        return row.name.toLowerCase().includes(search) || row.username.toLowerCase().includes(search);
      });

    return NextResponse.json({
      month,
      year,
      monthLabel,
      calendarDays: monthDays,
      weekendDays,
      totalEmployees: reportRows.length,
      rows: reportRows,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
