"use client";

import { useState } from "react";

export function EmployeeLeaveRequestForm({
  onSuccess,
}: {
  onSuccess: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [leaveType, setLeaveType] = useState<"FULL_DAY" | "HALF_DAY">("FULL_DAY");
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!reason.trim() || reason.trim().length < 3) {
      setError("Reason is required (minimum 3 characters)");
      return;
    }

    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);
    if (end < start) {
      setError("End date cannot be earlier than start date.");
      return;
    }

    if (leaveType === "HALF_DAY" && leaveStartDate !== leaveEndDate) {
      setError("Half-day leave can only be requested for a single date.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/employee/leaves", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startDate: new Date(leaveStartDate).toISOString(),
          endDate: new Date(leaveEndDate).toISOString(),
          type: leaveType,
          note: reason.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit leave request");
      }

      setIsOpen(false);
      setReason("");
      setLeaveStartDate(new Date().toISOString().split("T")[0]);
      setLeaveEndDate(new Date().toISOString().split("T")[0]);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="btn-outline min-h-12 w-full px-4 py-2.5 text-sm sm:text-base"
        onClick={() => setIsOpen(true)}
      >
        Request Leave
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="surface-card w-full max-w-md rounded-2xl p-6 sm:p-8">
            <h3 className="text-xl font-bold text-zinc-100">Request Leave</h3>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-zinc-400">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    value={leaveStartDate}
                    onChange={(e) => setLeaveStartDate(e.target.value)}
                    className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-zinc-400">
                    End Date
                  </label>
                  <input
                    id="endDate"
                    type="date"
                    value={leaveEndDate}
                    onChange={(e) => setLeaveEndDate(e.target.value)}
                    className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-zinc-400">
                  Leave Type
                </label>
                <select
                  id="type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value as "FULL_DAY" | "HALF_DAY")}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                >
                  <option value="FULL_DAY">Full Day</option>
                  <option value="HALF_DAY">Half Day</option>
                </select>
              </div>

              <div>
                <label htmlFor="reason" className="block text-sm font-medium text-zinc-400">
                  Reason
                </label>
                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter your leave reason (minimum 3 characters)"
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder-zinc-500"
                  rows={4}
                  required
                />
              </div>

              {error && <div className="rounded bg-red-900/30 p-3 text-sm text-red-300">{error}</div>}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isLoading}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex-1"
                >
                  {isLoading ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
