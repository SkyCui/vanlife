import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "旅居搭子 · 一起规划路上的生活",
  description: "床车与房车旅居预算、方案比较和共享规划。",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
