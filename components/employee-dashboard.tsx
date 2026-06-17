"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";

type Summary = {
  attendanceCount: number;
  streak: number;
  salary: { base: number; deduction: number; net: number };
  leaves: { fullDay: number; halfDay: number };
  shift: { start: string; end: string };
  todayAttendance: {
    punchInAt: string;
    punchOutAt: string | null;
    dayType: "FULL_DAY" | "HALF_DAY" | null;
  } | null;
};

export function EmployeeDashboard({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);

  async function loadSummary() {
    const res = await fetch("/api/employee/summary", { cache: "no-store" });
    if (!res.ok) return;
    setSummary(await res.json());
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
    }, 0);
    return () => clearTimeout(timer);
  }, []);

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
    loadSummary();
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
        {canPunchIn ? (
          <button
            type="button"
            className="btn-primary min-h-12 w-full px-4 py-2.5 text-sm sm:text-base"
            onClick={async () => {
              await fetch("/api/employee/punch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({}),
              });
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
          <p>
            Attendance days: <span className="text-zinc-100">{summary.attendanceCount}</span>
          </p>
          <p>
            Streak: <span className="text-zinc-100">{summary.streak}</span>
          </p>
          <p>
            Leaves (full/half):{" "}
            <span className="text-zinc-100">
              {summary.leaves.fullDay}/{summary.leaves.halfDay}
            </span>
          </p>
          <p>
            Salary base: <span className="text-zinc-100">{summary.salary.base}</span>
          </p>
          <p>
            Deduction: <span className="text-orange-300/90">{summary.salary.deduction}</span>
          </p>
          <p>
            Net: <span className="text-lg font-semibold text-orange-400">{summary.salary.net}</span>
          </p>
        </div>
      )}
    </div>
  );
}
