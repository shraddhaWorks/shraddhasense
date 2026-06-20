"use client";

import { useEffect, useState } from "react";

type Leave = {
  id: string;
  leaveDate: string;
  type: "FULL_DAY" | "HALF_DAY";
  status: "PENDING" | "APPROVED" | "REJECTED";
  note?: string;
  user: {
    id: string;
    name: string;
    username: string;
  };
};

export function AdminLeaveRequestsTable({
  refreshTrigger,
}: {
  refreshTrigger?: number;
}) {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"PENDING" | "APPROVED" | "REJECTED" | "ALL">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [reasonInput, setReasonInput] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLeaves();
  }, [filter, refreshTrigger]);

  async function loadLeaves() {
    setIsLoading(true);
    try {
      const url = filter === "ALL" 
        ? "/api/admin/leaves" 
        : `/api/admin/leaves?status=${filter}`;
      const res = await fetch(url, { cache: "no-store" });
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

  async function handleReviewLeave(
    leaveId: string,
    status: "APPROVED" | "REJECTED",
    reason?: string
  ) {
    setProcessingId(leaveId);
    try {
      const res = await fetch(`/api/admin/leaves/${leaveId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminReason: reason,
        }),
      });

      if (res.ok) {
        setReasonInput((prev) => {
          const newInput = { ...prev };
          delete newInput[leaveId];
          return newInput;
        });
        await loadLeaves();
      } else {
        alert("Failed to update leave request");
      }
    } catch (err) {
      console.error("Error updating leave:", err);
      alert("Error updating leave request");
    } finally {
      setProcessingId(null);
    }
  }

  const pendingCount = leaves.filter((l) => l.status === "PENDING").length;
  const approvedCount = leaves.filter((l) => l.status === "APPROVED").length;
  const rejectedCount = leaves.filter((l) => l.status === "REJECTED").length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilter("ALL")}
          className={`px-4 py-2 rounded text-sm font-medium ${
            filter === "ALL"
              ? "bg-orange-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          All ({pendingCount + approvedCount + rejectedCount})
        </button>
        <button
          onClick={() => setFilter("PENDING")}
          className={`px-4 py-2 rounded text-sm font-medium  ${
            filter === "PENDING"
              ? "bg-yellow-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Pending ({pendingCount})
        </button>
        <button
          onClick={() => setFilter("APPROVED")}
          className={`px-4 py-2 rounded text-sm font-medium ${
            filter === "APPROVED"
              ? "bg-green-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Approved ({approvedCount})
        </button>
        <button
          onClick={() => setFilter("REJECTED")}
          className={`px-4 py-2 rounded text-sm font-medium ${
            filter === "REJECTED"
              ? "bg-red-600 text-white"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          }`}
        >
          Rejected ({rejectedCount})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-zinc-400 py-8">Loading leave requests...</div>
      ) : leaves.length === 0 ? (
        <div className="text-center text-zinc-400 py-8">No leave requests found</div>
      ) : (
        <div className="space-y-3">
          {leaves.map((leave) => (
            <div key={leave.id} className="surface-card rounded-lg p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-zinc-100">
                    {leave.user.name} ({leave.user.username})
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">
                    {new Date(leave.leaveDate).toLocaleDateString()} -{" "}
                    {leave.type === "FULL_DAY" ? "Full Day" : "Half Day"}
                  </p>
                  <p className="text-sm text-zinc-400 mt-1">Reason: {leave.note}</p>
                  <div className="mt-2">
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        leave.status === "PENDING"
                          ? "bg-blue-900/30 text-blue-300"
                          : leave.status === "APPROVED"
                          ? "bg-green-900/30 text-green-300"
                          : "bg-red-900/30 text-red-300"
                      }`}
                    >
                      {leave.status}
                    </span>
                  </div>
                </div>

                {leave.status === "PENDING" && (
                  <div className="w-full sm:w-auto space-y-2">
                    <input
                      type="text"
                      placeholder="Response/Reason (optional)"
                      value={reasonInput[leave.id] || ""}
                      onChange={(e) =>
                        setReasonInput((prev) => ({
                          ...prev,
                          [leave.id]: e.target.value,
                        }))
                      }
                      className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          handleReviewLeave(
                            leave.id,
                            "APPROVED",
                            reasonInput[leave.id]
                          )
                        }
                        disabled={processingId === leave.id}
                        className="flex-1 btn-primary text-sm py-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          handleReviewLeave(
                            leave.id,
                            "REJECTED",
                            reasonInput[leave.id] || "Request rejected"
                          )
                        }
                        disabled={processingId === leave.id}
                        className="flex-1 btn-outline text-sm py-2"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
