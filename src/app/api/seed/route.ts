import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existing) return NextResponse.json({ message: "既に初期化済みです" });

  const hash = await bcrypt.hash("admin1234", 10);
  await prisma.user.create({
    data: { username: "admin", passwordHash: hash, name: "管理者" },
  });
  return NextResponse.json({ message: "初期ユーザーを作成しました。ID: admin / PW: admin1234" });
}
