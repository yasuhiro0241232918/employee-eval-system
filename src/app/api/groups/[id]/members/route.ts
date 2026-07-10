import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { employeeId } = await req.json();
  const maxOrder = await prisma.groupMember.aggregate({
    where: { groupId: params.id },
    _max: { order: true },
  });
  const member = await prisma.groupMember.create({
    data: { groupId: params.id, employeeId, order: (maxOrder._max.order ?? -1) + 1 },
    include: { employee: { select: { id: true, name: true } } },
  });
  return NextResponse.json(member);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  // Reorder members: body = [{ id, order }]
  const items: { id: string; order: number }[] = await req.json();
  await Promise.all(items.map(({ id, order }) => prisma.groupMember.update({ where: { id }, data: { order } })));
  return NextResponse.json({ ok: true });
}
