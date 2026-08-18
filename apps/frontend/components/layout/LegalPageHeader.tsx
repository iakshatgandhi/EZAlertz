"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function LegalPageHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="border-b border-border bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-80">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white">
            EZ
          </div>
          <span className="font-semibold text-foreground">EZ Alertz</span>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          {!loading && (
            user ? (
              <Link
                href="/"
                className="btn-secondary !py-2 !text-xs"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-sm text-muted transition hover:text-brand-600 dark:hover:text-brand-400"
              >
                Sign in
              </Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
