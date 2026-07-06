import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const existing = await prisma.user.findUnique({ where: { username: "admin" } });
  if (existing) return NextResponse.json({ message: "既に初期化済みです" });

  const adminHash = await bcrypt.hash("admin1234", 10);
  const staffHash = await bcrypt.hash("staff1234", 10);

  await prisma.user.create({
    data: { username: "admin", passwordHash: adminHash, name: "管理者", role: "admin" },
  });
  await prisma.user.create({
    data: { username: "staff", passwordHash: staffHash, name: "入力担当", role: "staff" },
  });

  return NextResponse.json({ message: "ユーザーを作成しました。管理用: admin/admin1234 / 入力用: staff/staff1234" });
}
