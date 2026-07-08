import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const emp = await prisma.employee.findUnique({
    where: { id: params.id },
    include: {
      qualifications: { orderBy: { createdAt: "asc" } },
      experiences: { orderBy: { createdAt: "asc" } },
      accidents: { orderBy: { date: "desc" } },
      memos: { orderBy: { date: "desc" } },
      interviews: { orderBy: { date: "desc" } },
      aiEvaluations: { orderBy: { evaluatedAt: "desc" } },
    },
  });
  if (!emp) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(emp);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const emp = await prisma.employee.update({
    where: { id: params.id },
    data: {
      name: body.name,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      joinDate: body.joinDate ? new Date(body.joinDate) : null,
      department: body.department ?? null,
      position: body.position ?? null,
      employeeNo: body.employeeNo ?? null,
      grade: body.grade ?? null,
      gradeNumber: body.gradeNumber ?? null,
      company: body.company ?? null,
      address: body.address ?? null,
      employmentType: body.employmentType ?? null,
      ...(body.photo !== undefined ? { photo: body.photo } : {}),
    },
  });
  return NextResponse.json(emp);
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  await prisma.employee.update({
    where: { id: params.id },
    data: { deletedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
