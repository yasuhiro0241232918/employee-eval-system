import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const records = await prisma.attendance.findMany({
    where: { employeeId: params.id, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(records);
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { date, status } = await req.json();
  const d = new Date(date);
  const record = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: params.id, date: d } },
    create: { employeeId: params.id, date: d, status },
    update: { status },
  });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { date } = await req.json();
  const d = new Date(date);
  await prisma.attendance.deleteMany({
    where: { employeeId: params.id, date: d },
  });
  return NextResponse.json({ ok: true });
}
