"use client";
import { useState, useRef } from "react";
import Link from "next/link";

type Result = { name: string; status: string };

export default function ImportForm() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[] | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) { setError("ファイルを選択してください"); return; }

    setLoading(true); setError(""); setResults(null);
    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/employees/import", { method: "POST", body: fd });
    const data = await res.json() as { results?: Result[]; error?: string };
    setLoading(false);

    if (res.ok && data.results) {
      setResults(data.results);
    } else {
      setError(data.error ?? "エラーが発生しました");
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/employees" className="text-slate-400 hover:text-slate-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <h2 className="text-lg font-bold text-slate-800">社員一括登録</h2>
      </div>

      {/* Step 1: テンプレートダウンロード */}
      <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
        <p className="text-sm font-semibold text-blue-800 mb-2">Step 1 — テンプレートをダウンロード</p>
        <p className="text-xs text-blue-600 mb-3">Excelファイルに社員情報を入力してください。<br />項目：氏名・生年月日・住所・所属会社・部署・入社日・役職</p>
        <a
          href="/api/employees/import-template"
          download="employee_template.xlsx"
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          テンプレートをダウンロード
        </a>
      </div>

      {/* Step 2: アップロード */}
      <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
        <p className="text-sm font-semibold text-slate-700 mb-3">Step 2 — 入力済みファイルをアップロード</p>
        <form onSubmit={handleSubmit}>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 mb-3"
          />
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <button type="submit" disabled={loading}
            className="bg-slate-800 hover:bg-slate-900 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
            {loading ? "登録中..." : "一括登録する"}
          </button>
        </form>
      </div>

      {/* 結果 */}
      {results && (
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">登録結果（{results.length}件）</p>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100 text-xs text-slate-500 text-left">
              <th className="pb-2 pr-4">氏名</th><th className="pb-2">結果</th>
            </tr></thead>
            <tbody>{results.map((r, i) => (
              <tr key={i} className="border-b border-slate-50">
                <td className="py-2 pr-4">{r.name}</td>
                <td className="py-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${r.status === "新規登録" || r.status === "更新済" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))}</tbody>
          </table>
          <div className="mt-4">
            <Link href="/employees" className="text-blue-500 hover:text-blue-600 text-sm font-medium">
              社員一覧に戻る
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
