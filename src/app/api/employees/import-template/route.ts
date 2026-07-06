import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const headers = ["社員No.", "氏名", "生年月日", "市町村", "所属会社", "所属部", "入社日", "役職", "雇用形態"];
  const example = ["", "山田 太郎", "1990/04/01", "喜多方市", "鈴木総業", "営業部", "2020/04/01", "課長", "正社員"];
  const note = ["※新規登録は空欄、更新時は社員No.を記入", "", "", "", "", "", "", "", ""];

  const ws = XLSX.utils.aoa_to_sheet([headers, note, example]);

  ws["!cols"] = [
    { wch: 12 }, { wch: 16 }, { wch: 14 }, { wch: 14 },
    { wch: 20 }, { wch: 14 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "社員一覧");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="employee_template.xlsx"',
    },
  });
}
