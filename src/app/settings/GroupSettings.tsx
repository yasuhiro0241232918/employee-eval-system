"use client";
import { useState, useEffect } from "react";

type Employee = { id: string; name: string; deletedAt: string | null };
type Member = { id: string; employeeId: string; order: number; employee: Employee };
type Group = { id: string; name: string; order: number; members: Member[] };

export default function GroupSettings({ allEmployees }: { allEmployees: Employee[] }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [distanceRate, setDistanceRate] = useState("1913");
  const [rateSaved, setRateSaved] = useState(false);

  useEffect(() => {
    fetch("/api/groups").then(r => r.json()).then(data => { setGroups(data); setLoading(false); });
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.distanceAllowanceRate) setDistanceRate(data.distanceAllowanceRate);
    });
  }, []);

  async function saveRate() {
    await fetch("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ distanceAllowanceRate: distanceRate }) });
    setRateSaved(true);
    setTimeout(() => setRateSaved(false), 2000);
  }

  async function createGroup() {
    if (!newGroupName.trim()) return;
    const res = await fetch("/api/groups", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newGroupName.trim() }) });
    const group = await res.json();
    setGroups(prev => [...prev, { ...group, members: [] }]);
    setNewGroupName("");
  }

  async function renameGroup(id: string) {
    if (!editingName.trim()) return;
    await fetch(`/api/groups/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: editingName.trim() }) });
    setGroups(prev => prev.map(g => g.id === id ? { ...g, name: editingName.trim() } : g));
    setEditingId(null);
  }

  async function deleteGroup(id: string) {
    if (!confirm("このグループを削除しますか？（社員データは削除されません）")) return;
    await fetch(`/api/groups/${id}`, { method: "DELETE" });
    setGroups(prev => prev.filter(g => g.id !== id));
  }

  async function addMember(groupId: string, employeeId: string) {
    const res = await fetch(`/api/groups/${groupId}/members`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ employeeId }) });
    const member = await res.json();
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: [...g.members, member] } : g));
    setAddingTo(null);
  }

  async function removeMember(groupId: string, employeeId: string) {
    await fetch(`/api/groups/${groupId}/members/${employeeId}`, { method: "DELETE" });
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: g.members.filter(m => m.employeeId !== employeeId) } : g));
  }

  async function moveGroup(index: number, dir: -1 | 1) {
    const newGroups = [...groups];
    const target = index + dir;
    if (target < 0 || target >= newGroups.length) return;
    [newGroups[index], newGroups[target]] = [newGroups[target], newGroups[index]];
    const reordered = newGroups.map((g, i) => ({ ...g, order: i }));
    setGroups(reordered);
    await fetch("/api/groups", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reordered.map(g => ({ id: g.id, order: g.order }))) });
  }

  async function moveMember(groupId: string, index: number, dir: -1 | 1) {
    const group = groups.find(g => g.id === groupId);
    if (!group) return;
    const newMembers = [...group.members];
    const target = index + dir;
    if (target < 0 || target >= newMembers.length) return;
    [newMembers[index], newMembers[target]] = [newMembers[target], newMembers[index]];
    const reordered = newMembers.map((m, i) => ({ ...m, order: i }));
    setGroups(prev => prev.map(g => g.id === groupId ? { ...g, members: reordered } : g));
    await fetch(`/api/groups/${groupId}/members`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reordered.map(m => ({ id: m.id, order: m.order }))) });
  }

  const activeEmployees = allEmployees.filter(e => !e.deletedAt);

  if (loading) return <p className="text-sm text-slate-400">読み込み中...</p>;

  return (
    <div className="max-w-xl">
      {/* 手当設定 */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <h2 className="text-sm font-bold text-slate-700 mb-3">手当設定</h2>
        <div className="flex items-center gap-3">
          <label className="text-sm text-slate-600 whitespace-nowrap">遠距離手当 単価（円/h）</label>
          <input
            type="number" min="0" step="1"
            value={distanceRate}
            onChange={e => setDistanceRate(e.target.value)}
            className="w-28 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-blue-400 text-right"
          />
          <span className="text-sm text-slate-500">円 / 時間</span>
          <button onClick={saveRate} className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition">
            {rateSaved ? "保存済 ✓" : "保存"}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2">計算式：遠距離手当用時間 × 単価 = 遠距離手当</p>
      </div>

      {/* グループ追加 */}
      <div className="flex gap-2 mb-6">
        <input
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          onKeyDown={e => e.key === "Enter" && createGroup()}
          placeholder="新しいグループ名"
          className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
        />
        <button onClick={createGroup} className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition">
          追加
        </button>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-slate-400">グループがありません。追加してください。</p>
      )}

      <div className="space-y-4">
        {groups.map((group, gi) => {
          const memberIds = new Set(group.members.map(m => m.employeeId));
          const availableEmployees = activeEmployees.filter(e => !memberIds.has(e.id));

          return (
            <div key={group.id} className="border border-slate-200 rounded-xl overflow-hidden">
              {/* グループヘッダー */}
              <div className="flex items-center gap-2 bg-slate-50 px-4 py-3 border-b border-slate-200">
                {editingId === group.id ? (
                  <>
                    <input
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") renameGroup(group.id); if (e.key === "Escape") setEditingId(null); }}
                      className="flex-1 border border-blue-300 rounded px-2 py-1 text-sm outline-none"
                      autoFocus
                    />
                    <button onClick={() => renameGroup(group.id)} className="text-xs text-blue-600 font-medium px-2 py-1 hover:bg-blue-50 rounded">保存</button>
                    <button onClick={() => setEditingId(null)} className="text-xs text-slate-400 px-2 py-1 hover:bg-slate-100 rounded">キャンセル</button>
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-slate-800 flex-1">{group.name}</span>
                    <button onClick={() => { setEditingId(group.id); setEditingName(group.name); }} className="text-xs text-slate-400 hover:text-slate-600 px-2 py-1 rounded hover:bg-slate-100" title="名前変更">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => moveGroup(gi, -1)} disabled={gi === 0} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 p-1 rounded hover:bg-slate-100">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button onClick={() => moveGroup(gi, 1)} disabled={gi === groups.length - 1} className="text-slate-400 hover:text-slate-600 disabled:opacity-30 p-1 rounded hover:bg-slate-100">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button onClick={() => deleteGroup(group.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" title="グループ削除">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                    </button>
                  </>
                )}
              </div>

              {/* メンバーリスト */}
              <div className="divide-y divide-slate-50">
                {group.members.map((member, mi) => (
                  <div key={member.id} className="flex items-center gap-2 px-4 py-2.5 hover:bg-slate-50">
                    <span className="text-sm text-slate-700 flex-1">{member.employee.name}</span>
                    <button onClick={() => moveMember(group.id, mi, -1)} disabled={mi === 0} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 p-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                    </button>
                    <button onClick={() => moveMember(group.id, mi, 1)} disabled={mi === group.members.length - 1} className="text-slate-300 hover:text-slate-500 disabled:opacity-30 p-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <button onClick={() => removeMember(group.id, member.employeeId)} className="text-red-300 hover:text-red-500 p-0.5">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                  </div>
                ))}

                {/* 社員追加 */}
                <div className="px-4 py-2.5">
                  {addingTo === group.id ? (
                    <div className="flex gap-2 items-center">
                      <select
                        defaultValue=""
                        onChange={e => { if (e.target.value) addMember(group.id, e.target.value); }}
                        className="flex-1 border border-slate-200 rounded px-2 py-1.5 text-sm outline-none focus:border-blue-400 bg-white"
                        autoFocus
                      >
                        <option value="">社員を選択...</option>
                        {availableEmployees.sort((a, b) => a.name.localeCompare(b.name, "ja")).map(e => (
                          <option key={e.id} value={e.id}>{e.name}</option>
                        ))}
                      </select>
                      <button onClick={() => setAddingTo(null)} className="text-xs text-slate-400 hover:text-slate-600">キャンセル</button>
                    </div>
                  ) : (
                    <button onClick={() => setAddingTo(group.id)} className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 font-medium">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      社員を追加
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
