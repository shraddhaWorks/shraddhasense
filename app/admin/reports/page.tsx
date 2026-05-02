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
    <main className="app-main mx-auto w-full min-w-0 max-w-7xl px-4 pb-12 pt-4 sm:px-6 sm:pb-14 sm:pt-6 md:px-8 md:pb-16 md:pt-8 lg:px-10 xl:max-w-[90rem] xl:px-12">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="page-heading text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
            Monthly reports
          </h1>
          <p className="text-app-muted mt-2 max-w-prose text-sm leading-relaxed sm:text-base">
            Pick a month to see holidays (weekends), attendance, leaves, and salary for that month.
          </p>
        </div>
        <Link href="/" className="link-app inline-flex min-h-11 shrink-0 items-center self-start text-sm sm:text-base">
          ← Dashboard
        </Link>
      </div>
      <AdminReportsTable />
    </main>
  );
}
