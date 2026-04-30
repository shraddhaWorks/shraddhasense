import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AdminReportsTable } from "@/components/admin-reports-table";

export default async function AdminReportsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  return (
    <main className="mx-auto w-full max-w-7xl p-6 md:p-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-orange-900">Employee Reports</h1>
        <Link href="/" className="text-sm text-orange-700 underline">
          Back to dashboard
        </Link>
      </div>
      <AdminReportsTable />
    </main>
  );
}
