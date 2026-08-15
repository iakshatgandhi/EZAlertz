"use client";

import type { MarketDataConnectionStatus } from "@stock-alert/shared-types";
import { ConnectionStatus } from "@/components/status/ConnectionStatus";
import { useAuth } from "@/components/auth/AuthProvider";

interface HeaderProps {
  connectionStatus: MarketDataConnectionStatus;
}

export function Header({ connectionStatus }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/20 text-lg font-bold text-brand-500">
          EZ
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">EZ Alertz</h1>
          <p className="text-sm text-slate-400">Stock price alarm clock</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 sm:justify-end">
        <ConnectionStatus status={connectionStatus} />
        {user && (
          <>
            <span className="hidden text-sm text-slate-400 sm:inline">{user.email}</span>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
            >
              Log out
            </button>
          </>
        )}
      </div>
    </header>
  );
}
