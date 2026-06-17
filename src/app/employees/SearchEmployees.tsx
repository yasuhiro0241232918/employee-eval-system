"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function SearchEmployees({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  return (
    <input
      type="text"
      defaultValue={defaultValue}
      placeholder="氏名・部署で検索..."
      className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 bg-white"
      onChange={(e) => {
        const q = e.target.value;
        startTransition(() => {
          router.push(q ? `/employees?q=${encodeURIComponent(q)}` : "/employees");
        });
      }}
    />
  );
}
