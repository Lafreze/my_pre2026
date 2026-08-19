import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "127.0.0.1:5173";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const title = "生成AIは、「答える」から「動く」へ。";
  const description = "GPTの誕生からAgent、MCP、Vibe Codingまで。生成AIの9年間を能力の積み上がりとして読み解く社内発表資料。";
  return {
    title,
    description,
    icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
    openGraph: { title, description, type: "website", images: [{ url: `${origin}/og.png`, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title, description, images: [`${origin}/og.png`] },
  };
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
