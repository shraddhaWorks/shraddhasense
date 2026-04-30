import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/");
  }

  const accounts = await prisma.user.findMany({
    where: {
      OR: [{ id: session.user.id }, { adminId: session.user.id }],
    },
    select: {
      id: true,
      name: true,
      username: true,
      role: true,
      monthlySalary: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto w-full max-w-6xl p-6 md:p-10">
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-orange-900">Accounts Table</h1>
        <Link href="/" className="text-sm text-orange-700 underline">
          Back to dashboard
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border border-orange-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-orange-100 text-orange-900">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Username</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Monthly Salary</th>
              <th className="px-4 py-3">Created At</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id} className="border-t border-orange-100">
                <td className="px-4 py-3">{account.name}</td>
                <td className="px-4 py-3">{account.username}</td>
                <td className="px-4 py-3">{account.role}</td>
                <td className="px-4 py-3">{Number(account.monthlySalary)}</td>
                <td className="px-4 py-3">
                  {new Date(account.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
