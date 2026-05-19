import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToasterProvider } from "@/components/providers/toaster-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PlanDesign",
  description:
    "Enterprise SaaS architecture for architects, interior designers, and design studios.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <AuthSessionProvider>
          <QueryProvider>
            <ToasterProvider />
            {children}
          </QueryProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
