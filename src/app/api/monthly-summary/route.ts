import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [groups, employees, attendances, settings] = await Promise.all([
    prisma.group.findMany({
      orderBy: { order: "asc" },
      include: { members: { orderBy: { order: "asc" }, include: { employee: true } } },
    }),
    prisma.employee.findMany({ where: { deletedAt: null } }),
    prisma.attendance.findMany({
      where: { date: { gte: start, lt: end } },
    }),
    prisma.setting.findMany(),
  ]);

  const distanceRate = Number(settings.find(s => s.key === "distanceAllowanceRate")?.value ?? 1913);

  const attMap = new Map<string, typeof attendances>();
  for (const a of attendances) {
    const list = attMap.get(a.employeeId) ?? [];
    list.push(a);
    attMap.set(a.employeeId, list);
  }

  function summarize(employeeId: string) {
    const recs = attMap.get(employeeId) ?? [];
    return {
      worked: recs.filter(r => r.worked).length,
      absent: recs.filter(r => r.absent).length,
      paidLeave: recs.filter(r => r.paidLeave).length,
      tardy: recs.filter(r => r.tardy).length,
      earlyLeave: recs.filter(r => r.earlyLeave).length,
      overtimeNormal: recs.reduce((s, r) => s + r.overtimeNormal, 0),
      overtimePremium: recs.reduce((s, r) => s + r.overtimePremium, 0),
      statHol: recs.filter(r => r.statutoryHoliday).length,
      statHolOvertimeNormal: recs.reduce((s, r) => s + r.statHolOvertimeNormal, 0),
      statHolOvertimePremium: recs.reduce((s, r) => s + r.statHolOvertimePremium, 0),
      nonStatHol: recs.filter(r => r.nonStatutoryHoliday).length,
      nonStatHolOvertimeNormal: recs.reduce((s, r) => s + r.nonStatHolOvertimeNormal, 0),
      nonStatHolOvertimePremium: recs.reduce((s, r) => s + r.nonStatHolOvertimePremium, 0),
      distanceHours: recs.reduce((s, r) => s + r.distanceHours, 0),
      distanceAllowance: Math.round(recs.reduce((s, r) => s + r.distanceHours, 0) * distanceRate),
    };
  }

  const groupedEmployeeIds = new Set(groups.flatMap(g => g.members.map(m => m.employeeId)));
  const ungrouped = employees.filter(e => !groupedEmployeeIds.has(e.id));

  const result = [
    ...groups.map(g => ({
      groupName: g.name,
      members: g.members
        .filter(m => !m.employee.deletedAt)
        .map(m => ({ name: m.employee.name, ...summarize(m.employee.id) })),
    })),
    ...(ungrouped.length > 0 ? [{
      groupName: "その他",
      members: ungrouped.map(e => ({ name: e.name, ...summarize(e.id) })),
    }] : []),
  ];

  return NextResponse.json({ year, month, distanceRate, groups: result });
}
