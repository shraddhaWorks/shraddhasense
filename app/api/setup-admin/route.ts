import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  name: z.string().min(2),
  username: z.string().min(3),
  password: z.string().min(4),
});

export async function POST(request: Request) {
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  if (adminCount > 0) {
    return NextResponse.json({ error: "Admin already configured" }, { status: 409 });
  }

  const payload = await request.json();
  const parsed = setupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const admin = await prisma.user.create({
    data: {
      name: parsed.data.name,
      username: parsed.data.username,
      passwordHash: await hash(parsed.data.password, 10),
      role: Role.ADMIN,
      monthlySalary: 0,
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
    },
  });

  return NextResponse.json({ admin }, { status: 201 });
}
