import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizeDay, requireRole } from "@/lib/server-utils";
import { importPublicHolidaysForAdmin } from "@/lib/holidays";

export async function GET(request: Request) {
  try {
    const user = await requireRole(Role.EMPLOYEE);
    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");

    if (!dateStr) {
      return NextResponse.json({ error: "Date parameter required" }, { status: 400 });
    }

    const checkDate = normalizeDay(new Date(dateStr));

    // Get employee's admin
    const employee = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { adminId: true },
    });

    if (!employee.adminId) {
      return NextResponse.json({ holiday: null });
    }

    // ensure public holidays are imported for this admin/year
    await importPublicHolidaysForAdmin(employee.adminId, checkDate.getUTCFullYear());

    const holiday = await prisma.holiday.findUnique({
      where: {
        adminId_date: {
          adminId: employee.adminId,
          date: checkDate,
        },
      },
    });

    return NextResponse.json({ holiday });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
