import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server-utils";

const approveRejectSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminReason: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const { id } = await params;
    const payload = await request.json();
    const parsed = approveRejectSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Verify the leave belongs to one of the admin's employees
    const leave = await prisma.leave.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            adminId: true,
          },
        },
      },
    });

    if (!leave) {
      return NextResponse.json({ error: "Leave request not found" }, { status: 404 });
    }

    if (leave.user.adminId !== admin.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedLeave = await prisma.leave.update({
      where: { id },
      data: {
        status: parsed.data.status as any,
        adminReason: parsed.data.adminReason,
        reviewedAt: new Date(),
        reviewedBy: admin.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    return NextResponse.json({ leave: updatedLeave });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
