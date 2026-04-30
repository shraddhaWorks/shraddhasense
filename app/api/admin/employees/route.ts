import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/server-utils";

const createEmployeeSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(4),
  monthlySalary: z.number().positive(),
});

export async function GET() {
  try {
    const admin = await requireRole(Role.ADMIN);
    const employees = await prisma.user.findMany({
      where: { adminId: admin.id, role: Role.EMPLOYEE },
      select: {
        id: true,
        name: true,
        username: true,
        monthlySalary: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ employees });
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
    const parsed = createEmployeeSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const passwordHash = await hash(parsed.data.password, 10);

    const employee = await prisma.user.create({
      data: {
        name: parsed.data.name,
        username: parsed.data.username,
        passwordHash,
        monthlySalary: parsed.data.monthlySalary,
        role: Role.EMPLOYEE,
        adminId: admin.id,
      },
      select: {
        id: true,
        name: true,
        username: true,
        monthlySalary: true,
      },
    });

    return NextResponse.json({ employee }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json({ error: "Username already exists" }, { status: 409 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 403;
    return NextResponse.json({ error: message }, { status });
  }
}
