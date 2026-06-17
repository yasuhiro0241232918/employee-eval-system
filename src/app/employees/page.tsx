import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Header from "@/components/ui/Header";
import SearchEmployees from "./SearchEmployees";

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

  return (
    <div>
      <Header />
      <main className="max-w-6xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 mb-6">
          <SearchEmployees defaultValue={q} />
          <Link
            href="/employees/new"
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            社員追加
          </Link>
        </div>

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
      </main>
    </div>
  );
}
