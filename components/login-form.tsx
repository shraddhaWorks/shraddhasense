"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="mx-auto mt-4 grid w-full max-w-md gap-3 sm:max-w-lg sm:gap-4 lg:max-w-xl"
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
        className="input-app w-full"
      />
      <input
        required
        name="password"
        type="password"
        placeholder="Password"
        className="input-app w-full"
      />
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full"
      >
        {loading ? "Signing in..." : "Sign in"}
      </button>
      {error ? <p className="text-sm font-medium text-orange-400">{error}</p> : null}
    </form>
  );
}
