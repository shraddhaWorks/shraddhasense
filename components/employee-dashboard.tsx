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
  } | null;
};

export function EmployeeDashboard({ userName }: { userName: string }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locError, setLocError] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(false);

  async function loadSummary() {
    const res = await fetch("/api/employee/summary", { cache: "no-store" });
    if (!res.ok) return;
    setSummary(await res.json());
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  function detectLocation() {
    return new Promise<{ lat: number; lng: number } | null>((resolve) => {
      if (!navigator.geolocation) {
        setLocError("Geolocation is not supported in this browser.");
        resolve(null);
        return;
      }

      setLocLoading(true);
      setLocError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const found = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCoords(found);
          setLocLoading(false);
          resolve(found);
        },
        (error) => {
          setLocLoading(false);
          setLocError(error.message || "Unable to fetch current location.");
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void detectLocation();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const canPunchIn = !summary?.todayAttendance;
  const canPunchOut = Boolean(summary?.todayAttendance && !summary.todayAttendance.punchOutAt);
  const officeCenter = { lat: 14.650522, lng: 77.607849 };
  const officeRadiusKm = 3;

  function toRad(value: number) {
    return (value * Math.PI) / 180;
  }

  function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
    const earthRadiusKm = 6371;
    const dLat = toRad(b.lat - a.lat);
    const dLng = toRad(b.lng - a.lng);
    const lat1 = toRad(a.lat);
    const lat2 = toRad(b.lat);

    const hav =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

    return 2 * earthRadiusKm * Math.asin(Math.sqrt(hav));
  }

  const currentDistanceKm = coords ? distanceKm(coords, officeCenter) : null;
  const inOfficeArea = currentDistanceKm !== null && currentDistanceKm <= officeRadiusKm;

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
        <button
          type="button"
          className="btn-outline min-h-12 w-full px-4 py-2.5 text-sm sm:text-base"
          onClick={async () => {
            await detectLocation();
          }}
        >
          {locLoading ? "Detecting location…" : "Refresh location"}
        </button>
        {canPunchIn ? (
          <button
            type="button"
            className="btn-primary min-h-12 w-full px-4 py-2.5 text-sm sm:text-base"
            onClick={async () => {
              const liveCoords = coords ?? (await detectLocation());
              if (!liveCoords) return;

              await fetch("/api/employee/punch", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: `${liveCoords.lat.toFixed(6)}, ${liveCoords.lng.toFixed(6)}`,
                }),
              });
              loadSummary();
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
              const liveCoords = coords ?? (await detectLocation());
              if (!liveCoords) return;

              await fetch("/api/employee/punch", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  location: `${liveCoords.lat.toFixed(6)}, ${liveCoords.lng.toFixed(6)}`,
                }),
              });
              loadSummary();
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
        {coords ? (
          <>
            <p className="mt-3 break-all text-sm text-zinc-400">
              <span className="text-zinc-500">Lat</span> {coords.lat.toFixed(6)}{" "}
              <span className="text-zinc-500">· Lng</span> {coords.lng.toFixed(6)}
            </p>
            <p className="mt-2 break-words text-xs text-zinc-500 sm:text-sm">
              Office: {officeCenter.lat.toFixed(4)}, {officeCenter.lng.toFixed(4)} · Radius{" "}
              {officeRadiusKm} km
            </p>
            <p
              className={`mt-2 text-sm font-medium ${
                inOfficeArea ? "text-orange-400" : "text-zinc-200"
              }`}
            >
              {inOfficeArea
                ? `Inside office area (${currentDistanceKm?.toFixed(2)} km)`
                : `Outside office area (${currentDistanceKm?.toFixed(2)} km)`}
            </p>
            <iframe
              title="Current location map"
              className="mt-4 aspect-[16/10] w-full max-h-[min(18rem,50vh)] rounded-2xl border border-zinc-700 shadow-lg transition-all duration-300 hover:border-orange-500/50 sm:max-h-72"
              src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
            />
          </>
        ) : (
          <p className="text-app-muted mt-3 text-sm">
            {locLoading ? "Detecting current location…" : "Location not available yet."}
          </p>
        )}
        {locError ? <p className="mt-3 text-sm font-medium text-orange-400">{locError}</p> : null}
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
