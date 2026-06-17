"use client";

import { useState } from "react";

type EmployeeRow = {
  id: string;
  name: string;
  username: string;
  monthlySalary: number;
  createdAt: Date;
  _count: {
    attendances: number;
    leaves: number;
  };
};

type Props = {
  employees: EmployeeRow[];
};

export function AdminEmployeesTable({ employees }: Props) {
  const [rows, setRows] = useState(employees);
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updateSalary(employeeId: string, salary: number) {
    setSavingId(employeeId);
    try {
      const res = await fetch("/api/admin/employees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, monthlySalary: salary }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update salary");
      }

      setRows((current) =>
        current.map((row) =>
          row.id === employeeId
            ? { ...row, monthlySalary: Number(data.employee.monthlySalary) }
            : row,
        ),
      );
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Failed to update salary");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="surface-card overflow-hidden rounded-2xl p-0">
      <div className="table-scroll-wrap overflow-x-auto rounded-none border-0 bg-transparent">
        <table className="table-app min-w-[48rem] text-left text-sm">
          <thead className="text-zinc-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Attendance Records</th>
              <th className="px-4 py-3">Leave Records</th>
              <th className="px-4 py-3">Monthly Salary</th>
              <th className="px-4 py-3">Created At</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {rows.map((employee) => (
              <tr key={employee.id} className="border-t border-zinc-700/90">
                <td className="px-4 py-3">{employee.name}</td>
                <td className="px-4 py-3">{employee.username}</td>
                <td className="px-4 py-3">{employee._count.attendances}</td>
                <td className="px-4 py-3">{employee._count.leaves}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={employee.monthlySalary}
                      onChange={(e) =>
                        setRows((current) =>
                          current.map((row) =>
                            row.id === employee.id
                              ? { ...row, monthlySalary: Number(e.target.value) || 0 }
                              : row,
                          ),
                        )
                      }
                      className="input-app w-32"
                    />
                    <button
                      type="button"
                      onClick={() => updateSalary(employee.id, employee.monthlySalary)}
                      disabled={savingId === employee.id}
                      className="btn-primary min-h-10 px-3 text-xs"
                    >
                      {savingId === employee.id ? "Saving..." : "Save"}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="table-scroll-hint px-4 pb-3">Swipe sideways to see all columns.</p>
    </div>
  );
}
