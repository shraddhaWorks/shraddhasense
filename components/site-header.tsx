"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

type Props = { isAdmin: boolean };

const navLinkClass =
  "rounded-xl px-2.5 py-2.5 text-sm font-semibold text-zinc-300 transition-colors hover:bg-orange-500/10 hover:text-white sm:px-3 lg:px-3.5 lg:text-[0.9375rem]";

const navLinkMobile =
  "flex min-h-12 items-center rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 text-base font-semibold text-zinc-100 transition-colors active:scale-[0.99] hover:border-orange-500/30 hover:bg-zinc-800/80";

export function SiteHeader({ isAdmin }: Props) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { href: "/", label: "Dashboard" },
    ...(isAdmin
      ? [
          { href: "/admin/reports", label: "Reports" },
          { href: "/admin/accounts", label: "Accounts" },
          { href: "/admin/employees", label: "Employees" },
          { href: "/admin/create", label: "Create" },
        ]
      : []),
  ];

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header className="app-navbar sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/95 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:gap-4 sm:px-6 lg:px-8 xl:max-w-[90rem] xl:px-10 2xl:px-12">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 no-underline sm:gap-3 md:max-w-[min(100%,28rem)] md:flex-initial lg:max-w-none"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src="/logo.svg"
            alt="Company logo"
            width={160}
            height={47}
            className="h-8 w-auto shrink-0 object-contain sm:h-9 md:h-10 lg:h-11"
            priority
          />
          <span className="brand-title-gradient line-clamp-2 min-w-0 text-xs font-bold leading-snug tracking-tight sm:line-clamp-1 sm:text-sm md:text-base lg:text-[1.05rem]">
            Attendance and Salary Manager
          </span>
        </Link>

        <nav
          className="hidden flex-nowrap items-center justify-end gap-0.5 md:flex md:gap-1 lg:gap-2"
          aria-label="Main"
        >
          {links.map(({ href, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`${navLinkClass} ${active ? "bg-orange-500/15 text-orange-300" : ""}`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <button
          type="button"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-700 bg-zinc-900/80 text-zinc-200 shadow-inner transition hover:border-orange-500/40 hover:text-white md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((o) => !o)}
        >
          {menuOpen ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      <div
        id="mobile-nav"
        className={`border-t border-zinc-800/90 bg-gradient-to-b from-zinc-950 to-zinc-900/95 px-4 transition-all duration-200 ease-out md:hidden ${
          menuOpen
            ? "max-h-[min(85dvh,32rem)] py-3 opacity-100"
            : "pointer-events-none max-h-0 overflow-hidden border-t-0 py-0 opacity-0"
        }`}
      >
        <nav className="flex flex-col gap-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]" aria-label="Mobile main">
          {links.map(({ href, label }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`${navLinkMobile} ${active ? "border-orange-500/40 bg-orange-950/20 text-orange-200" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
