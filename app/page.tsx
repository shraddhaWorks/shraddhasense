import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
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

  return (
    <main className="mx-auto w-full max-w-5xl p-6 md:p-10">
      <h1 className="text-2xl font-semibold text-orange-900">Attendance and Salary Manager</h1>
      <p className="mt-2 text-sm text-orange-800">
        Admin can create employee accounts, view attendance, leaves, punch in/out
        locations and monthly salary calculations.
      </p>

      {!session?.user && (
        <section className="mt-8 rounded-lg border border-orange-200 bg-white p-5">
          <h2 className="text-lg font-medium">Login</h2>
          <p className="mt-2 text-sm text-orange-800">
            Create first admin account once using <code>/api/setup-admin</code>.
          </p>
          <LoginForm />
        </section>
      )}

      {session?.user.role === "ADMIN" && (
        <section className="mt-8">
          <p className="mb-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
            Admin Portal
          </p>
          <AdminDashboard userName={session.user.name ?? "Admin"} />
        </section>
      )}

      {session?.user.role === "EMPLOYEE" && (
        <section className="mt-8">
          <p className="mb-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-800">
            Employee Portal
          </p>
          <EmployeeDashboard userName={session.user.name ?? "Employee"} />
        </section>
      )}
    </main>
  );
}
