import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const existing = await prisma.user.findUnique({ where: { username: "staff" } });
  if (existing) {
    return NextResponse.json({ message: "staffユーザーは既に存在します" });
  }

  const hash = await bcrypt.hash("staff1234", 10);
  await prisma.user.create({
    data: { username: "staff", passwordHash: hash, name: "入力担当", role: "staff" },
  });

  await prisma.user.updateMany({
    where: { username: "admin" },
    data: { role: "admin" },
  });

  return NextResponse.json({ message: "staffユーザーを作成しました。ID: staff / PW: staff1234" });
}
