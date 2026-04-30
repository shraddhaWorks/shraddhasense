"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mt-4 grid gap-3 max-w-md"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        const formData = new FormData(e.currentTarget);
        const username = String(formData.get("username") ?? "");
        const password = String(formData.get("password") ?? "");

        const result = await signIn("credentials", {
          username,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Invalid username or password");
          setLoading(false);
          return;
        }

        window.location.reload();
      }}
    >
      <input
        required
        name="username"
        placeholder="Username"
        className="rounded-md border border-orange-200 bg-white px-3 py-2 text-sm"
      />
      <input
        required
        name="password"
        type="password"
        placeholder="Password"
        className="rounded-md border border-orange-200 bg-white px-3 py-2 text-sm"
      />
      <button
        disabled={loading}
        className="rounded-md bg-orange-500 px-3 py-2 text-sm text-white hover:bg-orange-600 disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
      {error ? <p className="text-sm text-orange-900">{error}</p> : null}
    </form>
  );
}
