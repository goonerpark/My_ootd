import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

export const metadata: Metadata = {
  title: "my_ootd",
  description: "날씨/기온 기반 옷차림 추천 서비스",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/my-ootd-logo.svg", type: "image/svg+xml" }
    ],
    shortcut: "/favicon.svg",
    apple: "/my-ootd-logo.svg"
  }
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
