"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Employee = {
  id: string; employeeNo: string | null; name: string; birthDate: string | null; joinDate: string | null;
  department: string | null; position: string | null; grade: string | null;
  gradeNumber: string | null; company: string | null; address: string | null; employmentType: string | null; photo: string | null;
  attendance: { id: string; year: number; month: number; workDays: number; paidLeave: number }[];
  qualifications: { id: string; name: string; date: string | null; note: string | null }[];
  experiences: { id: string; content: string; period: string | null; note: string | null }[];
  accidents: { id: string; date: string | null; content: string; punishment: string | null }[];
  memos: { id: string; date: string | null; content: string }[];
  interviews: { id: string; date: string | null; interviewer: string | null; content: string }[];
  aiEvaluations: { id: string; evaluatedAt: string; score: number; strengths: string; issues: string; summary: string }[];
};

const TABS = ["基本情報", "勤怠情報", "資格・経験", "事故歴", "メモ", "面談議事録", "AI評価"] as const;

function fmt(d: string | null) { return d ? new Date(d).toLocaleDateString("ja-JP") : "—"; }
function calcAge(d: string | null) {
  if (!d) return null;
  const b = new Date(d), now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now < new Date(now.getFullYear(), b.getMonth(), b.getDate())) age--;
  return `${age}歳`;
}
function calcTenure(d: string | null) {
  if (!d) return null;
  const b = new Date(d), now = new Date();
  let y = now.getFullYear() - b.getFullYear(), m = now.getMonth() - b.getMonth();
  if (m < 0) { y--; m += 12; }
  return y > 0 ? `勤続 ${y}年${m}ヶ月` : `勤続 ${m}ヶ月`;
}

const ADMIN_TABS = [0, 1, 2, 3, 4, 5, 6];
const STAFF_TABS = [1, 2, 3, 4];

export default function EmployeeDetail({ employee, role }: { employee: Employee; role: string }) {
  const router = useRouter();
  const allowedTabs = role === "admin" ? ADMIN_TABS : STAFF_TABS;
  const [tab, setTab] = useState(allowedTabs[0]);
  const [emp, setEmp] = useState(employee);
  const [apiKey, setApiKey] = useState(typeof window !== "undefined" ? localStorage.getItem("ems_api_key") ?? "" : "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [modal, setModal] = useState<{ type: string; data?: Record<string, string> } | null>(null);
  const [confirmId, setConfirmId] = useState<{ action: () => Promise<void> } | null>(null);

  async function reload() {
    const res = await fetch(`/api/employees/${emp.id}`);
    const data = await res.json() as Employee;
    setEmp(data);
  }

  async function deleteEmployee() {
    if (!confirm("この社員を削除しますか？")) return;
    await fetch(`/api/employees/${emp.id}`, { method: "DELETE" });
    router.push("/employees");
    router.refresh();
  }

  async function runAI() {
    if (!apiKey) { setAiError("APIキーを入力してください"); return; }
    localStorage.setItem("ems_api_key", apiKey);
    setAiLoading(true); setAiError("");
    const res = await fetch(`/api/employees/${emp.id}/ai-evaluations`, {
      method: "POST",
      headers: { "x-api-key": apiKey },
    });
    setAiLoading(false);
    if (res.ok) { await reload(); }
    else { const d = await res.json() as { error: string }; setAiError(d.error); }
  }

  async function addRecord(endpoint: string, body: Record<string, string | number>) {
    await fetch(`/api/employees/${emp.id}/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
    setModal(null);
  }

  async function deleteRecord(endpoint: string, body: Record<string, string | number>) {
    await fetch(`/api/employees/${emp.id}/${endpoint}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await reload();
  }

  const scoreBg = (s: number) => s >= 80 ? "bg-green-100 text-green-700" : s >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700";
  const today = new Date().toISOString().slice(0, 10);

  // 年度計算（4月始まり）
  function getFiscalYear(year: number, month: number) { return month >= 4 ? year : year - 1; }
  const now = new Date();
  const currentFiscalYear = getFiscalYear(now.getFullYear(), now.getMonth() + 1);
  const [selectedFY, setSelectedFY] = useState(currentFiscalYear);

  // 存在する年度一覧
  const fiscalYears = Array.from(new Set(emp.attendance.map(a => getFiscalYear(a.year, a.month)))).sort((a, b) => b - a);
  if (!fiscalYears.includes(currentFiscalYear)) fiscalYears.unshift(currentFiscalYear);

  // 選択年度の勤怠データ（4月〜翌3月）
  const fyAtt = emp.attendance.filter(a => getFiscalYear(a.year, a.month) === selectedFY);
  const totalWork = fyAtt.reduce((s, a) => s + a.workDays, 0);
  const totalLeave = fyAtt.reduce((s, a) => s + a.paidLeave, 0);

  return (
    <main className="max-w-4xl mx-auto px-4 py-6">
      {/* Header card */}
      <div className="bg-white rounded-xl shadow-sm p-5 mb-4 flex items-center gap-4">
        <Link href="/employees" className="text-slate-400 hover:text-slate-600 mr-1">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        {emp.photo ? (
          <img src={emp.photo} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-blue-100 shrink-0" />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100 shrink-0">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold text-slate-800">{emp.name}</h2>
          <p className="text-sm text-slate-500">{[emp.department, emp.position].filter(Boolean).join(" / ")}{emp.joinDate ? ` · ${calcTenure(emp.joinDate)}` : ""}</p>
        </div>
        {role === "admin" && (
          <div className="flex gap-2 shrink-0">
            <Link href={`/employees/${emp.id}/edit`} className="flex items-center gap-1 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              編集
            </Link>
            <button onClick={deleteEmployee} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              削除
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 overflow-x-auto">
          {TABS.map((t, i) => allowedTabs.includes(i) && (
            <button key={t} onClick={() => setTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition ${tab === i ? "border-blue-500 text-blue-600 bg-blue-50/50" : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"}`}>
              {t}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* 基本情報 */}
          {tab === 0 && (
            <div className="grid grid-cols-2 gap-4">
              {[
                ["社員No.", emp.employeeNo ?? "—"],
                ["氏名", emp.name],
                ["所属会社", emp.company ?? "—"],
                ["所属部", emp.department ?? "—"],
                ["役職", emp.position ?? "—"],
                ["雇用形態", emp.employmentType ?? "—"],
                ["生年月日", emp.birthDate ? `${fmt(emp.birthDate)}（${calcAge(emp.birthDate)}）` : "—"],
                ["入社日", emp.joinDate ? `${fmt(emp.joinDate)}（${calcTenure(emp.joinDate)}）` : "—"],
                ["住所（市町村）", emp.address ?? "—"],
                ["等級", emp.grade ?? "—"],
                ["号数", emp.gradeNumber ?? "—"],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-slate-500 mb-1">{label}</p>
                  <p className="text-sm bg-slate-50 border border-slate-100 rounded-lg px-3 py-2">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* 勤怠情報 */}
          {tab === 1 && (
            <div>
              {/* 年度セレクター */}
              <div className="flex items-center gap-3 mb-4">
                <label className="text-xs font-semibold text-slate-500">年度</label>
                <select value={selectedFY} onChange={e => setSelectedFY(Number(e.target.value))}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm bg-white outline-none focus:border-blue-400">
                  {fiscalYears.map(fy => (
                    <option key={fy} value={fy}>{fy}年度（{fy}/4〜{fy+1}/3）</option>
                  ))}
                </select>
              </div>
              {/* サマリー */}
              <div className="flex gap-6 bg-blue-50 rounded-xl p-4 mb-5">
                <div className="text-center"><p className="text-2xl font-bold text-blue-700">{totalWork}</p><p className="text-xs text-slate-500 mt-0.5">{selectedFY}年度 出勤日数</p></div>
                <div className="text-center"><p className="text-2xl font-bold text-blue-700">{totalLeave}</p><p className="text-xs text-slate-500 mt-0.5">{selectedFY}年度 有給取得</p></div>
              </div>
              <AttForm onAdd={async (y, m, w, l) => addRecord("attendance", { year: y, month: m, workDays: w, paidLeave: l })} />
              {fyAtt.length > 0 && (
                <table className="w-full text-sm mt-4">
                  <thead><tr className="border-b border-slate-100 text-xs text-slate-500 text-left">{["年","月","出勤日数","有給取得",""].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                  <tbody>{fyAtt.sort((a,b) => a.year !== b.year ? a.year - b.year : a.month - b.month).map(a=>(
                    <tr key={`${a.year}-${a.month}`} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4">{a.year}</td><td className="py-2 pr-4">{a.month}月</td>
                      <td className="py-2 pr-4">{a.workDays}日</td><td className="py-2 pr-4">{a.paidLeave}日</td>
                      <td className="py-2"><button onClick={()=>deleteRecord("attendance",{year:a.year,month:a.month})} className="text-red-400 hover:text-red-600"><TrashIcon/></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              )}
              {fyAtt.length === 0 && <p className="text-sm text-slate-400 mt-4">この年度のデータがありません</p>}
            </div>
          )}

          {/* 資格・経験 */}
          {tab === 2 && (
            <div>
              <SectionHead title="資格一覧" onAdd={() => setModal({ type: "qual" })} />
              {emp.qualifications.length > 0 ? (
                <table className="w-full text-sm mb-6">
                  <thead><tr className="border-b border-slate-100 text-xs text-slate-500 text-left">{["資格名","取得日","メモ",""].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                  <tbody>{emp.qualifications.map(q=>(
                    <tr key={q.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4">{q.name}</td><td className="py-2 pr-4">{fmt(q.date)}</td><td className="py-2 pr-4 text-slate-500">{q.note??""}</td>
                      <td className="py-2"><button onClick={()=>deleteRecord("qualifications",{id:q.id})} className="text-red-400 hover:text-red-600"><TrashIcon/></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-sm text-slate-400 mb-6">資格が登録されていません</p>}
              <SectionHead title="経験・スキル" onAdd={() => setModal({ type: "exp" })} />
              {emp.experiences.length > 0 ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 text-xs text-slate-500 text-left">{["内容","時期","メモ",""].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                  <tbody>{emp.experiences.map(e=>(
                    <tr key={e.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4">{e.content}</td><td className="py-2 pr-4">{e.period??""}</td><td className="py-2 pr-4 text-slate-500">{e.note??""}</td>
                      <td className="py-2"><button onClick={()=>deleteRecord("experiences",{id:e.id})} className="text-red-400 hover:text-red-600"><TrashIcon/></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-sm text-slate-400">経験が登録されていません</p>}
            </div>
          )}

          {/* 事故歴 */}
          {tab === 3 && (
            <div>
              <SectionHead title="事故歴一覧" onAdd={() => setModal({ type: "accident" })} />
              {emp.accidents.length > 0 ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 text-xs text-slate-500 text-left">{["発生日","事故内容","処分内容",""].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                  <tbody>{emp.accidents.map(a=>(
                    <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4 whitespace-nowrap">{fmt(a.date)}</td><td className="py-2 pr-4">{a.content}</td><td className="py-2 pr-4 text-slate-500">{a.punishment??""}</td>
                      <td className="py-2"><button onClick={()=>deleteRecord("accidents",{id:a.id})} className="text-red-400 hover:text-red-600"><TrashIcon/></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-sm text-slate-400">事故歴がありません</p>}
            </div>
          )}

          {/* メモ */}
          {tab === 4 && (
            <div>
              <SectionHead title="メモ一覧" onAdd={() => setModal({ type: "memo" })} />
              {emp.memos.length > 0 ? (
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100 text-xs text-slate-500 text-left">{["日付","内容",""].map(h=><th key={h} className="pb-2 pr-4">{h}</th>)}</tr></thead>
                  <tbody>{emp.memos.map(m=>(
                    <tr key={m.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4 whitespace-nowrap">{fmt(m.date)}</td><td className="py-2 pr-4">{m.content}</td>
                      <td className="py-2"><button onClick={()=>deleteRecord("memos",{id:m.id})} className="text-red-400 hover:text-red-600"><TrashIcon/></button></td>
                    </tr>
                  ))}</tbody>
                </table>
              ) : <p className="text-sm text-slate-400">メモがありません</p>}
            </div>
          )}

          {/* 面談議事録 */}
          {tab === 5 && (
            <div>
              <SectionHead title="面談議事録" onAdd={() => setModal({ type: "interview" })} />
              {emp.interviews.length > 0 ? emp.interviews.map(it => (
                <div key={it.id} className="border border-slate-100 rounded-xl p-4 mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-sm">{fmt(it.date)}</span>
                      {it.interviewer && <span className="text-xs text-slate-500 ml-2">面談者：{it.interviewer}</span>}
                    </div>
                    <button onClick={() => deleteRecord("interviews", { id: it.id })} className="text-red-400 hover:text-red-600"><TrashIcon /></button>
                  </div>
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{it.content}</p>
                </div>
              )) : <p className="text-sm text-slate-400">面談記録がありません</p>}
            </div>
          )}

          {/* AI評価 */}
          {tab === 6 && (
            <div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 text-sm text-yellow-800 flex items-center gap-2 mb-4">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                AI評価にはAnthropicのAPIキーが必要です
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-600 mb-1">Anthropic APIキー</label>
                <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="sk-ant-..." className="w-full max-w-md border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
              </div>
              <button onClick={runAI} disabled={aiLoading} className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg disabled:opacity-50 mb-4">
                {aiLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z"/></svg>}
                {aiLoading ? "評価中..." : "AI評価を実行"}
              </button>
              {aiError && <p className="text-red-500 text-sm mb-4">{aiError}</p>}
              {emp.aiEvaluations.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-3">評価履歴</p>
                  {emp.aiEvaluations.map(ev => (
                    <div key={ev.id} className="border border-slate-100 rounded-xl p-4 mb-3">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-slate-500">{new Date(ev.evaluatedAt).toLocaleString("ja-JP")}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${scoreBg(ev.score)}`}>{ev.score}点</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs font-semibold text-blue-600 mb-1">強み</p><p className="text-slate-700">{ev.strengths}</p></div>
                        <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs font-semibold text-orange-500 mb-1">課題</p><p className="text-slate-700">{ev.issues}</p></div>
                        <div className="bg-slate-50 rounded-lg p-3"><p className="text-xs font-semibold text-slate-500 mb-1">総合所見</p><p className="text-slate-700">{ev.summary}</p></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            {modal.type === "qual" && <ModalForm title="資格を追加" fields={[{name:"name",label:"資格名 *",required:true},{name:"date",label:"取得日",type:"date"},{name:"note",label:"メモ"}]} onSubmit={d=>addRecord("qualifications",d)} onClose={()=>setModal(null)} />}
            {modal.type === "exp" && <ModalForm title="経験・スキルを追加" fields={[{name:"content",label:"内容 *",required:true},{name:"period",label:"時期",placeholder:"2018〜2020"},{name:"note",label:"メモ"}]} onSubmit={d=>addRecord("experiences",d)} onClose={()=>setModal(null)} />}
            {modal.type === "accident" && <ModalForm title="事故歴を追加" fields={[{name:"date",label:"発生日",type:"date"},{name:"content",label:"事故内容 *",required:true,textarea:true},{name:"punishment",label:"処分内容"}]} onSubmit={d=>addRecord("accidents",d)} onClose={()=>setModal(null)} />}
            {modal.type === "memo" && <ModalForm title="メモを追加" fields={[{name:"date",label:"日付",type:"date",defaultValue:today},{name:"content",label:"内容 *",required:true,textarea:true}]} onSubmit={d=>addRecord("memos",d)} onClose={()=>setModal(null)} />}
            {modal.type === "interview" && <ModalForm title="面談議事録を追加" fields={[{name:"date",label:"面談日 *",type:"date",required:true,defaultValue:today},{name:"interviewer",label:"面談者",placeholder:"部長 鈴木"},{name:"content",label:"議事録内容 *",required:true,textarea:true,rows:5}]} onSubmit={d=>addRecord("interviews",d)} onClose={()=>setModal(null)} />}
          </div>
        </div>
      )}
    </main>
  );
}

function SectionHead({ title, onAdd }: { title: string; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-slate-700">{title}</h3>
      <button onClick={onAdd} className="flex items-center gap-1 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        追加
      </button>
    </div>
  );
}

function TrashIcon() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>;
}

function AttForm({ onAdd }: { onAdd: (y: number, m: number, w: number, l: number) => void }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [work, setWork] = useState(0);
  const [leave, setLeave] = useState(0);
  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {[["年",year,(v:number)=>setYear(v)],["月",month,(v:number)=>setMonth(v)],["出勤日数",work,(v:number)=>setWork(v)],["有給",leave,(v:number)=>setLeave(v)]].map(([label,val,set])=>(
        <div key={label as string}>
          <label className="text-xs text-slate-500 mb-1 block">{label as string}</label>
          <input type="number" value={val as number} onChange={e=>(set as (v:number)=>void)(Number(e.target.value))} className="w-full border border-slate-200 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-blue-400" />
        </div>
      ))}
      <div className="col-span-4">
        <button onClick={() => onAdd(year, month, work, leave)} className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-4 py-1.5 rounded-lg">追加・更新</button>
      </div>
    </div>
  );
}

type FieldDef = { name: string; label: string; type?: string; required?: boolean; textarea?: boolean; rows?: number; placeholder?: string; defaultValue?: string };

function ModalForm({ title, fields, onSubmit, onClose }: { title: string; fields: FieldDef[]; onSubmit: (data: Record<string, string>) => void; onClose: () => void }) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data: Record<string, string> = {};
    fields.forEach(f => { data[f.name] = fd.get(f.name) as string ?? ""; });
    onSubmit(data);
  }
  return (
    <form onSubmit={handleSubmit}>
      <h3 className="text-base font-bold text-slate-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {fields.map(f => (
          <div key={f.name}>
            <label className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</label>
            {f.textarea ? (
              <textarea name={f.name} required={f.required} rows={f.rows ?? 3} defaultValue={f.defaultValue} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-y" />
            ) : (
              <input name={f.name} type={f.type ?? "text"} required={f.required} defaultValue={f.defaultValue} placeholder={f.placeholder} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400" />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end mt-5">
        <button type="button" onClick={onClose} className="border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-sm font-medium px-4 py-2 rounded-lg">キャンセル</button>
        <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg">追加</button>
      </div>
    </form>
  );
}
