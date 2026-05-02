import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminCreateEmployeeForm } from "@/components/admin-create-employee-form";

export default async function AdminCreatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) redirect("/");
  if (session.user.role !== "ADMIN") redirect("/");

  return (
    <main className="app-main mx-auto w-full min-w-0 max-w-4xl px-4 pb-12 pt-4 sm:px-6 sm:pb-14 sm:pt-6 md:px-8 md:pb-16 md:pt-8 lg:px-10 xl:max-w-5xl xl:px-12">
      <div className="mb-6 flex flex-col gap-5 sm:mb-8 md:flex-row md:items-start md:justify-between">
        <h1 className="page-heading text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
          Create employee
        </h1>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
          <Link href="/admin/accounts" className="link-app inline-flex min-h-10 items-center text-sm sm:text-base">
            Accounts
          </Link>
          <Link href="/admin/employees" className="link-app inline-flex min-h-10 items-center text-sm sm:text-base">
            Employees
          </Link>
          <Link href="/" className="link-app inline-flex min-h-10 items-center text-sm sm:text-base">
            ← Dashboard
          </Link>
        </div>
      </div>
      <AdminCreateEmployeeForm />
    </main>
  );
}
