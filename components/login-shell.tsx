import { LoginForm } from "@/components/login-form";

function LoginArtDecor() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.4]"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="login-art-fog" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fb923c" stopOpacity="0.35" />
          <stop offset="45%" stopColor="#ea580c" stopOpacity="0.12" />
          <stop offset="100%" stopColor="#09090b" stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#login-art-fog)" />
      <g fill="none" stroke="#fdba74" strokeWidth="0.45" strokeOpacity="0.22">
        <path d="M-20 120 Q40 80 90 130 T200 100" />
        <path d="M10 220 Q70 180 130 230 T260 200" />
        <path d="M-10 300 Q50 260 100 310 T220 280" />
        <path d="M30 40 Q90 10 150 50 T240 30" />
      </g>
      <g fill="#431407" fillOpacity="0.45">
        <ellipse cx="78%" cy="22%" rx="120" ry="80" />
        <ellipse cx="18%" cy="78%" rx="90" ry="70" />
      </g>
      <g fill="#9a3412" fillOpacity="0.4">
        <path d="M48 280 L52 200 L56 280 Z" />
        <path d="M72 290 L78 175 L84 290 Z" />
        <path d="M96 285 L100 210 L104 285 Z" />
        <path d="M120 292 L128 165 L136 292 Z" />
        <path d="M152 288 L160 190 L168 288 Z" />
        <path d="M188 290 L198 150 L208 290 Z" />
      </g>
      <g fill="none" stroke="#fed7aa" strokeWidth="1.2" strokeOpacity="0.18" strokeLinecap="round">
        <path d="M55% 42% Q58% 38% 62% 42%" />
        <path d="M58% 46% L62% 52% L66% 46%" />
      </g>
    </svg>
  );
}

export function LoginShell() {
  return (
    <div className="login-page-wrap relative flex w-full flex-1 flex-col items-center justify-center px-3 py-6 sm:px-5 sm:py-10 md:py-12">
      <article
        className="login-split-card relative flex w-full max-w-[min(100%,920px)] flex-col overflow-hidden rounded-2xl shadow-[0_24px_80px_-20px_rgba(0,0,0,0.65)] md:min-h-[min(420px,calc(100dvh-10rem))] md:flex-row md:rounded-3xl"
        aria-labelledby="login-heading"
      >
        <div className="login-art-panel relative flex min-h-[10.5rem] shrink-0 flex-col justify-end overflow-hidden px-6 pb-5 pt-10 md:min-h-0 md:w-[42%] md:rounded-l-3xl md:rounded-br-[2.75rem] md:rounded-tr-[2.25rem] md:p-8 md:pb-10">
          <LoginArtDecor />
          <div
            className="login-art-noise pointer-events-none absolute inset-0 opacity-[0.1]"
            aria-hidden
          />
          <p className="relative z-[1] max-w-[14rem] text-xs font-semibold uppercase tracking-[0.2em] text-orange-200/90">
            Attendance &amp; Salary
          </p>
          <p className="relative z-[1] mt-2 max-w-[16rem] text-lg font-semibold leading-snug text-zinc-100 drop-shadow-sm md:text-xl">
            Nature of work, clarity of records.
          </p>
        </div>

        <div className="login-form-panel relative flex flex-1 flex-col justify-center px-7 py-9 sm:px-10 sm:py-10 md:-ml-3 md:w-[58%] md:rounded-l-[2rem] md:rounded-r-3xl md:pl-12 md:pr-11">
          <h2
            id="login-heading"
            className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-[1.65rem]"
          >
            Log in
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-zinc-400">
            Use your admin or employee username and password.
          </p>
          <LoginForm />
        </div>
      </article>
    </div>
  );
}
