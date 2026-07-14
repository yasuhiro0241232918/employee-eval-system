import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/ui/Header";
import SearchEmployees from "./SearchEmployees";
import MonthlyExportButton from "./MonthlyExportButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

function calcTenure(joinDate: Date | null) {
  if (!joinDate) return null;
  const d = new Date(joinDate), now = new Date();
  let y = now.getFullYear() - d.getFullYear();
  let m = now.getMonth() - d.getMonth();
  if (m < 0) { y--; m += 12; }
  return y > 0 ? `勤続 ${y}年${m}ヶ月` : `勤続 ${m}ヶ月`;
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string })?.role ?? "staff";
  const q = searchParams.q ?? "";
  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      OR: q
        ? [{ name: { contains: q } }, { department: { contains: q } }]
        : undefined,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, department: true, position: true,
      joinDate: true, photo: true,
    },
  });

  // グループ情報取得
  const groups = await prisma.group.findMany({
    orderBy: { order: "asc" },
    include: {
      members: {
        orderBy: { order: "asc" },
        include: { employee: { select: { id: true, name: true, deletedAt: true } } },
      },
    },
  });

  // グループ未所属の社員（あいうえお順）
  const allEmployees = await prisma.employee.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true },
  });
  const groupedEmployeeIds = new Set(
    groups.flatMap(g => g.members.filter(m => !m.employee.deletedAt).map(m => m.employeeId))
  );
  const ungrouped = allEmployees
    .filter(e => !groupedEmployeeIds.has(e.id))
    .sort((a, b) => a.name.localeCompare(b.name, "ja"));

  const hasGroups = groups.length > 0;

  return (
    <div>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <SearchEmployees defaultValue={q} />
          <MonthlyExportButton />
          {role === "admin" && (
            <div className="flex gap-2">
              <Link
                href="/employees/new"
                className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                社員追加
              </Link>
              <Link
                href="/employees/import"
                className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                一括登録
              </Link>
            </div>
          )}
        </div>

        <div className="flex gap-5">
          {/* 社員カード */}
          <div className="flex-1 min-w-0">
            {employees.length === 0 ? (
              <div className="text-center py-20 text-slate-400">
                <svg className="mx-auto mb-3 opacity-30" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <p>社員が登録されていません</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {employees.map((emp) => (
                  <Link
                    key={emp.id}
                    href={`/employees/${emp.id}`}
                    className="bg-white rounded-xl p-5 text-center shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all border-2 border-transparent hover:border-blue-100"
                  >
                    {emp.photo ? (
                      <img src={emp.photo} alt="" className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-blue-100" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3 border-2 border-blue-100">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                    )}
                    <p className="font-bold text-sm text-slate-800 mb-0.5">{emp.name}</p>
                    <p className="text-xs text-slate-500 mb-0.5">{emp.department ?? ""}</p>
                    <p className="text-xs text-slate-400">{emp.position ?? ""}</p>
                    {emp.joinDate && (
                      <span className="inline-block mt-2 text-xs bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">
                        {calcTenure(emp.joinDate)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* サイドバー */}
          <div className="w-48 shrink-0">
            <div className="bg-white rounded-xl shadow-sm p-3 sticky top-6">
              {hasGroups ? (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500">グループ</p>
                    {role === "admin" && (
                      <Link href="/settings" className="text-xs text-blue-500 hover:text-blue-700">設定</Link>
                    )}
                  </div>
                  <div className="flex flex-col max-h-[75vh] overflow-y-auto">
                    {groups.map(group => {
                      const activeMembers = group.members.filter(m => !m.employee.deletedAt);
                      if (activeMembers.length === 0) return null;
                      return (
                        <div key={group.id} className="mb-3">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 mb-1">{group.name}</p>
                          {activeMembers.map(member => (
                            <Link
                              key={member.id}
                              href={`/employees/${member.employeeId}`}
                              className="block text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1.5 transition"
                            >
                              {member.employee.name}
                            </Link>
                          ))}
                        </div>
                      );
                    })}
                    {ungrouped.length > 0 && (
                      <div className="mb-1">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide px-2 mb-1">その他</p>
                        {ungrouped.map(emp => (
                          <Link
                            key={emp.id}
                            href={`/employees/${emp.id}`}
                            className="block text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1.5 transition"
                          >
                            {emp.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-500">あいうえお順</p>
                    {role === "admin" && (
                      <Link href="/settings" className="text-xs text-blue-500 hover:text-blue-700">設定</Link>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 max-h-[75vh] overflow-y-auto">
                    {ungrouped.map((emp) => (
                      <Link
                        key={emp.id}
                        href={`/employees/${emp.id}`}
                        className="text-sm text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded px-2 py-1.5 transition"
                      >
                        {emp.name}
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
