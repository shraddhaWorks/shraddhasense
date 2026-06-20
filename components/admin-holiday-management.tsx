"use client";

import { useEffect, useState } from "react";
import Loader from "@/components/loader";

type Holiday = {
  id: string;
  date: string;
  type: "PUBLIC_HOLIDAY" | "COMPANY_HOLIDAY" | "PERSONAL_HOLIDAY";
  note?: string;
};

export function AdminHolidayManagement() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    type: "COMPANY_HOLIDAY" as const,
    note: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadHolidays();
  }, [month, year]);

  async function loadHolidays() {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/holidays?month=${month}&year=${year}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        setHolidays(data.holidays || []);
      }
    } catch (err) {
      console.error("Failed to load holidays:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date(formData.date).toISOString(),
          type: formData.type,
          note: formData.note || undefined,
        }),
      });

      if (res.ok) {
        setIsOpen(false);
        setFormData({
          date: new Date().toISOString().split("T")[0],
          type: "COMPANY_HOLIDAY",
          note: "",
        });
        await loadHolidays();
      } else {
        const data = await res.json();
        alert(data.error?.message || "Failed to add holiday");
      }
    } catch (err) {
      alert("Error adding holiday");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteHoliday(id: string) {
    if (!confirm("Delete this holiday?")) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/holidays/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadHolidays();
      } else {
        alert("Failed to delete holiday");
      }
    } catch (err) {
      alert("Error deleting holiday");
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  }

  const typeStyles = {
    PUBLIC_HOLIDAY: "bg-blue-900/30 text-blue-300",
    COMPANY_HOLIDAY: "bg-purple-900/30 text-purple-300",
    PERSONAL_HOLIDAY: "bg-orange-900/30 text-orange-300",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-zinc-100">Holiday Management</h3>
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary inline-block px-4 py-2 text-sm"
        >
          Add Holiday
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <select
          value={month}
          onChange={(e) => setMonth(Number(e.target.value))}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2000, i).toLocaleDateString("en-US", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={new Date().getFullYear() - 2 + i}>
              {new Date().getFullYear() - 2 + i}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center text-zinc-400">
          <Loader text="Loading holidays..." />
        </div>
      ) : holidays.length === 0 ? (
        <div className="rounded border border-dashed border-zinc-700 bg-zinc-900/40 px-4 py-6 text-center text-sm text-zinc-400">
          No holidays for this month
        </div>
      ) : (
        <div className="space-y-2">
          {holidays.map((holiday) => (
            <div
              key={holiday.id}
              className={`flex items-center justify-between rounded-lg border p-3 ${typeStyles[holiday.type]}`}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium">
                  {new Date(holiday.date).toLocaleDateString()}
                </p>
                <p className="text-xs opacity-75">
                  {holiday.type.replace(/_/g, " ")}
                </p>
                {holiday.note && (
                  <p className="text-xs opacity-90 mt-1">{holiday.note}</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteHoliday(holiday.id)}
                disabled={deletingId === holiday.id}
                className="ml-2 shrink-0 rounded bg-red-900/30 px-2 py-1 text-xs text-red-300 hover:bg-red-900/50 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="surface-card w-full max-w-md rounded-2xl p-6">
            <h3 className="text-lg font-bold text-zinc-100">Add Holiday</h3>
            <form onSubmit={handleAddHoliday} className="mt-4 space-y-4">
              <div>
                <label htmlFor="hol-date" className="block text-sm font-medium text-zinc-400">
                  Date
                </label>
                <input
                  id="hol-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, date: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="hol-type" className="block text-sm font-medium text-zinc-400">
                  Type
                </label>
                <select
                  id="hol-type"
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      type: e.target.value as any,
                    }))
                  }
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                >
                  <option value="PUBLIC_HOLIDAY">Public Holiday</option>
                  <option value="COMPANY_HOLIDAY">Company Holiday</option>
                  <option value="PERSONAL_HOLIDAY">Personal Holiday</option>
                </select>
              </div>

              <div>
                <label htmlFor="hol-note" className="block text-sm font-medium text-zinc-400">
                  Note (optional)
                </label>
                <input
                  id="hol-note"
                  type="text"
                  placeholder="e.g., Christmas, Annual Meeting"
                  value={formData.note}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, note: e.target.value }))
                  }
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary flex-1"
                >
                  {isSubmitting ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
