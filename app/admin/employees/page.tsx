import Link from "next/link";
import { redirect } from "next/navigation";
import { Role } from "@prisma/client";
import { getServerSession } from "next-auth";
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

  return (
    <main className="app-main mx-auto w-full min-w-0 max-w-6xl px-4 pb-12 pt-4 sm:px-6 sm:pb-14 sm:pt-6 md:px-8 md:pb-16 md:pt-8 lg:px-10 xl:max-w-7xl xl:px-12">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="page-heading text-xl font-bold sm:text-2xl md:text-3xl">Employees</h1>
        <Link href="/" className="link-app inline-flex min-h-11 items-center text-sm sm:text-base">
          ← Dashboard
        </Link>
      </div>

      <div className="surface-card overflow-hidden rounded-2xl p-0">
        <div className="table-scroll-wrap overflow-x-auto rounded-none border-0 bg-transparent">
          <table className="table-app min-w-[40rem] text-left text-sm">
            <thead className="text-zinc-200">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Attendance Records</th>
              <th className="px-4 py-3">Leave Records</th>
              <th className="px-4 py-3">Monthly Salary</th>
              <th className="px-4 py-3">Created At</th>
            </tr>
          </thead>
          <tbody className="text-zinc-300">
            {employees.map((employee) => (
              <tr key={employee.id} className="border-t border-zinc-700/90">
                <td className="px-4 py-3">{employee.name}</td>
                <td className="px-4 py-3">{employee.username}</td>
                <td className="px-4 py-3">{employee._count.attendances}</td>
                <td className="px-4 py-3">{employee._count.leaves}</td>
                <td className="px-4 py-3">{Number(employee.monthlySalary)}</td>
                <td className="px-4 py-3">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <p className="table-scroll-hint px-4 pb-3">Swipe sideways to see all columns.</p>
      </div>
    </main>
  );
}
