"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const COMPANIES = ["鈴木総業", "ミヤツリサイクル", "ガレージファクトリー", "ENEOSキタカタSS"];
const DEPARTMENTS = ["工事部", "砕石事業部", "営業部", "技術管理部", "総務部"];
const POSITIONS = ["会長", "相談役", "顧問", "代表取締役社長", "取締役", "部長", "課長", "職長", "主任", "店長", "工場長"];
const EMPLOYMENT_TYPES = ["正社員", "期間社員", "パート・アルバイト"];
const GRADES = ["1等級", "2等級", "3等級", "4等級", "5等級", "6等級", "7等級"];
const GRADE_NUMBERS = Array.from({ length: 30 }, (_, i) => String(i + 1));
const AIZU_MUNICIPALITIES = [
  "会津若松市", "喜多方市",
  "会津坂下町", "湯川村", "柳津町", "三島町", "金山町", "昭和村", "会津美里町",
  "西会津町", "磐梯町", "猪苗代町", "北塩原村",
  "下郷町", "檜枝岐村", "只見町", "南会津町",
];

const SEL_CLASS = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white";
const INPUT_CLASS = "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100";

type Props = {
  employee?: {
    id: string; employeeNo: string | null; name: string; birthDate: string | null; joinDate: string | null;
    department: string | null; position: string | null;
    grade: string | null; gradeNumber: string | null; company: string | null; address: string | null;
    employmentType: string | null; photo: string | null;
  };
};

export default function EmployeeForm({ employee }: Props) {
  const router = useRouter();
  const isEdit = !!employee;
  const [photo, setPhoto] = useState<string | null>(employee?.photo ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const MAX = 200;
        let w = img.width, h = img.height;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        setPhoto(canvas.toDataURL("image/jpeg", 0.75));
      };
      img.onerror = () => setPhoto(src);
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = {
      name: fd.get("name") as string,
      birthDate: fd.get("birthDate") || null,
      joinDate: fd.get("joinDate") || null,
      department: fd.get("department") || null,
      position: fd.get("position") || null,
      employeeNo: fd.get("employeeNo") || null,
      grade: fd.get("grade") || null,
      gradeNumber: fd.get("gradeNumber") || null,
      company: fd.get("company") || null,
      address: fd.get("address") || null,
      employmentType: fd.get("employmentType") || null,
      photo,
    };
    const url = isEdit ? `/api/employees/${employee.id}` : "/api/employees";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    setLoading(false);
    if (res.ok) {
      const data = await res.json() as { id: string };
      router.push(`/employees/${isEdit ? employee.id : data.id}`);
      router.refresh();
    } else {
      setError("保存に失敗しました");
    }
  }

  const selectField = (label: string, name: string, options: string[], value: string | null) => (
    <div key={name}>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select name={name} defaultValue={value ?? ""} className={SEL_CLASS}>
        <option value="">選択してください</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm p-8">
      <div className="flex items-center gap-3 mb-6">
        <Link href={isEdit ? `/employees/${employee.id}` : "/employees"} className="text-slate-400 hover:text-slate-600">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
        </Link>
        <h2 className="text-lg font-bold text-slate-800">{isEdit ? "社員編集" : "社員追加"}</h2>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Photo */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-100">
          {photo ? (
            <img src={photo} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-blue-100" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center border-2 border-blue-100">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </div>
          )}
          <div>
            <button type="button" onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium px-3 py-1.5 rounded-lg transition">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              写真をアップロード
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <p className="text-xs text-slate-400 mt-1">JPG/PNG推奨（自動圧縮）</p>
          </div>
        </div>

        {/* Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">社員No.</label>
            <input name="employeeNo" type="text" defaultValue={employee?.employeeNo ?? ""} placeholder="001" className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">氏名 *</label>
            <input name="name" type="text" required defaultValue={employee?.name ?? ""} placeholder="山田 太郎" className={INPUT_CLASS} />
          </div>

          <div className="col-span-2">
            {selectField("所属会社", "company", COMPANIES, employee?.company ?? null)}
          </div>
          {selectField("所属部", "department", DEPARTMENTS, employee?.department ?? null)}
          {selectField("役職", "position", POSITIONS, employee?.position ?? null)}
          {selectField("雇用形態", "employmentType", EMPLOYMENT_TYPES, employee?.employmentType ?? null)}

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">生年月日</label>
            <input name="birthDate" type="date" defaultValue={employee?.birthDate?.slice(0, 10) ?? ""} className={INPUT_CLASS} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">入社日</label>
            <input name="joinDate" type="date" defaultValue={employee?.joinDate?.slice(0, 10) ?? ""} className={INPUT_CLASS} />
          </div>
          {selectField("等級", "grade", GRADES, employee?.grade ?? null)}
          {selectField("号数", "gradeNumber", GRADE_NUMBERS, employee?.gradeNumber ?? null)}

          <div className="col-span-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">住所（市町村）</label>
            <select name="address" defaultValue={employee?.address ?? ""} className={SEL_CLASS}>
              <option value="">選択してください</option>
              {AIZU_MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={loading} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium px-5 py-2 rounded-lg transition disabled:opacity-50">
            {loading ? "保存中..." : "保存"}
          </button>
          <Link href={isEdit ? `/employees/${employee.id}` : "/employees"} className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium px-5 py-2 rounded-lg transition">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
