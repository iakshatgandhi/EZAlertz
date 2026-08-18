"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { MarketCalendarStatus, MarketSessionState } from "@stock-alert/shared-types";

interface MarketStatusBannerProps {
  calendar: MarketCalendarStatus | null;
  loading?: boolean;
  error?: string | null;
}

const STATE_CONFIG: Record<
  MarketSessionState,
  { label: string; accent: string; ring: string; icon: ReactNode }
> = {
  OPEN: {
    label: "Market open",
    accent: "text-brand-600 dark:text-brand-400",
    ring: "ring-brand-500/30",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  PRE_OPEN: {
    label: "Pre-open",
    accent: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  POST_CLOSE: {
    label: "After hours",
    accent: "text-amber-600 dark:text-amber-400",
    ring: "ring-amber-500/30",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
  },
  HOLIDAY: {
    label: "Holiday",
    accent: "text-red-600 dark:text-red-400",
    ring: "ring-red-500/30",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
      </svg>
    ),
  },
  CLOSED: {
    label: "Market closed",
    accent: "text-muted",
    ring: "ring-border",
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
      </svg>
    ),
  },
};

function formatCountdown(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  }

  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
}

function useLiveCountdown(targetIso: string | null, initialSeconds: number | null) {
  const [secondsRemaining, setSecondsRemaining] = useState(initialSeconds);

  useEffect(() => {
    if (!targetIso) {
      setSecondsRemaining(initialSeconds);
      return;
    }

    const tick = () => {
      const remaining = Math.max(
        0,
        Math.floor((new Date(targetIso).getTime() - Date.now()) / 1000),
      );
      setSecondsRemaining(remaining);
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetIso, initialSeconds]);

  return secondsRemaining;
}

function BannerSkeleton() {
  return (
    <div className="border-b border-border bg-surface/50">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="h-28 animate-pulse rounded-2xl bg-elevated" />
      </div>
    </div>
  );
}

function StatCard({
  label,
  title,
  detail,
  children,
}: {
  label: string;
  title: string;
  detail?: string;
  children?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border/80 bg-elevated/40 p-4">
      <p className="section-label mb-2">{label}</p>
      <p className="font-semibold text-foreground">{title}</p>
      {detail && <p className="mt-1 text-xs leading-relaxed text-muted">{detail}</p>}
      {children}
    </div>
  );
}

export function MarketStatusBanner({ calendar, loading, error }: MarketStatusBannerProps) {
  const countdown = useLiveCountdown(
    calendar?.today.countdownTarget ?? null,
    calendar?.today.secondsRemaining ?? null,
  );

  if (loading) {
    return <BannerSkeleton />;
  }

  if (error || !calendar) {
    return (
      <div className="border-b border-border bg-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <p className="text-sm text-muted">{error ?? "Market calendar unavailable"}</p>
        </div>
      </div>
    );
  }

  const stateConfig = STATE_CONFIG[calendar.today.state];
  const sessionLabel =
    calendar.today.sessionStartLabel && calendar.today.sessionEndLabel
      ? `${calendar.today.sessionStartLabel} – ${calendar.today.sessionEndLabel} IST`
      : "Timings unavailable from Upstox";

  const tomorrowClosed = !calendar.tomorrow.isTradingDay;
  const progress = calendar.today.sessionProgressPercent;

  return (
    <div className="border-b border-border bg-gradient-to-r from-surface/95 via-surface/80 to-surface/95">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
        <div className="glass-card overflow-hidden p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl bg-elevated ring-1 ${stateConfig.ring} ${stateConfig.accent}`}
              >
                {stateConfig.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {calendar.exchange} · {calendar.today.dateLabel}
                </p>
                <p className="text-xs text-muted">{calendar.today.statusDescription}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                  calendar.alertsActive
                    ? "border-brand-500/25 bg-brand-500/10 text-brand-700 dark:text-brand-300"
                    : "border-border bg-elevated text-muted"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    calendar.alertsActive
                      ? "bg-brand-500 animate-pulse-soft"
                      : "bg-slate-400"
                  }`}
                />
                {calendar.alertsActive ? "Alerts active" : "Alerts paused"}
              </span>
              <span className="rounded-full border border-border bg-elevated px-3 py-1 text-xs font-medium text-muted">
                {stateConfig.label}
              </span>
            </div>
          </div>

          <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
            <StatCard
              label="Exchange status"
              title={calendar.today.statusLabel}
              detail={calendar.today.holidayReason ?? undefined}
            >
              <p className="mt-2 text-[10px] uppercase tracking-wider text-faint">
                {calendar.today.marketStatus.replaceAll("_", " ")}
              </p>
            </StatCard>

            <StatCard label="Session" title={calendar.today.countdownLabel} detail={sessionLabel}>
              {countdown !== null && countdown > 0 ? (
                <p className="mt-2 font-mono text-2xl font-bold tabular-nums tracking-tight text-brand-600 dark:text-brand-400">
                  {formatCountdown(countdown)}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">
                  {calendar.today.state === "OPEN"
                    ? "Trading live now"
                    : calendar.nextSession?.label ?? calendar.today.countdownLabel}
                </p>
              )}

              {progress !== null && calendar.today.state === "OPEN" && (
                <div className="mt-3">
                  <div className="mb-1 flex justify-between text-[10px] text-faint">
                    <span>Session progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </StatCard>

            <StatCard
              label="Up next"
              title={tomorrowClosed ? "Closed tomorrow" : "Trading tomorrow"}
              detail={
                tomorrowClosed
                  ? (calendar.tomorrow.holidayReason ?? "Markets closed")
                  : calendar.tomorrow.sessionStartLabel
                    ? `Opens ${calendar.tomorrow.sessionStartLabel} IST · closes ${calendar.tomorrow.sessionEndLabel} IST`
                    : "Regular session expected"
              }
            >
              {calendar.nextSession && calendar.today.state !== "OPEN" && (
                <p className="mt-2 text-xs text-brand-600 dark:text-brand-400">
                  {calendar.nextSession.label}
                </p>
              )}
            </StatCard>
          </div>
        </div>
      </div>
    </div>
  );
}
