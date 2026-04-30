"use client";

import { useEffect, useMemo, useState } from "react";

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
  latestPunchInAt: string | null;
  latestPunchInLocation: string | null;
  latestPunchOutAt: string | null;
  latestPunchOutLocation: string | null;
};

export function AdminReportsTable() {
  const now = new Date();
  const [search, setSearch] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<ReportRow[]>([]);

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
      "Attendance Days",
      "Full-Day Leaves",
      "Half-Day Leaves",
      "Total Leave Days",
      "Base Salary",
      "Leave Deduction",
      "Net Salary",
      "Latest Punch In Time",
      "Latest Punch In Location",
      "Latest Punch Out Time",
      "Latest Punch Out Location",
    ];
    const body = rows.map((r) => [
      r.name,
      r.username,
      String(r.attendanceDays),
      String(r.fullDayLeaves),
      String(r.halfDayLeaves),
      String(r.leaveDays),
      String(r.baseSalary),
      String(r.leaveDeduction),
      String(r.netSalary),
      r.latestPunchInAt ? new Date(r.latestPunchInAt).toLocaleString() : "",
      r.latestPunchInLocation ?? "",
      r.latestPunchOutAt ? new Date(r.latestPunchOutAt).toLocaleString() : "",
      r.latestPunchOutLocation ?? "",
    ]);
    return [header, ...body].map((line) => line.map((c) => `"${c.replaceAll('"', '""')}"`).join(",")).join("\n");
  }, [rows]);

  return (
    <div className="space-y-4 rounded-lg border border-orange-200 bg-white p-4">
      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search employee name or username"
          className="w-full rounded border border-orange-200 px-3 py-2 text-sm sm:min-w-60 sm:w-auto"
        />
        <input
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          type="number"
          min={1}
          max={12}
          className="w-full rounded border border-orange-200 px-3 py-2 text-sm sm:w-24"
        />
        <input
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          type="number"
          min={2020}
          className="w-full rounded border border-orange-200 px-3 py-2 text-sm sm:w-28"
        />
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
          download={`employee-report-${year}-${month}.csv`}
          className="rounded bg-orange-500 px-3 py-2 text-center text-sm text-white hover:bg-orange-600"
        >
          Export CSV
        </a>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs sm:text-sm">
          <thead className="bg-orange-100 text-orange-900">
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Attendance</th>
              <th className="px-3 py-2">Leaves</th>
              <th className="px-3 py-2">Salary</th>
              <th className="px-3 py-2">Latest Punch</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-3 py-3 text-orange-800" colSpan={5}>
                  No report rows found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-orange-100 align-top">
                  <td className="px-3 py-2">
                    {r.name}
                    <div className="text-xs text-orange-700">@{r.username}</div>
                  </td>
                  <td className="px-3 py-2">{r.attendanceDays} days</td>
                  <td className="px-3 py-2">
                    Full: {r.fullDayLeaves}, Half: {r.halfDayLeaves}, Total: {r.leaveDays}
                  </td>
                  <td className="px-3 py-2">
                    Base: {r.baseSalary}, Deduction: {r.leaveDeduction}, Net: {r.netSalary}
                  </td>
                  <td className="px-3 py-2">
                    <div>In: {r.latestPunchInAt ? new Date(r.latestPunchInAt).toLocaleString() : "-"}</div>
                    <div>In Loc: {r.latestPunchInLocation ?? "-"}</div>
                    <div>Out: {r.latestPunchOutAt ? new Date(r.latestPunchOutAt).toLocaleString() : "-"}</div>
                    <div>Out Loc: {r.latestPunchOutLocation ?? "-"}</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
