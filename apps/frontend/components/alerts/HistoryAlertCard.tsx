"use client";

import type { Alert } from "@stock-alert/shared-types";

interface HistoryAlertCardProps {
  alert: Alert;
}

function formatTriggeredAt(triggeredAt: string): string {
  const date = new Date(triggeredAt);
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryAlertCard({ alert }: HistoryAlertCardProps) {
  const conditionLabel =
    alert.conditionType === "ABOVE"
      ? `Above ₹${Number(alert.targetPrice).toLocaleString("en-IN")}`
      : `Below ₹${Number(alert.targetPrice).toLocaleString("en-IN")}`;

  return (
    <li className="glass-card p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 font-mono text-xs font-bold text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
          {alert.instrument?.symbol?.slice(0, 3) ?? "—"}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-medium text-foreground">
                {alert.instrument?.companyName ?? "Stock"}
              </p>
              <p className="text-xs text-faint">
                <span className="font-mono text-muted">{alert.instrument?.symbol}</span>
                <span className="mx-1">·</span>
                {alert.instrument?.exchange}
              </p>
            </div>
            {alert.triggeredAt && (
              <time className="shrink-0 text-xs text-faint">
                {formatTriggeredAt(alert.triggeredAt)}
              </time>
            )}
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-faint">Target</p>
              <p className="font-mono text-sm text-foreground">{conditionLabel}</p>
            </div>
            {alert.lastPrice !== null && (
              <div className="text-right">
                <p className="text-xs text-faint">Triggered at</p>
                <p className="font-mono text-sm font-semibold tabular-nums text-amber-600 dark:text-amber-300">
                  ₹{Number(alert.lastPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="badge bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400">
              Triggered
            </span>
            <span className="badge bg-elevated text-muted ring-1 ring-border">
              {alert.alertMode === "ONE_TIME" ? "One-time" : "Recurring"}
            </span>
          </div>
        </div>
      </div>
    </li>
  );
}
