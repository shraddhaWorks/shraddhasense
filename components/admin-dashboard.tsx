"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { AdminCreateEmployeeForm } from "@/components/admin-create-employee-form";

type OverviewEmployee = {
  id: string;
  name: string;
  username: string;
  monthlySalary: number;
  attendanceCount: number;
  leaves: { fullDay: number; halfDay: number; totalLeaveDays: number };
  salary: { calculatedNet: number; creditedAmount: number };
};

type AttendanceRecord = {
  id: string;
  employeeName: string;
  username: string;
  punchInAt: string;
  punchInLocation: string;
  punchOutAt: string | null;
  punchOutLocation: string | null;
};

const ADMIN_NAV_CARDS = [
  {
    href: "/admin/accounts",
    title: "Accounts",
    subtitle: "Users, roles & salaries",
  },
  {
    href: "/admin/employees",
    title: "Employees",
    subtitle: "Team list & activity counts",
  },
  {
    href: "/admin/create",
    title: "Create",
    subtitle: "Add a new employee account",
  },
  {
    href: "/admin/reports",
    title: "Reports",
    subtitle: "Monthly attendance & payroll",
  },
] as const;

export function AdminDashboard({ userName }: { userName: string }) {
  const [employees, setEmployees] = useState<OverviewEmployee[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  async function loadOverview() {
    const res = await fetch("/api/admin/overview", { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setEmployees(data.employees ?? []);
  }

  async function loadAttendance(date: string) {
    const res = await fetch(`/api/admin/attendance?date=${date}`, { cache: "no-store" });
    if (!res.ok) return;
    const data = await res.json();
    setAttendanceRecords(data.records ?? []);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadOverview();
      void loadAttendance(attendanceDate);
    }, 0);
    return () => clearTimeout(timer);
  }, [attendanceDate]);

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-5 sm:gap-6">
        <h2 className="page-heading text-lg font-bold leading-snug sm:text-xl">
          Welcome, <span className="text-orange-300/95">{userName}</span>{" "}
          <span className="text-zinc-400">(Admin)</span>
        </h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5 2xl:grid-cols-4">
          {ADMIN_NAV_CARDS.map(({ href, title, subtitle }) => (
            <Link
              key={href}
              href={href}
              className="admin-nav-card group flex flex-col overflow-hidden rounded-2xl border border-zinc-700/90 bg-zinc-900/40 no-underline shadow-lg ring-1 ring-white/[0.04] transition duration-200 hover:border-orange-500/35 hover:bg-zinc-900/70 hover:shadow-orange-950/20 active:scale-[0.99] sm:min-h-[7.5rem]"
            >
              <div className="flex items-center justify-between gap-2 border-b border-orange-500/25 bg-gradient-to-r from-zinc-800/95 via-zinc-800/80 to-zinc-900/90 px-4 py-3 sm:px-4 sm:py-3.5">
                <span className="text-base font-bold tracking-tight text-zinc-50 sm:text-lg">{title}</span>
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400 transition group-hover:bg-orange-500/25 group-hover:text-orange-300"
                  aria-hidden
                >
                  <svg className="h-4 w-4 -rotate-45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </span>
              </div>
              <p className="flex flex-1 items-center px-4 py-3 text-sm leading-snug text-zinc-400 sm:py-3.5">
                {subtitle}
              </p>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-600 bg-zinc-900/50 px-4 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:bg-zinc-800/80 hover:text-white sm:max-w-xs sm:self-start"
        >
          <svg className="h-4 w-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Log out
        </button>
      </div>

      <AdminCreateEmployeeForm onCreated={() => void loadOverview()} />

      <div className="surface-card rounded-2xl p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:mb-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base font-semibold leading-snug text-zinc-100 sm:text-lg">
            Date-wise attendance
          </p>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="input-app w-full min-w-0 sm:max-w-[14rem] sm:shrink-0"
          />
        </div>
        <p className="text-app-muted mb-3 text-xs sm:text-sm">Punch times and locations for the selected date.</p>

        <div className="lg:hidden">
          {attendanceRecords.length === 0 ? (
            <p className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-8 text-center text-sm text-zinc-500">
              No attendance for this date.
            </p>
          ) : (
            <ul className="space-y-3">
              {attendanceRecords.map((record) => (
                <li
                  key={record.id}
                  className="rounded-2xl border border-zinc-700/80 bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 p-4 shadow-lg"
                >
                  <p className="font-semibold text-zinc-100">
                    {record.employeeName}{" "}
                    <span className="text-sm font-normal text-zinc-500">@{record.username}</span>
                  </p>
                  <dl className="mt-3 space-y-2 text-sm">
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Punch in</dt>
                      <dd className="mt-0.5 text-zinc-200">
                        {new Date(record.punchInAt).toLocaleTimeString()}
                      </dd>
                      <dd className="break-words text-xs text-zinc-400">{record.punchInLocation}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">Punch out</dt>
                      <dd className="mt-0.5 text-zinc-200">
                        {record.punchOutAt
                          ? new Date(record.punchOutAt).toLocaleTimeString()
                          : "—"}
                      </dd>
                      <dd className="break-words text-xs text-zinc-400">
                        {record.punchOutLocation ?? "—"}
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="hidden lg:block">
          <div className="table-scroll-wrap overflow-x-auto">
            <table className="table-app min-w-[720px] text-left text-sm lg:text-[0.9375rem] xl:text-base">
              <thead className="text-zinc-200">
                <tr>
                  <th className="px-3 py-3 whitespace-nowrap">Employee</th>
                  <th className="px-3 py-3">Punch In Time</th>
                  <th className="px-3 py-3">Punch In Location</th>
                  <th className="px-3 py-3">Punch Out Time</th>
                  <th className="px-3 py-3">Punch Out Location</th>
                </tr>
              </thead>
              <tbody className="text-zinc-300">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td className="px-3 py-4 text-zinc-500" colSpan={5}>
                      No attendance records for selected date.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((record) => (
                    <tr key={record.id} className="border-t border-zinc-700/90">
                      <td className="px-3 py-2.5">
                        {record.employeeName} ({record.username})
                      </td>
                      <td className="px-3 py-2.5">
                        {new Date(record.punchInAt).toLocaleTimeString()}
                      </td>
                      <td className="max-w-[12rem] break-words px-3 py-2.5">{record.punchInLocation}</td>
                      <td className="px-3 py-2.5">
                        {record.punchOutAt
                          ? new Date(record.punchOutAt).toLocaleTimeString()
                          : "-"}
                      </td>
                      <td className="max-w-[12rem] break-words px-3 py-2.5">
                        {record.punchOutLocation ?? "-"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5 2xl:grid-cols-4">
        {employees.map((emp) => (
          <div key={emp.id} className="surface-card-nested rounded-2xl p-4 sm:p-5">
            <p className="font-semibold text-zinc-100">
              {emp.name}{" "}
              <span className="text-sm font-normal text-zinc-500">({emp.username})</span>
            </p>
            <p className="mt-2 text-sm text-zinc-400">Attendance days: {emp.attendanceCount}</p>
            <p className="text-sm text-zinc-400">
              Leaves (full/half): {emp.leaves.fullDay}/{emp.leaves.halfDay}
            </p>
            <p className="text-sm text-zinc-400">
              Salary base / net: {emp.monthlySalary} / {emp.salary.calculatedNet}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
