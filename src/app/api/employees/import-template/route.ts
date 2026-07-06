import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const headers = ["氏名", "生年月日", "住所", "所属会社", "部署", "入社日", "役職"];
  const example = ["山田 太郎", "1990/04/01", "福島県喜多方市○○町1-2-3", "鈴木総業", "営業部", "2020/04/01", "課長"];

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  // 列幅設定
  ws["!cols"] = [
    { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 20 },
    { wch: 14 }, { wch: 14 }, { wch: 12 },
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
