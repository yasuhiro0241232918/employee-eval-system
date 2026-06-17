import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { date, content } = await req.json();
  const record = await prisma.memo.create({
    data: { employeeId: params.id, date: date ? new Date(date) : null, content },
  });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params: _ }: { params: { id: string } }) {
  const { id } = await req.json();
  await prisma.memo.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
