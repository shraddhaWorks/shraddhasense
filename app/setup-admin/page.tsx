"use client";

import { FormEvent, useState } from "react";

export default function SetupAdminPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get("name"),
      username: formData.get("username"),
      password: formData.get("password"),
    };

    try {
      const res = await fetch("/api/setup-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `Admin created successfully! Username: ${data.admin.username}` });
        e.currentTarget.reset();
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create admin" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Error: " + (error instanceof Error ? error.message : "Unknown error") });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow">
        <h1 className="mb-6 text-2xl font-bold">Create Admin Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4 text-black">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              minLength={2}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g., Shraddha Tech"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              id="username"
              name="username"
              required
              minLength={3}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g., sraddhaTech"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={4}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
              placeholder="e.g., sraddhaTech123"
            />
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700">
              Role
            </label>
            <input
              type="text"
              id="role"
              name="role"
              value="ADMIN"
              disabled
              className="mt-1 w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600"
            />
          </div>

          {message && (
            <div
              className={`rounded px-4 py-2 text-sm ${
                message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Admin"}
          </button>
        </form>
      </div>
    </main>
  );
}
