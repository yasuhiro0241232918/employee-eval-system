"use client";
import { signOut } from "next-auth/react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <Link href="/employees" className="text-base font-bold text-blue-700 tracking-tight">
        従業員データベース
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ログアウト
      </button>
    </header>
  );
}
