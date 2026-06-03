"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

export default function LoginPage() {
  const router = useRouter();
  const callbackUrl = "/dashboard";
  const { locale } = useLocale();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(t(locale, "invalidCredentials"));
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError(t(locale, "somethingWrong"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-3 inline-flex w-full justify-center">
          <span className="inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
            PlanDesign
          </span>
        </div>
        <CardTitle className="text-2xl">{t(locale, "loginTitle")}</CardTitle>
        <CardDescription>
          {t(locale, "loginDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">{t(locale, "emailAddress")}</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@studio.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t(locale, "password")}</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full rounded-2xl" disabled={pending}>
            {pending ? t(locale, "signingIn") : t(locale, "signIn")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {t(locale, "dontHaveAccount")} {" "}
          <Link
            href="/register"
            className="font-medium text-foreground hover:underline"
          >
            {t(locale, "createOne")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
