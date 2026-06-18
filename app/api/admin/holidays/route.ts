import { NextResponse } from "next/server";
import { HolidayType, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeDay, requireRole } from "@/lib/server-utils";

const holidaySchema = z.object({
  date: z.string().datetime(),
  type: z.nativeEnum(HolidayType),
  note: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const month = Number(searchParams.get("month")) || new Date().getMonth() + 1;
    const year = Number(searchParams.get("year")) || new Date().getFullYear();

    const monthStart = new Date(Date.UTC(year, month - 1, 1));
    const nextMonthStart = new Date(Date.UTC(year, month, 1));

    const holidays = await prisma.holiday.findMany({
      where: {
        adminId: admin.id,
        date: {
          gte: monthStart,
          lt: nextMonthStart,
        },
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ holidays, month, year });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const payload = await request.json();
    const parsed = holidaySchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const normalizedDate = normalizeDay(new Date(parsed.data.date));

    // Check if holiday already exists for this date
    const existing = await prisma.holiday.findUnique({
      where: {
        adminId_date: {
          adminId: admin.id,
          date: normalizedDate,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Holiday already exists for this date" },
        { status: 409 }
      );
    }

    const holiday = await prisma.holiday.create({
      data: {
        adminId: admin.id,
        date: normalizedDate,
        type: parsed.data.type,
        note: parsed.data.note,
      },
    });

    return NextResponse.json({ holiday }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
