"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Employee = {
  id: string; employeeNo: string | null; name: string; birthDate: string | null; joinDate: string | null;
  department: string | null; position: string | null; grade: string | null;
  gradeNumber: string | null; company: string | null; address: string | null; employmentType: string | null; photo: string | null;
  paidLeaveGranted: number;
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
          {tab === 1 && <AttendanceTab employeeId={emp.id} employeeName={emp.name} initialPaidLeaveGranted={emp.paidLeaveGranted ?? 0} />}

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

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

type AttRec = {
  date: string;
  worked: boolean; absent: boolean; paidLeave: boolean;
  statutoryHoliday: boolean; nonStatutoryHoliday: boolean;
  tardy: boolean; earlyLeave: boolean;
  tardyTime: string | null; earlyLeaveTime: string | null;
  overtimeNormal: number; overtimePremium: number;
  statHolOvertimeNormal: number; statHolOvertimePremium: number;
  nonStatHolOvertimeNormal: number; nonStatHolOvertimePremium: number;
  distanceHours: number;
};

function emptyRec(ds: string): AttRec {
  return { date: ds, worked: false, absent: false, paidLeave: false, statutoryHoliday: false, nonStatutoryHoliday: false, tardy: false, earlyLeave: false, tardyTime: null, earlyLeaveTime: null, overtimeNormal: 0, overtimePremium: 0, statHolOvertimeNormal: 0, statHolOvertimePremium: 0, nonStatHolOvertimeNormal: 0, nonStatHolOvertimePremium: 0, distanceHours: 0 };
}

function timeToMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

function calcWorkHours(rec: AttRec): number | null {
  if (!rec.worked) return null;
  const startMin = rec.tardy && rec.tardyTime ? timeToMin(rec.tardyTime) : 8 * 60;
  const endMin = rec.earlyLeave && rec.earlyLeaveTime ? timeToMin(rec.earlyLeaveTime) : 17 * 60;
  if (startMin >= endMin) return 0;
  const breaks: [number, number][] = [[10*60, 10*60+15], [12*60, 13*60], [15*60, 15*60+15]];
  const breakMin = breaks.reduce((sum, [bs, be]) => sum + Math.max(0, Math.min(endMin, be) - Math.max(startMin, bs)), 0);
  return Math.max(0, (endMin - startMin - breakMin) / 60);
}

const TIME_OPTIONS: string[] = (() => {
  const opts: string[] = [];
  for (let h = 8; h <= 17; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 17 && m > 0) break;
      opts.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
    }
  }
  return opts;
})();

function TimeSelect({ value, onChange, disabled }: { value: string | null; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <select value={value ?? ""} disabled={disabled} onChange={e => onChange(e.target.value)}
      className="w-16 text-center text-xs border border-orange-200 rounded px-0.5 py-0.5 outline-none focus:border-orange-400 disabled:bg-slate-50 bg-white">
      <option value="">--:--</option>
      {TIME_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
    </select>
  );
}

function CB({ checked, onClick, color = "green", disabled = false }: { checked: boolean; onClick: () => void; color?: string; disabled?: boolean }) {
  const colors: Record<string, string> = { green: "bg-green-500 border-green-500", red: "bg-red-400 border-red-400", amber: "bg-amber-500 border-amber-500", blue: "bg-blue-500 border-blue-500", purple: "bg-purple-500 border-purple-500", orange: "bg-orange-500 border-orange-500" };
  return (
    <button onClick={disabled ? undefined : onClick} className={`w-5 h-5 rounded border-2 flex items-center justify-center mx-auto transition ${checked ? colors[color] : "border-slate-300 bg-white"} ${disabled ? "opacity-40 cursor-default" : "hover:border-slate-400 cursor-pointer"}`}>
      {checked && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
    </button>
  );
}

function NumInput({ value, onChange, disabled, step = 0.5 }: { value: number; onChange: (v: number) => void; disabled: boolean; step?: number }) {
  const [local, setLocal] = useState(value === 0 ? "" : String(value));
  useEffect(() => { setLocal(value === 0 ? "" : String(value)); }, [value]);
  return (
    <input type="number" min="0" step={step} value={local} disabled={disabled}
      onChange={e => setLocal(e.target.value)}
      onBlur={() => { const v = parseFloat(local) || 0; onChange(v); setLocal(v === 0 ? "" : String(v)); }}
      className="w-11 text-center text-xs border border-slate-200 rounded px-0.5 py-1 outline-none focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-300"
    />
  );
}

function AttendanceTab({ employeeId, employeeName, initialPaidLeaveGranted }: { employeeId: string; employeeName: string; initialPaidLeaveGranted: number }) {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [records, setRecords] = useState<Map<string, AttRec>>(new Map());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set());
  const [distanceRate, setDistanceRate] = useState(1913);
  const [paidLeaveGranted, setPaidLeaveGranted] = useState(initialPaidLeaveGranted);
  const [paidLeaveGrantedInput, setPaidLeaveGrantedInput] = useState(String(initialPaidLeaveGranted));
  const [paidLeaveGrantedLocked, setPaidLeaveGrantedLocked] = useState(true);
  const [yearlyPaidLeaveUsed, setYearlyPaidLeaveUsed] = useState(0);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.distanceAllowanceRate) setDistanceRate(Number(data.distanceAllowanceRate));
    });
  }, []);

  useEffect(() => {
    const fiscalYear = month >= 4 ? year : year - 1;
    fetch(`/api/employees/${employeeId}/attendance?fiscalYear=${fiscalYear}`)
      .then(r => r.json())
      .then(data => { if (data.paidLeaveTotal !== undefined) setYearlyPaidLeaveUsed(data.paidLeaveTotal); });
  }, [employeeId, year, month]);

  async function savePaidLeaveGranted(val: number) {
    setPaidLeaveGranted(val);
    await fetch(`/api/employees/${employeeId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paidLeaveGranted: val }) });
  }

  useEffect(() => {
    setLoading(true);
    fetch(`/api/employees/${employeeId}/attendance?year=${year}&month=${month}`)
      .then(r => r.json())
      .then((data: AttRec[]) => {
        const map = new Map<string, AttRec>();
        data.forEach(r => {
          const d = new Date(r.date);
          const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
          map.set(key, { ...r, date: key });
        });
        setRecords(map);
        setLoading(false);
        setUnlocked(new Set());
      })
      .catch(() => setLoading(false));
  }, [employeeId, year, month]);

  function ds(day: number) { return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`; }
  function getRec(day: number) { return records.get(ds(day)) ?? emptyRec(ds(day)); }
  function isLocked(day: number) { return ds(day) < todayStr && !unlocked.has(ds(day)); }

  async function saveDay(day: number, rec: AttRec) {
    const d = ds(day);
    setSaving(prev => new Set(prev).add(d));
    setRecords(prev => new Map(prev).set(d, rec));
    await fetch(`/api/employees/${employeeId}/attendance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(rec) });
    setSaving(prev => { const n = new Set(prev); n.delete(d); return n; });
  }

  function toggleBool(day: number, field: keyof AttRec) {
    if (isLocked(day)) return;
    const rec = getRec(day);
    const newVal = !(rec[field] as boolean);
    const update: Partial<AttRec> = { [field]: newVal };
    if (newVal && (field === "worked" || field === "absent" || field === "paidLeave")) {
      if (field !== "worked") update.worked = false;
      if (field !== "absent") update.absent = false;
      if (field !== "paidLeave") update.paidLeave = false;
    }
    if (!newVal && field === "tardy") update.tardyTime = null;
    if (!newVal && field === "earlyLeave") update.earlyLeaveTime = null;
    saveDay(day, { ...rec, ...update });
  }
  function updateNum(day: number, field: keyof AttRec, v: number) {
    if (isLocked(day)) return;
    saveDay(day, { ...getRec(day), [field]: v });
  }
  function updateTime(day: number, field: "tardyTime" | "earlyLeaveTime", v: string) {
    if (isLocked(day)) return;
    saveDay(day, { ...getRec(day), [field]: v || null });
  }

  const prevMonth = () => { if (month === 1) { setYear(y => y - 1); setMonth(12); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setYear(y => y + 1); setMonth(1); } else setMonth(m => m + 1); };

  function handlePrint() {
    const days = new Date(year, month, 0).getDate();
    const dowNames = ["日","月","火","水","木","金","土"];
    const rows = Array.from({ length: days }, (_, i) => {
      const day = i + 1;
      const rec = getRec(day);
      const dow = new Date(year, month - 1, day).getDay();
      const wh = calcWorkHours(rec);
      const dowColor = dow === 0 ? "#e53e3e" : dow === 6 ? "#3182ce" : "#2d3748";
      const check = (v: boolean) => v ? "✓" : "";
      return `<tr style="border-bottom:1px solid #e2e8f0">
        <td style="padding:4px 6px;font-weight:600;color:${dowColor}">${day}</td>
        <td style="padding:4px 6px;color:${dowColor}">${dowNames[dow]}</td>
        <td style="padding:4px 6px;text-align:center">${check(rec.worked)}</td>
        <td style="padding:4px 6px;text-align:center">${check(rec.absent)}</td>
        <td style="padding:4px 6px;text-align:center">${check(rec.paidLeave)}</td>
        <td style="padding:4px 6px;text-align:center">${rec.tardy ? (rec.tardyTime ?? "✓") : ""}</td>
        <td style="padding:4px 6px;text-align:center">${rec.earlyLeave ? (rec.earlyLeaveTime ?? "✓") : ""}</td>
        <td style="padding:4px 6px;text-align:center">${wh !== null ? wh.toFixed(1) : ""}</td>
        <td style="padding:4px 6px;text-align:center">${check(rec.statutoryHoliday)}</td>
        <td style="padding:4px 6px;text-align:center">${check(rec.nonStatutoryHoliday)}</td>
        <td style="padding:4px 6px;text-align:center">${rec.overtimeNormal || ""}</td>
        <td style="padding:4px 6px;text-align:center">${rec.overtimePremium || ""}</td>
        <td style="padding:4px 6px;text-align:center">${rec.statHolOvertimeNormal || ""}</td>
        <td style="padding:4px 6px;text-align:center">${rec.statHolOvertimePremium || ""}</td>
        <td style="padding:4px 6px;text-align:center">${rec.nonStatHolOvertimeNormal || ""}</td>
        <td style="padding:4px 6px;text-align:center">${rec.nonStatHolOvertimePremium || ""}</td>
        <td style="padding:4px 6px;text-align:center">${rec.distanceHours || ""}</td>
      </tr>`;
    }).join("");

    const allR = Array.from({ length: days }, (_, i) => getRec(i + 1));
    const t = {
      worked: allR.filter(r => r.worked).length,
      absent: allR.filter(r => r.absent).length,
      paidLeave: allR.filter(r => r.paidLeave).length,
      tardy: allR.filter(r => r.tardy).length,
      earlyLeave: allR.filter(r => r.earlyLeave).length,
      statHol: allR.filter(r => r.statutoryHoliday).length,
      nonStatHol: allR.filter(r => r.nonStatutoryHoliday).length,
      otN: allR.reduce((s, r) => s + r.overtimeNormal, 0),
      otP: allR.reduce((s, r) => s + r.overtimePremium, 0),
      statN: allR.reduce((s, r) => s + r.statHolOvertimeNormal, 0),
      statP: allR.reduce((s, r) => s + r.statHolOvertimePremium, 0),
      nonN: allR.reduce((s, r) => s + r.nonStatHolOvertimeNormal, 0),
      nonP: allR.reduce((s, r) => s + r.nonStatHolOvertimePremium, 0),
      dist: allR.reduce((s, r) => s + r.distanceHours, 0),
    };

    const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="UTF-8">
<title>${employeeName} 勤怠表 ${year}年${month}月</title>
<style>
  body { font-family: "Hiragino Sans","Yu Gothic",sans-serif; font-size:11px; color:#2d3748; margin:20px; }
  h1 { font-size:15px; margin:0 0 4px; }
  .sub { color:#718096; font-size:11px; margin:0 0 12px; }
  .totals { display:grid; grid-template-columns:repeat(7,1fr); gap:6px; margin-bottom:14px; }
  .tot-box { border:1px solid #e2e8f0; border-radius:4px; padding:5px; text-align:center; }
  .tot-val { font-size:14px; font-weight:700; }
  .tot-lbl { font-size:9px; color:#718096; }
  table { width:100%; border-collapse:collapse; font-size:10px; }
  th { background:#f7fafc; padding:5px 6px; text-align:center; border-bottom:2px solid #cbd5e0; white-space:nowrap; }
  @media print { body { margin:10px; } }
</style></head><body>
<h1>${employeeName}　勤怠表</h1>
<p class="sub">${year}年 ${month}月　印刷日：${new Date().toLocaleDateString("ja-JP")}</p>
<div class="totals">
  <div class="tot-box"><div class="tot-val" style="color:#38a169">${t.worked}</div><div class="tot-lbl">労働日数</div></div>
  <div class="tot-box"><div class="tot-val" style="color:#e53e3e">${t.absent}</div><div class="tot-lbl">欠勤日数</div></div>
  <div class="tot-box"><div class="tot-val" style="color:#d69e2e">${t.paidLeave}</div><div class="tot-lbl">有給日数</div></div>
  <div class="tot-box"><div class="tot-val" style="color:#dd6b20">${t.tardy}</div><div class="tot-lbl">遅刻回数</div></div>
  <div class="tot-box"><div class="tot-val" style="color:#dd6b20">${t.earlyLeave}</div><div class="tot-lbl">早退回数</div></div>
  <div class="tot-box"><div class="tot-val" style="color:#3182ce">${t.statHol}</div><div class="tot-lbl">法定休出</div></div>
  <div class="tot-box"><div class="tot-val" style="color:#805ad5">${t.nonStatHol}</div><div class="tot-lbl">法外休出</div></div>
  <div class="tot-box"><div class="tot-val">${t.otN.toFixed(1)}</div><div class="tot-lbl">普通残業h</div></div>
  <div class="tot-box"><div class="tot-val">${t.otP.toFixed(1)}</div><div class="tot-lbl">割増残業h</div></div>
  <div class="tot-box"><div class="tot-val">${t.statN.toFixed(1)}</div><div class="tot-lbl">法定普残h</div></div>
  <div class="tot-box"><div class="tot-val">${t.statP.toFixed(1)}</div><div class="tot-lbl">法定割残h</div></div>
  <div class="tot-box"><div class="tot-val">${t.nonN.toFixed(1)}</div><div class="tot-lbl">法外普残h</div></div>
  <div class="tot-box"><div class="tot-val">${t.nonP.toFixed(1)}</div><div class="tot-lbl">法外割残h</div></div>
  <div class="tot-box"><div class="tot-val" style="color:#2c7a7b">${t.dist.toFixed(1)}</div><div class="tot-lbl">遠距離h</div></div>
</div>
<table>
<thead><tr>
  <th>日</th><th>曜</th><th>出勤</th><th>欠勤</th><th>有給</th>
  <th>遅刻時刻</th><th>早退時刻</th><th>実労h</th>
  <th>法定休出</th><th>法外休出</th>
  <th>普残h</th><th>割残h</th><th>法定普残h</th><th>法定割残h</th><th>法外普残h</th><th>法外割残h</th><th>遠距h</th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
</body></html>`;

    const win = window.open("", "_blank");
    if (win) { win.document.write(html); win.document.close(); win.focus(); win.print(); }
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const allRecs = Array.from({ length: daysInMonth }, (_, i) => getRec(i + 1));
  const tot = {
    worked: allRecs.filter(r => r.worked).length,
    absent: allRecs.filter(r => r.absent).length,
    paidLeave: allRecs.filter(r => r.paidLeave).length,
    statHol: allRecs.filter(r => r.statutoryHoliday).length,
    nonStatHol: allRecs.filter(r => r.nonStatutoryHoliday).length,
    otN: allRecs.reduce((s, r) => s + r.overtimeNormal, 0),
    otP: allRecs.reduce((s, r) => s + r.overtimePremium, 0),
    statN: allRecs.reduce((s, r) => s + r.statHolOvertimeNormal, 0),
    statP: allRecs.reduce((s, r) => s + r.statHolOvertimePremium, 0),
    nonN: allRecs.reduce((s, r) => s + r.nonStatHolOvertimeNormal, 0),
    nonP: allRecs.reduce((s, r) => s + r.nonStatHolOvertimePremium, 0),
    dist: allRecs.reduce((s, r) => s + r.distanceHours, 0),
  };

  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"16px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"8px" }}>
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>
          <span className="text-base font-bold text-slate-800" style={{ minWidth:"110px", textAlign:"center" }}>{year}年 {month}月</span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg></button>
        </div>
        <button onClick={handlePrint} style={{ display:"flex", alignItems:"center", gap:"6px", padding:"6px 12px", borderRadius:"8px", background:"#334155", color:"white", fontSize:"12px", fontWeight:600, border:"none", cursor:"pointer" }}
          onMouseEnter={e => (e.currentTarget.style.background="#1e293b")}
          onMouseLeave={e => (e.currentTarget.style.background="#334155")}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          印刷
        </button>
      </div>

      {/* 今年度付与日数 */}
      <div className="flex items-center gap-3 mb-4 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
        <span className="text-sm text-slate-600 whitespace-nowrap">今年度付与日数</span>
        <input
          type="number" min="0" step="1"
          value={paidLeaveGrantedInput}
          disabled={paidLeaveGrantedLocked}
          onChange={e => setPaidLeaveGrantedInput(e.target.value)}
          onBlur={() => { const v = parseInt(paidLeaveGrantedInput) || 0; savePaidLeaveGranted(v); setPaidLeaveGrantedInput(String(v)); setPaidLeaveGrantedLocked(true); }}
          className={`w-16 text-center border rounded-lg px-2 py-1 text-sm outline-none bg-white transition ${paidLeaveGrantedLocked ? "border-amber-100 text-slate-400 cursor-not-allowed" : "border-amber-400 text-slate-800 focus:border-amber-500"}`}
        />
        <span className="text-sm text-slate-500">日</span>
        <button
          onClick={() => { setPaidLeaveGrantedLocked(l => !l); }}
          title={paidLeaveGrantedLocked ? "クリックして編集" : "ロック"}
          className={`p-1.5 rounded-lg transition ${paidLeaveGrantedLocked ? "text-slate-400 hover:text-amber-600 hover:bg-amber-100" : "text-amber-600 bg-amber-100 hover:bg-amber-200"}`}
        >
          {paidLeaveGrantedLocked ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>
          )}
        </button>
        <span className="mx-2 text-slate-300">|</span>
        <span className="text-sm text-slate-500">当年取得</span>
        <span className="text-sm font-bold text-amber-600">{yearlyPaidLeaveUsed}日</span>
        <span className="mx-2 text-slate-300">|</span>
        <span className="text-sm text-slate-500">残数</span>
        <span className={`text-lg font-bold ${paidLeaveGranted - yearlyPaidLeaveUsed <= 0 ? "text-red-500" : "text-green-600"}`}>
          {paidLeaveGranted - yearlyPaidLeaveUsed}日
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-5">
        {([["労働日数", tot.worked, "text-green-600"], ["欠勤日数", tot.absent, "text-red-500"], ["有給日数", tot.paidLeave, "text-amber-600"], ["法定休出", tot.statHol, "text-blue-600"], ["法外休出", tot.nonStatHol, "text-purple-600"], ["普通残業h", tot.otN.toFixed(1), "text-slate-700"], ["割増残業h", tot.otP.toFixed(1), "text-slate-700"], ["遠距離h", tot.dist.toFixed(2), "text-teal-600"], ["遠距離手当", `¥${Math.round(tot.dist * distanceRate).toLocaleString()}`, "text-teal-700"]] as [string, string|number, string][]).map(([label, val, cls]) => (
          <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
            <p className={`text-lg font-bold ${cls}`}>{val}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {loading ? <p className="text-sm text-slate-400">読み込み中...</p> : (
        <div className="overflow-x-auto -mx-2 px-2">
          <table className="text-xs border-collapse" style={{ minWidth: "780px" }}>
            <thead>
              <tr className="border-b-2 border-slate-200 text-center">
                <th className="text-left pb-1.5 pr-2 text-slate-500 font-medium">日</th>
                <th className="text-left pb-1.5 pr-2 text-slate-500 font-medium">曜</th>
                <th className="pb-1.5 px-1 text-green-600 font-medium" title="出勤">出勤</th>
                <th className="pb-1.5 px-1 text-red-500 font-medium" title="欠勤">欠勤</th>
                <th className="pb-1.5 px-1 text-amber-600 font-medium" title="有給">有給</th>
                <th className="pb-1.5 px-1 text-orange-500 font-medium leading-tight" title="遅刻（チェックで時刻入力）">遅刻</th>
                <th className="pb-1.5 px-1 text-orange-500 font-medium leading-tight" title="早退（チェックで時刻入力）">早退</th>
                <th className="pb-1.5 px-1 text-slate-600 font-medium leading-tight" title="実労働時間（自動計算）">実労<br/>時間</th>
                <th className="pb-1.5 px-1 text-blue-600 font-medium leading-tight" title="法定休日出勤">法定<br/>休出</th>
                <th className="pb-1.5 px-1 text-purple-600 font-medium leading-tight" title="法定外休日出勤">法外<br/>休出</th>
                <th className="pb-1.5 px-1 text-slate-500 font-medium leading-tight" title="普通残業（時間）">普残<br/>h</th>
                <th className="pb-1.5 px-1 text-slate-500 font-medium leading-tight" title="割増残業（時間）">割残<br/>h</th>
                <th className="pb-1.5 px-1 text-blue-400 font-medium leading-tight" title="法定休日 普通残業">法定<br/>普残h</th>
                <th className="pb-1.5 px-1 text-blue-400 font-medium leading-tight" title="法定休日 割増残業">法定<br/>割残h</th>
                <th className="pb-1.5 px-1 text-purple-400 font-medium leading-tight" title="法定外休日 普通残業">法外<br/>普残h</th>
                <th className="pb-1.5 px-1 text-purple-400 font-medium leading-tight" title="法定外休日 割増残業">法外<br/>割残h</th>
                <th className="pb-1.5 px-1 text-teal-600 font-medium leading-tight" title="遠距離手当用時間">遠距<br/>h</th>
                <th className="pb-1.5 px-1 text-teal-700 font-medium leading-tight" title="遠距離手当（自動計算）">遠距<br/>手当</th>
                <th className="pb-1.5 px-1 w-6"></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                const dow = new Date(year, month - 1, day).getDay();
                const rec = getRec(day);
                const locked = isLocked(day);
                const d = ds(day);
                const isSun = dow === 0, isSat = dow === 6;
                const workHours = calcWorkHours(rec);
                return (
                  <tr key={day} className={`border-b border-slate-100 transition ${locked ? "bg-slate-50" : saving.has(d) ? "bg-blue-50/30" : "hover:bg-slate-50"}`}>
                    <td className={`py-1.5 pr-2 font-semibold ${isSun ? "text-red-500" : isSat ? "text-blue-500" : "text-slate-800"} ${locked ? "opacity-50" : ""}`}>{day}</td>
                    <td className={`py-1.5 pr-2 ${isSun ? "text-red-400" : isSat ? "text-blue-400" : "text-slate-500"} ${locked ? "opacity-50" : ""}`}>{DOW[dow]}</td>
                    <td className="py-1.5 px-1"><CB checked={rec.worked} onClick={() => toggleBool(day, "worked")} color="green" disabled={locked} /></td>
                    <td className="py-1.5 px-1"><CB checked={rec.absent} onClick={() => toggleBool(day, "absent")} color="red" disabled={locked} /></td>
                    <td className="py-1.5 px-1"><CB checked={rec.paidLeave} onClick={() => toggleBool(day, "paidLeave")} color="amber" disabled={locked} /></td>
                    <td className="py-1 px-1">
                      <div className="flex flex-col items-center gap-0.5">
                        <CB checked={rec.tardy} onClick={() => toggleBool(day, "tardy")} color="orange" disabled={locked || !rec.worked} />
                        {rec.tardy && (
                          <TimeSelect value={rec.tardyTime} onChange={v => updateTime(day, "tardyTime", v)} disabled={locked} />
                        )}
                      </div>
                    </td>
                    <td className="py-1 px-1">
                      <div className="flex flex-col items-center gap-0.5">
                        <CB checked={rec.earlyLeave} onClick={() => toggleBool(day, "earlyLeave")} color="orange" disabled={locked || !rec.worked} />
                        {rec.earlyLeave && (
                          <TimeSelect value={rec.earlyLeaveTime} onChange={v => updateTime(day, "earlyLeaveTime", v)} disabled={locked} />
                        )}
                      </div>
                    </td>
                    <td className="py-1.5 px-1 text-center font-medium text-slate-700">
                      {workHours !== null ? (
                        <span className={workHours < 7.5 ? "text-orange-500" : "text-slate-700"}>{workHours.toFixed(1)}h</span>
                      ) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-1.5 px-1"><CB checked={rec.statutoryHoliday} onClick={() => toggleBool(day, "statutoryHoliday")} color="blue" disabled={locked} /></td>
                    <td className="py-1.5 px-1"><CB checked={rec.nonStatutoryHoliday} onClick={() => toggleBool(day, "nonStatutoryHoliday")} color="purple" disabled={locked} /></td>
                    <td className="py-1.5 px-1"><NumInput value={rec.overtimeNormal} onChange={v => updateNum(day, "overtimeNormal", v)} disabled={locked} /></td>
                    <td className="py-1.5 px-1"><NumInput value={rec.overtimePremium} onChange={v => updateNum(day, "overtimePremium", v)} disabled={locked} /></td>
                    <td className="py-1.5 px-1"><NumInput value={rec.statHolOvertimeNormal} onChange={v => updateNum(day, "statHolOvertimeNormal", v)} disabled={locked} /></td>
                    <td className="py-1.5 px-1"><NumInput value={rec.statHolOvertimePremium} onChange={v => updateNum(day, "statHolOvertimePremium", v)} disabled={locked} /></td>
                    <td className="py-1.5 px-1"><NumInput value={rec.nonStatHolOvertimeNormal} onChange={v => updateNum(day, "nonStatHolOvertimeNormal", v)} disabled={locked} /></td>
                    <td className="py-1.5 px-1"><NumInput value={rec.nonStatHolOvertimePremium} onChange={v => updateNum(day, "nonStatHolOvertimePremium", v)} disabled={locked} /></td>
                    <td className="py-1.5 px-1"><NumInput value={rec.distanceHours} onChange={v => updateNum(day, "distanceHours", v)} disabled={locked} step={0.25} /></td>
                    <td className="py-1.5 px-1 text-center text-xs font-medium text-teal-700">
                      {rec.distanceHours > 0 ? `¥${Math.round(rec.distanceHours * distanceRate).toLocaleString()}` : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-1.5 px-1 text-center">
                      {d < todayStr && (
                        locked
                          ? <button onClick={() => setUnlocked(prev => { const n = new Set(prev); n.add(d); return n; })} title="ロック解除" className="text-slate-300 hover:text-amber-500 transition"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></button>
                          : <button onClick={() => setUnlocked(prev => { const n = new Set(prev); n.delete(d); return n; })} title="再ロック" className="text-amber-500 hover:text-slate-400 transition"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-3">過去の日付は自動ロック。南京錠アイコンをクリックして一時的に解除できます。</p>
    </div>
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
