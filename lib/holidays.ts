import { prisma } from "@/lib/prisma";
import { HolidayType } from "@prisma/client";
import { normalizeDay, daysInMonth } from "./server-utils";

type NagerHoliday = {
  date: string; // YYYY-MM-DD
  localName: string;
  name: string;
  countryCode: string;
  fixed: boolean;
  global: boolean;
  counties?: string[] | null;
  launchYear?: number | null;
  types: string[];
};

/**
 * Import public holidays from Nager.Date for the given year and assign them to the admin.
 * Uses Prisma.createMany with skipDuplicates so existing entries are not duplicated.
 */
export async function importPublicHolidaysForAdmin(adminId: string, year: number) {
  try {
    const res = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
    if (!res.ok) return;
    const data = (await res.json()) as NagerHoliday[];
    if (!Array.isArray(data) || data.length === 0) return;

    const rows = data.map((h) => ({
      adminId,
      date: normalizeDay(new Date(h.date)),
      type: HolidayType.PUBLIC_HOLIDAY,
      note: h.localName || h.name || undefined,
    }));

    // createMany with skipDuplicates to avoid violating unique constraint
    // Also generate recurring weekend holidays: every Sunday and 2nd & 4th Saturdays
    const recurringRows: { adminId: string; date: Date; type: HolidayType; note?: string }[] = [];
    for (let m = 0; m < 12; m++) {
      const dim = daysInMonth(year, m + 1);
      // collect Sundays
      for (let d = 1; d <= dim; d++) {
        const dt = new Date(Date.UTC(year, m, d));
        if (dt.getUTCDay() === 0) {
          recurringRows.push({ adminId, date: normalizeDay(dt), type: HolidayType.COMPANY_HOLIDAY, note: "Sunday" });
        }
      }
      // find 2nd and 4th Saturday
      let firstSat = -1;
      for (let d = 1; d <= 7; d++) {
        const dt = new Date(Date.UTC(year, m, d));
        if (dt.getUTCDay() === 6) {
          firstSat = d;
          break;
        }
      }
      if (firstSat !== -1) {
        const second = firstSat + 7;
        const fourth = firstSat + 21;
        if (second <= dim) recurringRows.push({ adminId, date: normalizeDay(new Date(Date.UTC(year, m, second))), type: HolidayType.COMPANY_HOLIDAY, note: "2nd Saturday" });
        if (fourth <= dim) recurringRows.push({ adminId, date: normalizeDay(new Date(Date.UTC(year, m, fourth))), type: HolidayType.COMPANY_HOLIDAY, note: "4th Saturday" });
      }
    }

    // Deduplicate by time value to avoid duplicate rows in the input array
    const seen = new Set<number>();
    const allRows = [...rows, ...recurringRows].filter((r) => {
      const t = +r.date;
      if (seen.has(t)) return false;
      seen.add(t);
      return true;
    });

    await prisma.holiday.createMany({ data: allRows, skipDuplicates: true });
  } catch (err) {
    console.error("Failed to import public holidays:", err);
  }
}
