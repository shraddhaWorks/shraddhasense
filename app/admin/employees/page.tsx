import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { AdminEmployeesTable } from "@/components/admin-employees-table";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminEmployeesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const employees = await prisma.user.findMany({
    where: {
      adminId: session.user.id,
      role: Role.EMPLOYEE,
    },
    select: {
      id: true,
      name: true,
      username: true,
      monthlySalary: true,
      createdAt: true,
      _count: {
        select: {
          attendances: true,
          leaves: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const employeeRows = employees.map((employee) => ({
    ...employee,
    monthlySalary: Number(employee.monthlySalary),
  }));

  return (
    <main className="app-main mx-auto w-full min-w-0 max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:pb-14 sm:pt-6 md:px-8 md:pb-16 md:pt-8 lg:px-10 xl:max-w-7xl xl:px-12">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading text-xl font-bold sm:text-2xl md:text-3xl">Employees</h1>
        <Link href="/" className="link-app inline-flex min-h-11 items-center text-sm sm:text-base">
          ← Dashboard
        </Link>
      </div>

      <AdminEmployeesTable employees={employeeRows} />
    </main>
  );
}
