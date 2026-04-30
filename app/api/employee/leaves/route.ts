import { NextResponse } from "next/server";
import { LeaveType, Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeDay, requireRole } from "@/lib/server-utils";

const leaveSchema = z.object({
  leaveDate: z.string().datetime(),
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

    const leave = await prisma.leave.create({
      data: {
        userId: user.id,
        leaveDate: normalizeDay(new Date(parsed.data.leaveDate)),
        type: parsed.data.type,
        note: parsed.data.note,
      },
    });
    return NextResponse.json({ leave }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
