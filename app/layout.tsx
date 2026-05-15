import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "巽風 AI 會議室",
  description: "ChatGPT 風羿分身、Gemini 風羿分身、DeepSeek 攻防，最後由 ChatGPT 統整。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
