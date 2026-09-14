import "./globals.css";
import { Header } from "./header";
import { Footer } from "./footer";
import { ThemeInit } from "./theme-init";
import { homepageMetadata } from "./seo";

export const metadata = homepageMetadata;

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
