import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { content, period, note } = await req.json();
  const record = await prisma.experience.create({
    data: { employeeId: params.id, content, period, note },
  });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params: _ }: { params: { id: string } }) {
  const { id } = await req.json();
  await prisma.experience.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
