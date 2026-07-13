import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = req.nextUrl.searchParams.get("month");

  if (!month) {
    // 年間全件取得（有給残数計算用）
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year + 1, 0, 1));
    const records = await prisma.attendance.findMany({
      where: { employeeId: params.id, date: { gte: start, lt: end } },
    });
    const paidLeaveTotal = records.filter(r => r.paidLeave).length;
    return NextResponse.json({ paidLeaveTotal });
  }

  const start = new Date(Date.UTC(year, Number(month) - 1, 1));
  const end = new Date(Date.UTC(year, Number(month), 1));
  const records = await prisma.attendance.findMany({
    where: { employeeId: params.id, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { date, ...fields } = await req.json() as Record<string, unknown>;
  const d = new Date(date as string);
  const data = {
    worked:                 Boolean(fields.worked),
    absent:                 Boolean(fields.absent),
    paidLeave:              Boolean(fields.paidLeave),
    statutoryHoliday:       Boolean(fields.statutoryHoliday),
    nonStatutoryHoliday:    Boolean(fields.nonStatutoryHoliday),
    overtimeNormal:         Number(fields.overtimeNormal) || 0,
    overtimePremium:        Number(fields.overtimePremium) || 0,
    statHolOvertimeNormal:  Number(fields.statHolOvertimeNormal) || 0,
    statHolOvertimePremium: Number(fields.statHolOvertimePremium) || 0,
    nonStatHolOvertimeNormal:  Number(fields.nonStatHolOvertimeNormal) || 0,
    nonStatHolOvertimePremium: Number(fields.nonStatHolOvertimePremium) || 0,
    distanceHours:          Number(fields.distanceHours) || 0,
    tardy:                  Boolean(fields.tardy),
    earlyLeave:             Boolean(fields.earlyLeave),
    tardyTime:              fields.tardyTime ? String(fields.tardyTime) : null,
    earlyLeaveTime:         fields.earlyLeaveTime ? String(fields.earlyLeaveTime) : null,
  };
  const record = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: params.id, date: d } },
    create: { employeeId: params.id, date: d, ...data },
    update: data,
  });
  return NextResponse.json(record);
}
