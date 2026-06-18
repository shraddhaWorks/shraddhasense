"use client";

import { useEffect, useState } from "react";

type Leave = {
  id: string;
  leaveDate: string;
  type: "FULL_DAY" | "HALF_DAY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
  adminReason?: string;
  reviewedAt?: string;
};

export function EmployeeLeavesList() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaves();
  }, []);

  async function loadLeaves() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/employee/leaves", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data.leaves || []);
      }
    } catch (err) {
      console.error("Failed to load leaves:", err);
    } finally {
      setIsLoading(false);
    }
  }

  const statusStyles = {
    PENDING: "bg-blue-900/30 text-blue-300 border-blue-700",
    APPROVED: "bg-green-900/30 text-green-300 border-green-700",
    REJECTED: "bg-red-900/30 text-red-300 border-red-700",
  };

  if (isLoading) {
    return <div className="text-center text-zinc-400">Loading leaves...</div>;
  }

  if (leaves.length === 0) {
    return <div className="text-center text-zinc-400">No leave requests yet</div>;
  }

  return (
    <div className="space-y-3">
      {leaves.map((leave) => (
        <div
          key={leave.id}
          className={`border rounded-lg p-4 ${statusStyles[leave.status]}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-medium">
                {new Date(leave.leaveDate).toLocaleDateString()} - {leave.type === "FULL_DAY" ? "Full Day" : "Half Day"}
              </p>
              <p className="text-sm opacity-75 mt-1">{leave.note}</p>
              {leave.adminReason && (
                <p className="text-sm mt-2 opacity-90">
                  <span className="font-medium">Admin Response:</span> {leave.adminReason}
                </p>
              )}
            </div>
            <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-current/20">
              {leave.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
