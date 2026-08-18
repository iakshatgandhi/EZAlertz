"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth/AuthProvider";

export function LegalPageBackLink() {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <p className="mt-8 text-center text-sm text-faint">
      <Link href="/" className="text-brand-600 hover:text-brand-500 dark:text-brand-400">
        ← Back to {user ? "dashboard" : "home"}
      </Link>
    </p>
  );
}
