import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Header from "@/components/ui/Header";
import GroupSettings from "./GroupSettings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "staff";
  if (role !== "admin") redirect("/employees");

  const rawEmployees = await prisma.employee.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, deletedAt: true },
    orderBy: { name: "asc" },
  });
  const allEmployees = rawEmployees.map(e => ({
    ...e,
    deletedAt: e.deletedAt ? e.deletedAt.toISOString() : null,
  }));

  return (
    <div>
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-xl font-bold text-slate-800 mb-1">設定</h1>
        <p className="text-sm text-slate-500 mb-6">グループを作成して、サイドバーの表示をカスタマイズできます。</p>
        <GroupSettings allEmployees={allEmployees} />
      </div>
    </div>
  );
}
