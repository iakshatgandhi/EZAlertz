"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/apiClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { RedirectIfAuth } from "@/components/auth/RequireAuth";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export default function RegisterPage() {
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [whatsappPhone, setWhatsappPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await register(email, password, whatsappPhone || undefined);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RedirectIfAuth>
      <div className="flex min-h-screen">
        <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-border bg-surface-raised p-12 lg:flex">
          <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
          <div className="relative flex items-center justify-between">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white shadow-glow">
              EZ
            </div>
            <ThemeToggle />
          </div>
          <div className="relative space-y-6">
            <h2 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
              Start monitoring<br />
              <span className="bg-gradient-to-r from-brand-600 to-emerald-500 bg-clip-text text-transparent dark:from-brand-400 dark:to-emerald-300">
                in minutes
              </span>
            </h2>
            <ul className="space-y-3 text-sm text-muted">
              <li className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-xs text-brand-600 dark:text-brand-400">✓</span>
                Live NSE & BSE price feeds
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-xs text-brand-600 dark:text-brand-400">✓</span>
                WhatsApp alerts on trigger
              </li>
              <li className="flex items-center gap-2.5">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20 text-xs text-brand-600 dark:text-brand-400">✓</span>
                24-hour trigger history
              </li>
            </ul>
          </div>
          <p className="relative text-xs text-faint">Free for personal use</p>
        </div>

        <main className="relative flex flex-1 items-center justify-center px-6 py-12">
          <div className="absolute right-6 top-6 lg:hidden">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-md animate-slide-up">
            <div className="mb-8 lg:hidden">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-lg font-bold text-white shadow-glow">
                EZ
              </div>
            </div>

            <div className="mb-8">
              <h1 className="text-2xl font-bold text-foreground">Create account</h1>
              <p className="mt-1.5 text-sm text-muted">Set up price alerts for Indian stocks</p>
            </div>

            <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-muted">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-muted">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
                <p className="mt-1.5 text-xs text-faint">Minimum 8 characters</p>
              </div>
              <div>
                <label htmlFor="whatsapp" className="mb-2 block text-sm font-medium text-muted">
                  WhatsApp number
                  <span className="ml-1 font-normal text-faint">(optional)</span>
                </label>
                <input
                  id="whatsapp"
                  type="tel"
                  placeholder="919876543210"
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  className="input-field"
                />
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting} className="btn-primary w-full !py-3">
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-muted">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-brand-600 hover:text-brand-500 dark:text-brand-400 dark:hover:text-brand-300">
                Sign in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </RedirectIfAuth>
  );
}
