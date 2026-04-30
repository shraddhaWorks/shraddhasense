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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Welcome, {userName} (Admin)</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/accounts"
            className="rounded-md border border-orange-300 px-3 py-1 text-sm text-orange-700"
          >
            Accounts Table
          </Link>
          <Link
            href="/admin/employees"
            className="rounded-md border border-orange-300 px-3 py-1 text-sm text-orange-700"
          >
            Employees Table
          </Link>
          <Link
            href="/admin/create"
            className="rounded-md border border-orange-300 px-3 py-1 text-sm text-orange-700"
          >
            Open Create Page
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-md border border-orange-300 px-3 py-1 text-sm text-orange-700"
          >
            Reports
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="rounded-md border border-orange-300 px-3 py-1 text-sm text-orange-700"
          >
            Logout
          </button>
        </div>
      </div>

      <AdminCreateEmployeeForm onCreated={() => void loadOverview()} />

      <div className="rounded-lg border border-orange-200 bg-white p-4">
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-medium text-orange-900">
            Date-wise Attendance (Punch Time and Location)
          </p>
          <input
            type="date"
            value={attendanceDate}
            onChange={(e) => setAttendanceDate(e.target.value)}
            className="rounded border border-orange-200 px-2 py-1 text-sm"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-xs sm:text-sm">
            <thead className="bg-orange-100 text-orange-900">
              <tr>
                <th className="px-3 py-2 whitespace-nowrap">Employee</th>
                <th className="px-3 py-2">Punch In Time</th>
                <th className="px-3 py-2">Punch In Location</th>
                <th className="px-3 py-2">Punch Out Time</th>
                <th className="px-3 py-2">Punch Out Location</th>
              </tr>
            </thead>
            <tbody>
              {attendanceRecords.length === 0 ? (
                <tr>
                  <td className="px-3 py-3 text-orange-800" colSpan={5}>
                    No attendance records for selected date.
                  </td>
                </tr>
              ) : (
                attendanceRecords.map((record) => (
                  <tr key={record.id} className="border-t border-orange-100">
                    <td className="px-3 py-2">
                      {record.employeeName} ({record.username})
                    </td>
                    <td className="px-3 py-2">
                      {new Date(record.punchInAt).toLocaleTimeString()}
                    </td>
                    <td className="px-3 py-2">{record.punchInLocation}</td>
                    <td className="px-3 py-2">
                      {record.punchOutAt
                        ? new Date(record.punchOutAt).toLocaleTimeString()
                        : "-"}
                    </td>
                    <td className="px-3 py-2">{record.punchOutLocation ?? "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        {employees.map((emp) => (
          <div key={emp.id} className="rounded-lg border border-orange-200 bg-white p-4">
            <p className="font-medium text-orange-900">{emp.name} ({emp.username})</p>
            <p className="text-sm">Attendance days: {emp.attendanceCount}</p>
            <p className="text-sm">Leaves (full/half): {emp.leaves.fullDay}/{emp.leaves.halfDay}</p>
            <p className="text-sm">Salary base/net: {emp.monthlySalary} / {emp.salary.calculatedNet}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
