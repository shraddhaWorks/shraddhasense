import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeDay, requireRole } from "@/lib/server-utils";

const punchInSchema = z.object({
  location: z.string().min(2),
  note: z.string().optional(),
});

const punchOutSchema = z.object({
  location: z.string().min(2),
  note: z.string().optional(),
});

const SHIFT_START_MINUTES = 10 * 60;
const SHIFT_END_MINUTES = 18 * 60 + 30;
const OFFICE_CENTER = { lat: 14.650522, lng: 77.607849 };
const OFFICE_RADIUS_KM = 3;
const OFFICE_LOCATION_LABEL = "Office";

function getMinutesNow(date: Date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseLatLng(location: string) {
  const [latRaw, lngRaw] = location.split(",").map((part) => part.trim());
  const lat = Number(latRaw);
  const lng = Number(lngRaw);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng };
}

function toRad(value: number) {
  return (value * Math.PI) / 180;
}

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const earthRadiusKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(hav));
}

export async function POST(request: Request) {
  try {
    const user = await requireRole(Role.EMPLOYEE);
    const payload = await request.json();
    const parsed = punchInSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const coords = parseLatLng(parsed.data.location);
    if (!coords) {
      return NextResponse.json(
        { error: "Invalid location format. Use latitude, longitude." },
        { status: 400 }
      );
    }
    const officeDistance = distanceKm(coords, OFFICE_CENTER);
    if (officeDistance > OFFICE_RADIUS_KM) {
      return NextResponse.json(
        { error: `Outside office area. You must be within ${OFFICE_RADIUS_KM} km.` },
        { status: 400 }
      );
    }

    const now = new Date();
    const minutesNow = getMinutesNow(now);
    if (minutesNow < SHIFT_START_MINUTES || minutesNow > SHIFT_END_MINUTES) {
      return NextResponse.json(
        { error: "Punch in is allowed only between 10:00 AM and 6:30 PM." },
        { status: 400 }
      );
    }

    const today = normalizeDay(new Date());
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
        punchInLocation: OFFICE_LOCATION_LABEL,
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
    const payload = await request.json();
    const parsed = punchOutSchema.safeParse(payload);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const coords = parseLatLng(parsed.data.location);
    if (!coords) {
      return NextResponse.json(
        { error: "Invalid location format. Use latitude, longitude." },
        { status: 400 }
      );
    }
    const officeDistance = distanceKm(coords, OFFICE_CENTER);
    if (officeDistance > OFFICE_RADIUS_KM) {
      return NextResponse.json(
        { error: `Outside office area. You must be within ${OFFICE_RADIUS_KM} km.` },
        { status: 400 }
      );
    }

    const now = new Date();
    const minutesNow = getMinutesNow(now);
    if (minutesNow < SHIFT_END_MINUTES) {
      return NextResponse.json(
        { error: "Punch out is allowed after 6:30 PM." },
        { status: 400 }
      );
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

    const attendance = await prisma.attendance.update({
      where: { id: existing.id },
      data: {
        punchOutAt: now,
        punchOutLocation: OFFICE_LOCATION_LABEL,
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
