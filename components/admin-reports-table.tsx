"use client";

import { useEffect, useMemo, useState } from "react";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

function monthName(monthNumber: number) {
  const m = Math.min(12, Math.max(1, Math.floor(monthNumber)));
  return MONTH_NAMES[m - 1];
}

type ReportRow = {
  id: string;
  name: string;
  username: string;
  attendanceDays: number;
  fullDayLeaves: number;
  halfDayLeaves: number;
  leaveDays: number;
  baseSalary: number;
  leaveDeduction: number;
  netSalary: number;
};

type ReportMeta = {
  month: number;
  year: number;
  monthLabel: string;
  calendarDays: number;
  weekendDays: number;
  totalEmployees: number;
};

export function AdminReportsTable() {
  const now = new Date();
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [meta, setMeta] = useState<ReportMeta | null>(null);

  useEffect(() => {
    async function loadReports() {
      const q = new URLSearchParams({
        search,
        month: String(month),
        year: String(year),
      });
      const res = await fetch(`/api/admin/reports?${q.toString()}`, { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setRows(data.rows ?? []);
      setMeta({
        month: data.month ?? month,
        year: data.year ?? year,
        monthLabel: data.monthLabel ?? "",
        calendarDays: data.calendarDays ?? 0,
        weekendDays: data.weekendDays ?? 0,
        totalEmployees: data.totalEmployees ?? 0,
      });
    }
    const timer = setTimeout(() => {
      void loadReports();
    }, 0);
    return () => clearTimeout(timer);
  }, [search, month, year]);

  const csvContent = useMemo(() => {
    const header = [
      "Name",
      "Username",
      "Month name",
      "Year",
      "Calendar days",
      "Weekend days (holidays)",
      "Attendance days (in month)",
      "Full-Day Leaves",
      "Half-Day Leaves",
      "Total leave days",
      "Base salary",
      "Leave deduction",
      "Net salary",
    ];
    const body = rows.map((r) => [
      r.name,
      r.username,
      monthName(month),
      String(year),
      String(meta?.calendarDays ?? ""),
      String(meta?.weekendDays ?? ""),
      String(r.attendanceDays),
      String(r.fullDayLeaves),
      String(r.halfDayLeaves),
      String(r.leaveDays),
      String(r.baseSalary),
      String(r.leaveDeduction),
      String(r.netSalary),
    ]);
    return [header, ...body].map((line) => line.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
  }, [rows, month, year, meta?.calendarDays, meta?.weekendDays]);

  const workingApprox =
    meta != null ? Math.max(0, meta.calendarDays - meta.weekendDays) : null;

  return (
    <div className="surface-card space-y-4 rounded-2xl p-4 sm:space-y-5 sm:p-5">
      <p className="text-sm leading-relaxed text-zinc-400">
        Monthly totals for the selected period. Weekend days are counted as non-working holidays.
      </p>

      {meta ? (
        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-700 bg-zinc-950/80 p-4 sm:grid-cols-2 sm:gap-4 md:gap-4 lg:grid-cols-4">
          <div className="rounded-xl bg-zinc-900/50 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Month</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">{meta.monthLabel}</p>
          </div>
          <div className="rounded-xl bg-zinc-900/50 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Holidays (weekends)</p>
            <p className="mt-1 text-lg font-bold text-orange-400">
              {meta.weekendDays}
              <span className="text-sm font-normal text-zinc-400"> / {meta.calendarDays} days</span>
            </p>
          </div>
          <div className="rounded-xl bg-zinc-900/50 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Working days (approx.)</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">{workingApprox ?? "—"}</p>
            <p className="mt-1 text-xs text-zinc-500">Calendar minus weekends</p>
          </div>
          <div className="rounded-xl bg-zinc-900/50 p-3 sm:p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Employees</p>
            <p className="mt-1 text-lg font-bold text-zinc-100">{meta.totalEmployees}</p>
          </div>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-end lg:gap-3 xl:gap-4">
        <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2 lg:min-w-[12rem] lg:flex-1 xl:min-w-[14rem]">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or username"
            className="input-app w-full"
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Month</span>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="input-app w-full min-w-0 sm:min-w-[11rem]"
            aria-label="Report month"
          >
            {MONTH_NAMES.map((name, i) => (
              <option key={name} value={i + 1}>
                {name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500">Year</span>
          <input
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            type="number"
            min={2020}
            max={2100}
            className="input-app w-full sm:w-28"
          />
        </label>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
          download={`employee-report-${year}-${monthName(month)}.csv`}
          className="btn-primary inline-flex min-h-12 w-full items-center justify-center text-center no-underline sm:col-span-2 lg:col-span-1 lg:w-auto lg:shrink-0"
        >
          Export CSV
        </a>
      </div>

      <div className="lg:hidden">
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-10 text-center text-sm text-zinc-500">
            No rows for this month.
          </p>
        ) : (
          <ul className="space-y-3">
            {rows.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-4 shadow-lg"
              >
                <p className="font-semibold text-zinc-100">
                  {r.name}
                  <span className="mt-0.5 block text-sm font-normal text-zinc-500">@{r.username}</span>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Attendance</p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-orange-400">{r.attendanceDays}</p>
                    <p className="text-xs text-zinc-500">days</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Net salary</p>
                    <p className="mt-1 text-xl font-bold tabular-nums text-orange-400">{r.netSalary}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-1 border-t border-zinc-800 pt-3 text-sm text-zinc-400">
                  <p>
                    Leaves — full {r.fullDayLeaves}, half {r.halfDayLeaves} (total {r.leaveDays})
                  </p>
                  <p>
                    Base {r.baseSalary} · Deduction {r.leaveDeduction}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="hidden lg:block">
        <div className="table-scroll-wrap overflow-x-auto">
          <table className="table-app min-w-[640px] text-left text-sm xl:text-base">
            <thead className="text-zinc-200">
              <tr>
                <th className="px-3 py-3">Employee</th>
                <th className="px-3 py-3">Attendance</th>
                <th className="px-3 py-3">Leaves</th>
                <th className="px-3 py-3">Salary</th>
              </tr>
            </thead>
            <tbody className="text-zinc-300">
              {rows.length === 0 ? (
                <tr>
                  <td className="px-3 py-4 text-zinc-500" colSpan={4}>
                    No report rows for this month.
                  </td>
                </tr>
              ) : (
                rows.map((r) => (
                  <tr key={r.id} className="border-t border-zinc-700/90 align-top">
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-zinc-100">{r.name}</span>
                      <div className="text-xs text-zinc-500">@{r.username}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-lg font-semibold tabular-nums text-orange-400">
                        {r.attendanceDays}
                      </span>
                      <span className="text-zinc-500"> days</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="text-xs sm:text-sm">
                        Full {r.fullDayLeaves}, half {r.halfDayLeaves}
                      </div>
                      <div className="text-zinc-500">Total leave {r.leaveDays}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="tabular-nums text-zinc-100">Base {r.baseSalary}</div>
                      <div className="text-xs text-orange-300/90">−{r.leaveDeduction}</div>
                      <div className="mt-1 font-semibold text-orange-400">Net {r.netSalary}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
