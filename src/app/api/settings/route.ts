import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.setting.findMany();
  const settings: Record<string, string> = {};
  rows.forEach(r => { settings[r.key] = r.value; });
  return NextResponse.json(settings);
}

export async function PUT(req: NextRequest) {
  const body: Record<string, string> = await req.json();
  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } })
    )
  );
  return NextResponse.json({ ok: true });
}
