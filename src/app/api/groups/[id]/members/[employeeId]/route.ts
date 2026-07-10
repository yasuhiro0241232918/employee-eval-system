import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(_: NextRequest, { params }: { params: { id: string; employeeId: string } }) {
  await prisma.groupMember.deleteMany({
    where: { groupId: params.id, employeeId: params.employeeId },
  });
  return NextResponse.json({ ok: true });
}
