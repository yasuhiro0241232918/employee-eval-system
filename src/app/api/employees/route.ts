import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const employees = await prisma.employee.findMany({
    where: {
      deletedAt: null,
      OR: q
        ? [
            { name: { contains: q } },
            { department: { contains: q } },
          ]
        : undefined,
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, name: true, department: true, position: true,
      joinDate: true, birthDate: true, photo: true, grade: true, gradeNumber: true, company: true,
    },
  });
  return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const emp = await prisma.employee.create({
    data: {
      name: body.name,
      birthDate: body.birthDate ? new Date(body.birthDate) : null,
      joinDate: body.joinDate ? new Date(body.joinDate) : null,
      department: body.department ?? null,
      position: body.position ?? null,
      grade: body.grade ?? null,
      gradeNumber: body.gradeNumber ?? null,
      company: body.company ?? null,
      photo: body.photo ?? null,
    },
  });
  return NextResponse.json(emp, { status: 201 });
}
