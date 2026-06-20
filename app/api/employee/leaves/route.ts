import { NextResponse } from "next/server";
import { LeaveType, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeDay, requireRole } from "@/lib/server-utils";

const leaveSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  type: z.nativeEnum(LeaveType),
  note: z.string().min(3, "Leave reason is required"),
});

export async function GET() {
  try {
    const user = await requireRole(Role.EMPLOYEE);
    const leaves = await prisma.leave.findMany({
      where: { userId: user.id },
      orderBy: { leaveDate: "desc" },
    });
    return NextResponse.json({ leaves });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(Role.EMPLOYEE);
    const payload = await request.json();
    const parsed = leaveSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const startDay = normalizeDay(new Date(parsed.data.startDate));
    const endDay = normalizeDay(new Date(parsed.data.endDate));
    if (endDay < startDay) {
      return NextResponse.json({ error: "End date cannot be earlier than start date." }, { status: 400 });
    }

    const days = [] as Date[];
    for (
      let current = new Date(startDay);
      current <= endDay;
      current.setUTCDate(current.getUTCDate() + 1)
    ) {
      days.push(normalizeDay(new Date(current)));
    }

    if (parsed.data.type === "HALF_DAY" && days.length > 1) {
      return NextResponse.json(
        { error: "Half-day leave can only be requested for a single date." },
        { status: 400 }
      );
    }

    const existingLeave = await prisma.leave.findFirst({
      where: {
        userId: user.id,
        leaveDate: { in: days },
      },
    });

    if (existingLeave) {
      return NextResponse.json(
        { error: "Leave already requested for one of these dates." },
        { status: 409 }
      );
    }

    const leaveRecords = await prisma.leave.createMany({
      data: days.map((date) => ({
        userId: user.id,
        leaveDate: date,
        type: parsed.data.type,
        note: parsed.data.note,
        status: "PENDING",
      })),
    });

    return NextResponse.json({ leaveCount: leaveRecords.count }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
