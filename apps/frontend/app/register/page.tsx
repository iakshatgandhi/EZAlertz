"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError } from "@/lib/apiClient";
import { useAuth } from "@/components/auth/AuthProvider";
import { RedirectIfAuth } from "@/components/auth/RequireAuth";

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
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl backdrop-blur">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/20 text-xl font-bold text-brand-500">
              EZ
            </div>
            <h1 className="text-2xl font-bold">Create account</h1>
            <p className="mt-1 text-sm text-slate-400">Set up price alerts for Indian stocks</p>
          </div>

          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-sm text-slate-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none ring-brand-500 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1 block text-sm text-slate-400">
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
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none ring-brand-500 focus:ring-2"
              />
              <p className="mt-1 text-xs text-slate-500">At least 8 characters</p>
            </div>
            <div>
              <label htmlFor="whatsapp" className="mb-1 block text-sm text-slate-400">
                WhatsApp number (optional)
              </label>
              <input
                id="whatsapp"
                type="tel"
                placeholder="919876543210"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none ring-brand-500 focus:ring-2"
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
            >
              {submitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-brand-500 hover:text-brand-400">
              Sign in
            </Link>
          </p>
        </div>
      </main>
    </RedirectIfAuth>
  );
}
