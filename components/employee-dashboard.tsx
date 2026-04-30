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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">Welcome, {userName} (Employee)</h2>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="rounded-md border border-orange-300 px-3 py-1 text-sm text-orange-700"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
        <button
          className="rounded border border-orange-300 px-3 py-2 text-sm text-orange-800"
          onClick={async () => {
            await detectLocation();
          }}
        >
          {locLoading ? "Detecting location..." : "Refresh Current Location"}
        </button>
        {canPunchIn ? (
          <button
            className="rounded bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600 sm:w-auto"
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
            className="rounded border border-orange-300 px-3 py-2 text-sm text-orange-800 sm:w-auto"
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
          className="rounded border border-orange-300 px-3 py-2 text-sm text-orange-800"
          onClick={async () => {
            await requestLeave("HALF_DAY");
          }}
        >
          Add Half-Day Leave
        </button>
        <button
          className="rounded border border-orange-300 px-3 py-2 text-sm text-orange-800"
          onClick={async () => {
            await requestLeave("FULL_DAY");
          }}
        >
          Add Full-Day Leave
        </button>
      </div>

      <div className="rounded-lg border border-orange-200 bg-white p-4">
        <p className="font-medium text-orange-900">Current Punch Location</p>
        <p className="mt-1 text-sm text-orange-800">
          Shift Time: {summary?.shift.start ?? "10:00 AM"} to {summary?.shift.end ?? "6:30 PM"}
        </p>
        {summary?.todayAttendance ? (
          <p className="mt-1 text-sm text-orange-800">
            Today: punched in at {new Date(summary.todayAttendance.punchInAt).toLocaleTimeString()}
            {summary.todayAttendance.punchOutAt
              ? ` and punched out at ${new Date(summary.todayAttendance.punchOutAt).toLocaleTimeString()}`
              : ", punch out pending"}
          </p>
        ) : (
          <p className="mt-1 text-sm text-orange-800">Today: not punched in yet</p>
        )}
        {coords ? (
          <>
            <p className="mt-1 text-sm">
              Latitude: {coords.lat.toFixed(6)} | Longitude: {coords.lng.toFixed(6)}
            </p>
            <p className="mt-1 text-sm">
              Office center: {officeCenter.lat.toFixed(6)}, {officeCenter.lng.toFixed(6)} | Radius:{" "}
              {officeRadiusKm} km
            </p>
            <p
              className={`mt-1 text-sm font-medium ${
                inOfficeArea ? "text-orange-700" : "text-orange-900"
              }`}
            >
              {inOfficeArea
                ? `Inside office area (${currentDistanceKm?.toFixed(2)} km)`
                : `Outside office area (${currentDistanceKm?.toFixed(2)} km)`}
            </p>
            <iframe
              title="Current location map"
              className="mt-3 h-52 w-full rounded border border-orange-100 sm:h-64"
              src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=15&output=embed`}
            />
          </>
        ) : (
          <p className="mt-1 text-sm text-orange-700">
            {locLoading ? "Detecting current location..." : "Location not available yet."}
          </p>
        )}
        {locError ? <p className="mt-1 text-sm text-orange-900">{locError}</p> : null}
      </div>

      {summary && (
        <div className="rounded-lg border border-orange-200 bg-white p-4">
          <p>Attendance days: {summary.attendanceCount}</p>
          <p>Attendance streak: {summary.streak}</p>
          <p>Leaves (full/half): {summary.leaves.fullDay}/{summary.leaves.halfDay}</p>
          <p>Salary base: {summary.salary.base}</p>
          <p>Salary deduction: {summary.salary.deduction}</p>
          <p>Salary net: {summary.salary.net}</p>
        </div>
      )}
    </div>
  );
}
