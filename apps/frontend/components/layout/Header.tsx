"use client";

import type { MarketDataConnectionStatus } from "@stock-alert/shared-types";
import { ConnectionStatus } from "@/components/status/ConnectionStatus";
import { useAuth } from "@/components/auth/AuthProvider";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

interface HeaderProps {
  connectionStatus: MarketDataConnectionStatus;
  activeAlertCount?: number;
}

function UserAvatar({ email }: { email: string }) {
  const initial = email.charAt(0).toUpperCase();

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500/30 to-brand-600/10 text-sm font-semibold text-brand-600 ring-1 ring-brand-500/20 dark:text-brand-300">
      {initial}
    </div>
  );
}

export function Header({ connectionStatus, activeAlertCount = 0 }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 -mx-4 border-b border-border bg-surface/80 px-4 py-4 backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-sm font-bold text-white shadow-glow">
            EZ
            <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface bg-brand-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              EZ Alertz
            </h1>
            <p className="text-xs text-faint sm:text-sm">
              Real-time price alerts · NSE & BSE
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end sm:gap-3">
          {activeAlertCount > 0 && (
            <div className="hidden items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-1.5 sm:flex">
              <span className="text-xs text-faint">Monitoring</span>
              <span className="text-sm font-semibold text-brand-600 dark:text-brand-400">
                {activeAlertCount}
              </span>
            </div>
          )}
          <ConnectionStatus status={connectionStatus} />
          <ThemeToggle />
          {user && (
            <>
              <div className="hidden items-center gap-2.5 rounded-xl border border-border bg-elevated px-3 py-1.5 sm:flex">
                <UserAvatar email={user.email} />
                <span className="max-w-[160px] truncate text-sm text-muted">{user.email}</span>
              </div>
              <button
                type="button"
                onClick={() => void logout()}
                className="btn-secondary !py-2 !text-xs"
              >
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
