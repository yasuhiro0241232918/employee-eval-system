import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const employees = await prisma.employee.findMany({
    where: { deletedAt: null },
    orderBy: { name: "asc" },
    include: {
      attendance: { orderBy: { date: "asc" } },
    },
  });

  const headers = [
    "従業員名", "社員番号", "日付", "曜日",
    "出勤", "欠勤", "有給", "遅刻", "遅刻時間", "早退", "早退時間",
    "法定休出", "法外休出",
    "普通残業h", "割増残業h",
    "法定普残h", "法定割残h", "法外普残h", "法外割残h",
    "遠距離h",
  ];

  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];

  const rows: string[][] = [headers];

  for (const emp of employees) {
    for (const att of emp.attendance) {
      const d = new Date(att.date);
      const dow = dayNames[d.getUTCDay()];
      const dateStr = `${d.getUTCFullYear()}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${String(d.getUTCDate()).padStart(2, "0")}`;
      rows.push([
        emp.name,
        emp.employeeNo ?? "",
        dateStr,
        dow,
        att.worked ? "1" : "0",
        att.absent ? "1" : "0",
        att.paidLeave ? "1" : "0",
        att.tardy ? "1" : "0",
        att.tardyTime ?? "",
        att.earlyLeave ? "1" : "0",
        att.earlyLeaveTime ?? "",
        att.statutoryHoliday ? "1" : "0",
        att.nonStatutoryHoliday ? "1" : "0",
        String(att.overtimeNormal),
        String(att.overtimePremium),
        String(att.statHolOvertimeNormal),
        String(att.statHolOvertimePremium),
        String(att.nonStatHolOvertimeNormal),
        String(att.nonStatHolOvertimePremium),
        String(att.distanceHours),
      ]);
    }
  }

  const csv = "﻿" + rows.map(row =>
    row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")
  ).join("\r\n");

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="attendance_${today}.csv"`,
    },
  });
}
