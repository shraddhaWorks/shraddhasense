import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeDay, requireRole } from "@/lib/server-utils";

const punchInSchema = z.object({
  note: z.string().optional(),
});

const punchOutSchema = z.object({
  note: z.string().optional(),
});

function getMinutesNow(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function isPunchInAllowed(now: Date) {
  const minutes = getMinutesNow(now);
  const start = 9 * 60;
  const end = 20 * 60;
  return minutes >= start && minutes < end;
}

function classifyAttendance(punchInAt: Date, punchOutAt: Date) {
  const punchInMinutes = getMinutesNow(punchInAt);
  const punchOutMinutes = getMinutesNow(punchOutAt);

  const isFullDayPunchIn = punchInMinutes >= 9 * 60 && punchInMinutes <= 11 * 60;
  const isFullDayPunchOut = punchOutMinutes >= 18 * 60 && punchOutMinutes <= 20 * 60;

  return isFullDayPunchIn && isFullDayPunchOut ? "FULL_DAY" : "HALF_DAY";
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(Role.EMPLOYEE);
    const payload = await request.json().catch(() => ({}));
    const parsed = punchInSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const now = new Date();
    if (!isPunchInAllowed(now)) {
      return NextResponse.json(
        { error: "Punch in is allowed only between 9:00 AM and 8:00 PM." },
        { status: 400 }
      );
    }

    const today = normalizeDay(new Date());

    // Check if there's an approved leave for today
    const approvedLeave = await prisma.leave.findFirst({
      where: {
        userId: user.id,
        leaveDate: today,
        status: "APPROVED",
      },
    });

    if (approvedLeave) {
      return NextResponse.json(
        { error: "Cannot punch in on an approved leave day." },
        { status: 409 }
      );
    }

    // Get employee's admin and check for holiday
    const employee = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: { adminId: true },
    });

    if (employee.adminId) {
      const holiday = await prisma.holiday.findUnique({
        where: {
          adminId_date: {
            adminId: employee.adminId,
            date: today,
          },
        },
      });
      if (holiday) {
        return NextResponse.json(
          {
            error: `Cannot punch in on a holiday: ${holiday.type.replace(/_/g, " ")}${holiday.note ? ` - ${holiday.note}` : ""}`,
          },
          { status: 409 }
        );
      }
    }

    const existing = await prisma.attendance.findUnique({
      where: { userId_workDate: { userId: user.id, workDate: today } },
    });

    if (existing) {
      return NextResponse.json({ error: "Already punched in today" }, { status: 409 });
    }

    const attendance = await prisma.attendance.create({
      data: {
        userId: user.id,
        workDate: today,
        punchInAt: now,
        punchInLocation: "",
        note: parsed.data.note,
      },
    });

    return NextResponse.json({ attendance }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireRole(Role.EMPLOYEE);
    const payload = await request.json().catch(() => ({}));
    const parsed = punchOutSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const today = normalizeDay(new Date());
    const existing = await prisma.attendance.findUnique({
      where: { userId_workDate: { userId: user.id, workDate: today } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Punch in first" }, { status: 404 });
    }

    if (existing.punchOutAt) {
      return NextResponse.json({ error: "Already punched out" }, { status: 409 });
    }

    const now = new Date();
    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        punchOutAt: now,
        punchOutLocation: "",
        note: parsed.data.note || existing.note,
      },
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
