import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";

const COMPANIES = ["鈴木総業", "ミヤツリサイクル", "ヤマトコーポレーション", "チャールズデザイン", "ガレージファクトリー", "ENEOSキタカタSS"];

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  const s = String(val).trim();
  if (!s) return null;
  const normalized = s.replace(/\//g, "-");
  const d = new Date(normalized);
  return isNaN(d.getTime()) ? null : d;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });

    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    const results: { name: string; status: string }[] = [];

    for (const row of rows) {
      const name = String(row["氏名"] ?? "").trim();
      if (!name) continue;

      const company = String(row["所属会社"] ?? "").trim();
      const validCompany = COMPANIES.includes(company) ? company : null;

      try {
        await prisma.employee.create({
          data: {
            name,
            birthDate: parseDate(row["生年月日"]),
            joinDate: parseDate(row["入社日"]),
            address: String(row["住所"] ?? "").trim() || null,
            company: validCompany,
            department: String(row["部署"] ?? "").trim() || null,
            position: String(row["役職"] ?? "").trim() || null,
          },
        });
        results.push({ name, status: "登録済" });
      } catch {
        results.push({ name, status: "エラー" });
      }
    }

    return NextResponse.json({ results, total: results.length });
  } catch {
    return NextResponse.json({ error: "ファイルの読み込みに失敗しました" }, { status: 500 });
  }
}
