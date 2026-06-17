import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { year, month, workDays, paidLeave } = await req.json();
  const record = await prisma.attendance.upsert({
    where: { employeeId_year_month: { employeeId: params.id, year, month } },
    create: { employeeId: params.id, year, month, workDays, paidLeave },
    update: { workDays, paidLeave },
  });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { year, month } = await req.json();
  await prisma.attendance.delete({
    where: { employeeId_year_month: { employeeId: params.id, year, month } },
  });
  return NextResponse.json({ ok: true });
}
