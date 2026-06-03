"use client";

import { useState, useTransition } from "react";
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
import { registerUser } from "@/actions/auth";
import { t } from "@/lib/i18n";
import { useLocale } from "@/lib/use-locale";

export default function RegisterPage() {
  const router = useRouter();
  const { locale } = useLocale();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t(locale, "passwordsNoMatch"));
      return;
    }

    startTransition(async () => {
      const result = await registerUser({ name, email, password });

      if (result.error) {
        setError(result.error);
        return;
      }

      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    });
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="mb-3 inline-flex w-full justify-center">
          <span className="inline-flex rounded-full border border-border bg-background/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-muted">
            PlanDesign
          </span>
        </div>
        <CardTitle className="text-2xl">{t(locale, "registerTitle")}</CardTitle>
        <CardDescription>
          {t(locale, "registerDesc")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">{t(locale, "fullName")}</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder={t(locale, "yourName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

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
              autoComplete="new-password"
              placeholder={t(locale, "minEight")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">{t(locale, "confirmPassword")}</Label>
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder={t(locale, "repeatPassword")}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full rounded-2xl"
            disabled={isPending}
          >
            {isPending ? t(locale, "creatingAccount") : t(locale, "createAccount")}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          {t(locale, "alreadyHaveAccount")} {" "}
          <Link
            href="/login"
            className="font-medium text-foreground hover:underline"
          >
            {t(locale, "signIn")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
