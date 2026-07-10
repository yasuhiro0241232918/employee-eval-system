import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const groups = await prisma.group.findMany({
    orderBy: { order: "asc" },
    include: {
      members: {
        orderBy: { order: "asc" },
        include: { employee: { select: { id: true, name: true, deletedAt: true } } },
      },
    },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const { name } = await req.json();
  const maxOrder = await prisma.group.aggregate({ _max: { order: true } });
  const group = await prisma.group.create({
    data: { name, order: (maxOrder._max.order ?? -1) + 1 },
  });
  return NextResponse.json(group);
}

export async function PUT(req: NextRequest) {
  // Reorder groups: body = [{ id, order }]
  const items: { id: string; order: number }[] = await req.json();
  await Promise.all(items.map(({ id, order }) => prisma.group.update({ where: { id }, data: { order } })));
  return NextResponse.json({ ok: true });
}
