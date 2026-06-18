"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { EmployeeLeaveRequestForm } from "@/components/employee-leave-request-form";
import { EmployeeLeavesList } from "@/components/employee-leaves-list";

type Summary = {
  attendanceCount: number;
  streak: number;
  salary: { base: number; deduction: number; net: number };
  leaves: { fullDay: number; halfDay: number; pending: number; rejected: number };
  attendance: { fullDays: number; halfDays: number };
  absents: number;
  holidays: number;
  shift: { start: string; end: string };
  todayAttendance: {
    punchInAt: string;
    punchOutAt: string | null;
    dayType: "FULL_DAY" | "HALF_DAY" | null;
  } | null;
};

type Holiday = {
  id: string;
  date: string;
  type: string;
  note?: string;
};

export function EmployeeDashboard({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [todayHoliday, setTodayHoliday] = useState<Holiday | null>(null);
  const [holidayWarning, setHolidayWarning] = useState<string | null>(null);

  async function loadSummary() {
    const res = await fetch("/api/employee/summary", { cache: "no-store" });
    if (!res.ok) return;
    setSummary(await res.json());
  }

  async function loadTodayHoliday() {
    try {
      const today = new Date().toISOString().split("T")[0];
      const res = await fetch(`/api/employee/holidays?date=${new Date(today).toISOString()}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setTodayHoliday(data.holiday);
      }
    } catch (err) {
      console.error("Failed to load holiday:", err);
    }
  }

  async function autoPunchOut() {
    if (
      summary?.todayAttendance &&
      !summary.todayAttendance.punchOutAt &&
      new Date().getHours() >= 20
    ) {
      await fetch("/api/employee/punch", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      await loadSummary();
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSummary();
      void loadTodayHoliday();
    }, 0);
    return () => clearTimeout(timer);
  }, [refreshTrigger]);

  useEffect(() => {
    if (!summary) return;
    if (
      summary.todayAttendance &&
      !summary.todayAttendance.punchOutAt &&
      new Date().getHours() >= 20
    ) {
      void autoPunchOut();
    }
  }, [summary]);

  const now = new Date();
  const canPunchIn = Boolean(
    !summary?.todayAttendance &&
      now.getHours() >= 9 &&
      now.getHours() < 20
  );
  const canPunchOut = Boolean(summary?.todayAttendance && !summary.todayAttendance.punchOutAt);

  async function requestLeave(type: "HALF_DAY" | "FULL_DAY") {
    const reason = window.prompt("Enter leave reason");
    if (!reason || reason.trim().length < 3) {
      window.alert("Leave reason is required (minimum 3 characters).");
      return;
    }

    const confirmOne = window.confirm("Are you sure you want to apply for leave?");
    if (!confirmOne) return;
    const confirmTwo = window.confirm("Please confirm again to submit leave request.");
    if (!confirmTwo) return;

    await fetch("/api/employee/leaves", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        leaveDate: new Date().toISOString(),
        type,
        note: reason.trim(),
      }),
    });
    setRefreshTrigger((prev) => prev + 1);
    await loadSummary();
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="page-heading text-lg font-bold leading-snug sm:text-xl">
          Welcome, <span className="text-orange-300/95">{userName}</span>
        </h2>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="btn-outline min-h-12 w-full shrink-0 sm:w-auto"
        >
          Logout
        </button>
      </div>

      <div className="mx-auto grid w-full max-w-full grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-3 lg:gap-3 xl:max-w-4xl">
        {todayHoliday && (
          <div className="col-span-full rounded-lg border-2 border-orange-500/50 bg-orange-900/20 p-3 text-center text-sm font-medium text-orange-300">
            🎉 Today is a {todayHoliday.type.replace(/_/g, " ")}
            {todayHoliday.note && ` - ${todayHoliday.note}`}
          </div>
        )}
        {canPunchIn ? (
          <button
            type="button"
            className={`min-h-12 w-full px-4 py-2.5 text-sm sm:text-base ${
              todayHoliday ? "btn-outline" : "btn-primary"
            }`}
            onClick={async () => {
              const res = await fetch("/api/employee/punch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
              const data = await res.json();
              if (data.warning) {
                setHolidayWarning(data.warning);
                setTimeout(() => setHolidayWarning(null), 5000);
              }
              await loadSummary();
            }}
          >
            Punch In
          </button>
        ) : null}
        {canPunchOut ? (
          <button
            type="button"
            className="btn-outline min-h-12 w-full px-4 py-2.5 text-sm sm:text-base"
            onClick={async () => {
              await fetch("/api/employee/punch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
              await loadSummary();
            }}
          >
            Punch Out
          </button>
        ) : null}
        <button
          type="button"
          className="btn-outline min-h-12 w-full px-4 py-2.5 text-sm sm:text-base"
          onClick={async () => {
            await requestLeave("HALF_DAY");
          }}
        >
          Half-day leave
        </button>
        <button
          type="button"
          className="btn-outline min-h-12 w-full px-4 py-2.5 text-sm sm:text-base"
          onClick={async () => {
            await requestLeave("FULL_DAY");
          }}
        >
          Full-day leave
        </button>
        <EmployeeLeaveRequestForm onSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
      </div>

      <div className="surface-card rounded-2xl p-4 sm:p-5">
        <p className="text-base font-semibold text-zinc-100 sm:text-lg">Location & shift</p>
        <p className="text-app-muted mt-2 text-sm leading-relaxed">
          Shift: {summary?.shift.start ?? "10:00 AM"} – {summary?.shift.end ?? "6:30 PM"}
        </p>
        {summary?.todayAttendance ? (
          <p className="text-app-muted mt-2 text-sm leading-relaxed">
            Today: in at {new Date(summary.todayAttendance.punchInAt).toLocaleTimeString()}
            {summary.todayAttendance.punchOutAt
              ? ` · out at ${new Date(summary.todayAttendance.punchOutAt).toLocaleTimeString()}`
              : " · punch out pending"}
          </p>
        ) : (
          <p className="text-app-muted mt-2 text-sm">Today: not punched in yet.</p>
        )}
        <p className="text-app-muted mt-3 text-sm">
          Punch in is allowed from 9:00 AM to 8:00 PM.
        </p>
        {summary?.todayAttendance?.dayType ? (
          <p className="mt-2 text-sm font-medium text-orange-400">
            Today: {summary.todayAttendance.dayType === "FULL_DAY" ? "Full day" : "Half day"}
          </p>
        ) : null}
      </div>

      {summary && (
        <div className="surface-card space-y-2 rounded-2xl p-4 text-sm text-zinc-400 sm:p-5 sm:text-base">
          <p className="text-lg font-semibold text-zinc-100 mb-4">Summary</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p>
                Attendance days: <span className="text-zinc-100 font-medium">{summary.attendanceCount}</span>
              </p>
              <p className="mt-2">
                Streak: <span className="text-zinc-100 font-medium">{summary.streak}</span>
              </p>
            </div>
            <div>
              <p>
                Full-day attendance: <span className="text-zinc-100 font-medium">{summary.attendance.fullDays}</span>
              </p>
              <p className="mt-2">
                Half-day attendance: <span className="text-zinc-100 font-medium">{summary.attendance.halfDays}</span>
              </p>
            </div>
            <div>
              <p>
                Approved leaves (full): <span className="text-green-400 font-medium">{summary.leaves.fullDay}</span>
              </p>
              <p className="mt-2">
                Approved leaves (half): <span className="text-green-400 font-medium">{summary.leaves.halfDay}</span>
              </p>
            </div>
            <div>
              <p>
                Pending requests: <span className="text-blue-400 font-medium">{summary.leaves.pending}</span>
              </p>
              <p className="mt-2">
                Rejected: <span className="text-red-400 font-medium">{summary.leaves.rejected}</span>
              </p>
            </div>
          </div>

          <hr className="border-zinc-700 my-4" />

          <p>
            Holidays (this month): <span className="text-blue-400 font-medium">{summary.holidays}</span>
          </p>
          <p className="mt-2">
            Absents: <span className="text-orange-300/90 font-medium">{summary.absents}</span>
          </p>
          <p className="mt-2">
            Salary base: <span className="text-zinc-100 font-medium">{summary.salary.base}</span>
          </p>
          <p>
            Deduction: <span className="text-orange-300/90 font-medium">{summary.salary.deduction}</span>
          </p>
          <p>
            Net: <span className="text-lg font-semibold text-orange-400">{summary.salary.net}</span>
          </p>
        </div>
      )}

      <div className="surface-card rounded-2xl p-4 sm:p-5">
        <p className="text-base font-semibold text-zinc-100 sm:text-lg mb-4">Your Leave Requests</p>
        <EmployeeLeavesList />
      </div>
    </div>
  );
}
