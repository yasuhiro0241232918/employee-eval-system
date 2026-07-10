import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "従業員データベース",
  description: "従業員データベース",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-slate-100 min-h-screen">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
