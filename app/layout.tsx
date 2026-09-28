import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "小さなアイデアを、動くものに。 — 王博のワークスタジオ",
  description: "生成AIの発展と実践。AI Agentとつくる、私のワークスタジオ。10分のインタラクティブな発表と、旧版の全資料。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
