import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "王博のワークスタジオ — 画像処理・LLM・Agent",
  description: "画像処理でのTransformer体験から、LLM、Agentの構成、アイデアの実現へ。モデルを巡る5章・10分＋詳しい解説のインタラクティブな発表。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
