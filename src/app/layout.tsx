import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "社員評価管理システム",
  description: "社員評価管理システム",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-100 min-h-screen">{children}</body>
    </html>
  );
}
