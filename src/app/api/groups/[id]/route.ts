import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { name } = await req.json();
  const group = await prisma.group.update({ where: { id: params.id }, data: { name } });
  return NextResponse.json(group);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.group.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
