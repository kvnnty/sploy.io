import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { Geist_Mono, Inter } from "next/font/google";
import { Toaster } from "sonner";
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
  title: "Sploy — AI Analyst for Growth Teams",
  description:
    "Stop waiting on dashboards and backlogged analysts. Sploy gives you the why behind every metric and the exact next move in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <body
          className={`${inter.variable} ${geistMono.variable} min-h-screen bg-background font-sans text-foreground overflow-x-hidden`}
        >
          <Toaster theme="dark" />
          {children}
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
