import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function makeKey(year: number, month: number) {
  return `holidays_${year}_${String(month).padStart(2, "0")}`;
}

export async function GET(req: NextRequest) {
  const year = Number(req.nextUrl.searchParams.get("year"));
  const month = Number(req.nextUrl.searchParams.get("month"));
  const key = makeKey(year, month);
  const setting = await prisma.setting.findUnique({ where: { key } });
  const days: number[] = setting ? JSON.parse(setting.value) : [];
  return NextResponse.json({ days });
}

export async function PUT(req: NextRequest) {
  const { year, month, days } = await req.json() as { year: number; month: number; days: number[] };
  const key = makeKey(year, month);
  await prisma.setting.upsert({
    where: { key },
    create: { key, value: JSON.stringify(days) },
    update: { value: JSON.stringify(days) },
  });
  return NextResponse.json({ ok: true });
}
