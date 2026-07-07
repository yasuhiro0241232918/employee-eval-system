import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

const COMPANIES = ["鈴木総業", "ミヤツリサイクル", "ヤマトコーポレーション", "チャールズデザイン", "ガレージファクトリー", "ENEOSキタカタSS"];

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  // cellDates:true で Date オブジェクトになる場合
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
  // Excel シリアル値（数値）の場合
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  // 文字列の場合（"1990/04/01" や "1990-04-01"）
  const s = String(val).trim();
  if (!s) return null;
  const normalized = s.replace(/\//g, "-");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

function str(val: unknown): string | null {
  const s = String(val ?? "").trim();
  return s || null;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array", cellDates: true });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    const results: { name: string; status: string }[] = [];

    for (const row of rows) {
      const name = str(row["氏名"]);
      if (!name) continue;

      // ノート行をスキップ
      if (name.startsWith("※")) continue;

      const employeeNo = str(row["社員No."]);
      const company = str(row["所属会社"]);
      const validCompany = company && COMPANIES.includes(company) ? company : null;

      const data = {
        name,
        birthDate: parseDate(row["生年月日"]),
        joinDate: parseDate(row["入社日"]),
        address: str(row["市町村"]),
        company: validCompany,
        department: str(row["所属部"]),
        position: str(row["役職"]),
        employmentType: str(row["雇用形態"]),
      };

      try {
        if (employeeNo) {
          // 社員No.あり → 更新（空欄でない項目のみ上書き）
          const existing = await prisma.employee.findUnique({ where: { employeeNo } });
          if (!existing) {
            results.push({ name, status: "エラー（社員No.が見つかりません）" });
            continue;
          }
          const updateData: Record<string, unknown> = { name };
          if (data.birthDate) updateData.birthDate = data.birthDate;
          if (data.joinDate) updateData.joinDate = data.joinDate;
          if (data.address) updateData.address = data.address;
          if (data.company) updateData.company = data.company;
          if (data.department) updateData.department = data.department;
          if (data.position) updateData.position = data.position;
          if (data.employmentType) updateData.employmentType = data.employmentType;

          await prisma.employee.update({ where: { employeeNo }, data: updateData });
          results.push({ name, status: "更新済" });
        } else {
          // 社員No.なし → 新規作成
          await prisma.employee.create({ data });
          results.push({ name, status: "新規登録" });
        }
      } catch {
        results.push({ name, status: "エラー" });
      }
    }

    return NextResponse.json({ results, total: results.length });
  } catch {
    return NextResponse.json({ error: "ファイルの読み込みに失敗しました" }, { status: 500 });
  }
}
