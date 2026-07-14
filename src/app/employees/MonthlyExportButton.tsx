"use client";
import { useState } from "react";

type Summary = {
  name: string;
  worked: number; absent: number; paidLeave: number;
  tardy: number; earlyLeave: number;
  overtimeNormal: number; overtimePremium: number;
  statHol: number; statHolOvertimeNormal: number; statHolOvertimePremium: number;
  nonStatHol: number; nonStatHolOvertimeNormal: number; nonStatHolOvertimePremium: number;
  distanceHours: number; distanceAllowance: number;
};
type Group = { groupName: string; members: Summary[] };

const HEADERS = ["氏名","労働日数","欠勤日数","有給日数","遅刻回数","早退回数",
  "普残h","割残h","法定休出","法定普残h","法定割残h","法外休出","法外普残h","法外割残h","遠距h","遠距手当"];

function toRow(m: Summary): (string | number)[] {
  return [m.name, m.worked, m.absent, m.paidLeave, m.tardy, m.earlyLeave,
    m.overtimeNormal, m.overtimePremium,
    m.statHol, m.statHolOvertimeNormal, m.statHolOvertimePremium,
    m.nonStatHol, m.nonStatHolOvertimeNormal, m.nonStatHolOvertimePremium,
    m.distanceHours, m.distanceAllowance];
}

export default function MonthlyExportButton() {
  const now = new Date();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [loading, setLoading] = useState(false);

  async function fetchData() {
    const res = await fetch(`/api/monthly-summary?year=${year}&month=${month}`);
    return res.json() as Promise<{ year: number; month: number; groups: Group[] }>;
  }

  async function handlePrint() {
    setLoading(true);
    const data = await fetchData();
    setLoading(false);
    setOpen(false);

    const rows = data.groups.flatMap(g => [
      `<tr class="group-header"><td colspan="${HEADERS.length}">${g.groupName}</td></tr>`,
      ...g.members.map(m => `<tr>${toRow(m).map((v, i) => `<td${i === 0 ? ' class="name"' : ''}>${v}</td>`).join("")}</tr>`),
    ]).join("");

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>${data.year}年${data.month}月 月次勤怠集計表</title>
<style>
  @page { size: A4 landscape; margin: 12mm; }
  body { font-family: "Hiragino Sans", sans-serif; font-size: 9px; color: #111; }
  h1 { font-size: 13px; margin: 0 0 8px; }
  p.sub { font-size: 9px; color: #666; margin: 0 0 10px; }
  table { border-collapse: collapse; width: 100%; }
  th { background: #334155; color: #fff; padding: 4px 5px; text-align: center; white-space: nowrap; font-size: 8px; }
  td { padding: 3px 5px; border-bottom: 1px solid #e2e8f0; text-align: center; white-space: nowrap; }
  td.name { text-align: left; font-weight: 600; }
  tr.group-header td { background: #f1f5f9; text-align: left; font-weight: bold; font-size: 9px; padding: 5px 6px; color: #475569; border-top: 2px solid #94a3b8; }
  tr:nth-child(even):not(.group-header) td { background: #f8fafc; }
</style></head><body>
<h1>${data.year}年${data.month}月　月次勤怠集計表</h1>
<p class="sub">出力日：${new Date().toLocaleDateString("ja-JP")}</p>
<table>
  <thead><tr>${HEADERS.map(h => `<th>${h}</th>`).join("")}</tr></thead>
  <tbody>${rows}</tbody>
</table>
</body></html>`);
    win.document.close();
    win.print();
  }

  async function handleCsv() {
    setLoading(true);
    const data = await fetchData();
    setLoading(false);
    setOpen(false);

    const csvHeaders = ["グループ", ...HEADERS];
    const csvRows = data.groups.flatMap(g =>
      g.members.map(m => [g.groupName, ...toRow(m)])
    );
    const csv = "﻿" + [csvHeaders, ...csvRows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `月次勤怠_${year}年${month}月.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition whitespace-nowrap"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
        月次勤怠出力
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-72" onClick={e => e.stopPropagation()}>
            <h2 className="text-base font-bold text-slate-800 mb-4">月次勤怠出力</h2>
            <div className="flex items-center gap-2 mb-6">
              <select
                value={year}
                onChange={e => setYear(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => (
                  <option key={y} value={y}>{y}年</option>
                ))}
              </select>
              <select
                value={month}
                onChange={e => setMonth(Number(e.target.value))}
                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-teal-400"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                  <option key={m} value={m}>{m}月</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={handlePrint}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-800 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                印刷（PDF）
              </button>
              <button
                onClick={handleCsv}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                CSVダウンロード
              </button>
              <button onClick={() => setOpen(false)} className="w-full text-sm text-slate-400 hover:text-slate-600 py-1.5 transition">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
