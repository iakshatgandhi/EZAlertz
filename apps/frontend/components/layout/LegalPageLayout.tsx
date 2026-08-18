import type { ReactNode } from "react";
import { LegalPageBackLink } from "./LegalPageBackLink";
import { LegalPageHeader } from "./LegalPageHeader";

interface LegalPageLayoutProps {
  title: string;
  description: string;
  lastUpdated: string;
  children: ReactNode;
}

export function LegalPageLayout({
  title,
  description,
  lastUpdated,
  children,
}: LegalPageLayoutProps) {
  return (
    <div className="min-h-screen">
      <LegalPageHeader />

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8">
          <p className="section-label mb-2">Legal</p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-2 text-muted">{description}</p>
          <p className="mt-3 text-xs text-faint">Last updated: {lastUpdated}</p>
        </div>

        <article className="glass-card space-y-6 p-6 sm:p-8">
          <div className="prose-legal space-y-5 text-sm leading-relaxed text-muted [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_p]:text-muted [&_ul]:space-y-2">
            {children}
          </div>
        </article>

        <LegalPageBackLink />
      </main>
    </div>
  );
}
