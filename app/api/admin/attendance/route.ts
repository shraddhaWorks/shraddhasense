import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server-utils";

export async function GET(request: Request) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    const targetDate = dateParam
      ? new Date(`${dateParam}T00:00:00.000Z`)
      : new Date(new Date().toISOString().slice(0, 10) + "T00:00:00.000Z");

    if (Number.isNaN(targetDate.getTime())) {
      return NextResponse.json({ error: "Invalid date format. Use YYYY-MM-DD." }, { status: 400 });
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        workDate: targetDate,
        user: {
          adminId: admin.id,
          role: Role.EMPLOYEE,
        },
      },
      include: {
        user: {
          select: {
            name: true,
            username: true,
          },
        },
      },
      orderBy: { punchInAt: "asc" },
    });

    return NextResponse.json({
      date: targetDate.toISOString().slice(0, 10),
      records: attendances.map((a) => ({
        id: a.id,
        employeeName: a.user.name,
        username: a.user.username,
        punchInAt: a.punchInAt,
        punchInLocation: a.punchInLocation,
        punchOutAt: a.punchOutAt,
        punchOutLocation: a.punchOutLocation,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
