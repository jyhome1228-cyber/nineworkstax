import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NINEWORKS TAX",
  description: "세금계산서 기반 거래·거래처·문서 통합 관리 시스템",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
