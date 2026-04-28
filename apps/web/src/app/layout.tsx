import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sploy — Developer productivity, reimagined",
  description:
    "A fast, minimal command-driven workspace for builders. Keyboard-first workflows, extensions, and deep OS integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}
