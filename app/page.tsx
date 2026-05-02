import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginShell } from "@/components/login-shell";
import { AdminDashboard } from "@/components/admin-dashboard";
import { EmployeeDashboard } from "@/components/employee-dashboard";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ username?: string; password?: string }>;
}) {
  const params = await searchParams;
  if (params.password) {
    const safeUrl = params.username
      ? `/?username=${encodeURIComponent(params.username)}`
      : "/";
    redirect(safeUrl);
  }

  const session = await getServerSession(authOptions);

  const mainLoggedIn =
    "app-main mx-auto w-full min-w-0 max-w-5xl px-4 pb-12 pt-4 sm:px-6 sm:pb-14 sm:pt-6 md:px-8 md:pb-16 md:pt-8 lg:px-10 xl:max-w-6xl xl:px-12 2xl:max-w-7xl";
  const mainLogin =
    "app-main login-page-main relative flex min-h-[calc(100dvh-5.5rem)] w-full min-w-0 flex-1 flex-col";

  return (
    <main className={session?.user ? mainLoggedIn : mainLogin}>
      {!session?.user && <div className="login-page-backdrop" aria-hidden />}

      {session?.user ? (
        <header className="text-balance">
          <h1 className="page-heading break-words px-0.5 text-[1.35rem] font-bold leading-tight tracking-tight sm:text-2xl md:text-3xl lg:text-[2rem]">
            Attendance and Salary Manager
          </h1>
          <p className="text-app-muted mt-3 max-w-2xl text-sm leading-relaxed md:text-base">
            Admin can create employee accounts, view attendance, leaves, punch in/out
            locations and monthly salary calculations.
          </p>
        </header>
      ) : null}

      {!session?.user && <LoginShell />}

      {session?.user && session.user.role === "ADMIN" && (
        <section className="mt-8 space-y-4">
          <p className="badge-app">Admin Portal</p>
          <AdminDashboard userName={session.user.name ?? "Admin"} />
        </section>
      )}

      {session?.user && session.user.role === "EMPLOYEE" && (
        <section className="mt-8 space-y-4">
          <p className="badge-app">Employee Portal</p>
          <EmployeeDashboard userName={session.user.name ?? "Employee"} />
        </section>
      )}
    </main>
  );
}
