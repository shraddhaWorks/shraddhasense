import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server-utils";

const approveRejectSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminReason: z.string().min(3, "Reason is required").optional(),
});

export async function GET(request: Request) {
  try {
    const admin = await requireRole(Role.ADMIN);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") as any;

    const leaves = await prisma.leave.findMany({
      where: {
        user: {
          adminId: admin.id,
        },
        ...(status && { status: status as any }),
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
      orderBy: { leaveDate: "desc" },
    });

    return NextResponse.json({ leaves });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
