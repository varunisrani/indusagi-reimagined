import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./header";
import { Footer } from "./footer";
import { ThemeInit } from "./theme-init";
import { getSiteOrigin } from "./site-origin";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteOrigin()),
  title: "IndusAGI — The open-source AI agent stack",
  description: "A terminal-first coding agent and the framework underneath it. TypeScript, Python, and Rust.",
  alternates: { canonical: "/" },
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
    <html lang="en" suppressHydrationWarning>
      <head><ThemeInit /></head>
      <body className="antialiased"><Header/>{children}<Footer/></body>
    </html>
  );
}
