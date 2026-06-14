import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Rubik, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AuthSessionProvider } from "@/components/providers/session-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ToasterProvider } from "@/components/providers/toaster-provider";
import { LOCALE_COOKIE, localeDir, normalizeLocale } from "@/lib/i18n";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin", "hebrew"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PlanDesign",
  description:
    "Enterprise SaaS architecture for architects, interior designers, and design studios.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value ?? null);

  return (
    <html
      lang={locale}
      dir={localeDir(locale)}
      className={`${rubik.variable} ${geistMono.variable} h-full antialiased`}
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
