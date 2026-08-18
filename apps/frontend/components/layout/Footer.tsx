import Link from "next/link";

const FOOTER_LINKS = [
  { href: "/terms", label: "Terms of Service" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-surface/60 backdrop-blur-sm">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-xs font-bold text-white">
                EZ
              </div>
              <span className="font-semibold text-foreground">EZ Alertz</span>
            </div>
            <p className="max-w-xs text-sm text-muted">
              Real-time stock price alerts for Indian equities. Not investment advice.
            </p>
          </div>

          <nav aria-label="Legal and support">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 sm:justify-end">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted transition hover:text-brand-600 dark:hover:text-brand-400"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-faint">
            © {year} EZ Alertz. All rights reserved.
          </p>
          <p className="text-xs text-faint">
            Market data via Upstox · Alerts via WhatsApp Cloud API
          </p>
        </div>
      </div>
    </footer>
  );
}
