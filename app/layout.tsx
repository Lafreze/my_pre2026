import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "画像処理から、AIとつくる毎日へ。 — 王博のワークスタジオ",
  description: "画像処理でのTransformer体験から、LLM、Agentの構成、アイデアの実現へ。モデルを巡る6章・10分のインタラクティブな発表。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
