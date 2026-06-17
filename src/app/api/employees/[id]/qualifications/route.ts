import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { name, date, note } = await req.json();
  const record = await prisma.qualification.create({
    data: { employeeId: params.id, name, date: date ? new Date(date) : null, note },
  });
  return NextResponse.json(record);
}

export async function DELETE(req: NextRequest, { params: _ }: { params: { id: string } }) {
  const { id } = await req.json();
  await prisma.qualification.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
