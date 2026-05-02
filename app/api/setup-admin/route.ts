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

function bearerSecret(request: Request) {
  const h = request.headers.get("authorization");
  if (!h?.startsWith("Bearer ")) return null;
  return h.slice("Bearer ".length).trim();
}

/**
 * Admin signup (no Prisma seed).
 *
 * **Prerequisite:** the Next.js app must be running so the API exists, e.g. from the `sense` folder:
 *   `npm run dev`
 * Then open the URL shown (usually `http://localhost:3000`). If you use another port, change the URL below.
 * `curl: (7) Failed to connect` means nothing is listening on that host:port yet.
 *
 * - First admin (no ADMIN users yet): POST JSON body only.
 * - Additional admins: set ADMIN_SETUP_SECRET in .env and send:
 *   Authorization: Bearer <ADMIN_SETUP_SECRET>
 *
 * Windows PowerShell: `curl` is Invoke-WebRequest — use **curl.exe** or Invoke-RestMethod:
 *
 *   curl.exe -sS -X POST http://localhost:3000/api/setup-admin -H "Content-Type: application/json" --data-raw '{"name":"Shraddha Tech","username":"sraddhaTech","password":"sraddhaTech123"}'
 *
 *   Invoke-RestMethod -Uri "http://localhost:3000/api/setup-admin" -Method Post -ContentType "application/json" -Body '{"name":"Shraddha Tech","username":"sraddhaTech","password":"sraddhaTech123"}'
 *
 * bash/macOS:
 *   curl -sS -X POST http://localhost:3000/api/setup-admin \
 *     -H "Content-Type: application/json" \
 *     -d '{"name":"Shraddha Tech","username":"sraddhaTech","password":"sraddhaTech123"}'
 */
export async function POST(request: Request) {
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  const setupSecret = process.env.ADMIN_SETUP_SECRET?.trim() ?? "";
  const provided = bearerSecret(request);
  const secretAuthorized = setupSecret.length > 0 && provided === setupSecret;

  if (adminCount > 0 && !secretAuthorized) {
    return NextResponse.json(
      {
        error: "Admin already exists",
        hint:
          setupSecret.length > 0
            ? "Send Authorization: Bearer <ADMIN_SETUP_SECRET> to create another admin."
            : "Set ADMIN_SETUP_SECRET in .env to allow additional admin signups via this API.",
      },
      { status: 409 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = setupSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const taken = await prisma.user.findUnique({
    where: { username: parsed.data.username },
    select: { id: true },
  });
  if (taken) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
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

/** Whether the first admin can be created without a setup secret (no admins yet). */
export async function GET() {
  const adminCount = await prisma.user.count({ where: { role: Role.ADMIN } });
  return NextResponse.json({
    signupOpen: adminCount === 0,
    adminCount,
    additionalSignupAllowed: Boolean(process.env.ADMIN_SETUP_SECRET?.trim()),
  });
}
