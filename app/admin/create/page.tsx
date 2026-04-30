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
    <main className="mx-auto w-full max-w-4xl p-6 md:p-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-orange-900">Create Employee Account</h1>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/admin/accounts" className="text-orange-700 underline">
            Accounts Table
          </Link>
          <Link href="/admin/employees" className="text-orange-700 underline">
            Employees Table
          </Link>
          <Link href="/" className="text-orange-700 underline">
            Back to dashboard
          </Link>
        </div>
      </div>
      <AdminCreateEmployeeForm />
    </main>
  );
}
