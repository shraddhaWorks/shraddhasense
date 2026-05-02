"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"
        />
        <circle cx="12" cy="12" r="3" strokeWidth="2" />
      </svg>
    );
  }
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 3l18 18M10.58 10.58a3 3 0 104.24 4.24M9.88 9.88A10.43 10.43 0 012 12s3 7 10 7c1.38 0 2.66-.26 3.82-.7M12 5c-1.45 0-2.81.32-4.06.88"
      />
      <path
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 12a3 3 0 01-3-3M16.72 16.72C15.17 17.45 13.6 18 12 18c-7 0-10-7-10-7a18.45 18.45 0 015.06-5.94"
      />
    </svg>
  );
}

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form
      className="mt-7 grid w-full gap-5 sm:mt-8"
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
      <div className="grid gap-1.5">
        <label htmlFor="login-username" className="text-xs font-medium text-zinc-400">
          Username
        </label>
        <input
          id="login-username"
          required
          name="username"
          autoComplete="username"
          placeholder="Username"
          className="input-login-pill w-full"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="login-password" className="text-xs font-medium text-zinc-400">
          Password
        </label>
        <div className="relative">
          <input
            id="login-password"
            required
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Password"
            className="input-login-pill w-full pr-12"
          />
          <button
            type="button"
            className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-200"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon open={!showPassword} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary mt-1 w-full rounded-full disabled:cursor-not-allowed disabled:opacity-55"
      >
        {loading ? "Signing in…" : "Log in"}
      </button>

      {error ? (
        <p className="text-center text-sm font-medium text-orange-400" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
