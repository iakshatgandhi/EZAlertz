"use client";

import { useState } from "react";
import type { Alert } from "@stock-alert/shared-types";
import { apiDelete } from "@/lib/apiClient";

interface AlertCardProps {
  alert: Alert;
  onDelete?: () => void;
}

const STATUS_STYLES: Record<Alert["status"], string> = {
  ACTIVE: "bg-brand-500/15 text-brand-600 ring-brand-500/20 dark:text-brand-400",
  TRIGGERED: "bg-amber-500/15 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  DISABLED: "bg-slate-500/15 text-slate-500 ring-slate-500/20 dark:text-slate-400",
  ERROR: "bg-red-500/15 text-red-600 ring-red-500/20 dark:text-red-400",
};

export function AlertCard({ alert, onDelete }: AlertCardProps) {
  const [deleting, setDeleting] = useState(false);

  const target = Number(alert.targetPrice);
  const last = alert.lastPrice !== null ? Number(alert.lastPrice) : null;

  const conditionLabel =
    alert.conditionType === "ABOVE"
      ? `Above ₹${target.toLocaleString("en-IN")}`
      : `Below ₹${target.toLocaleString("en-IN")}`;

  const distance =
    last !== null
      ? alert.conditionType === "ABOVE"
        ? target - last
        : last - target
      : null;

  const progress =
    last !== null && distance !== null
      ? Math.max(0, Math.min(100, 100 - (distance / target) * 100))
      : null;

  async function handleDelete() {
    setDeleting(true);
    try {
      await apiDelete(`/api/alerts/${alert.id}`);
      onDelete?.();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <li className="glass-card-hover group p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-elevated font-mono text-xs font-bold text-muted ring-1 ring-border">
              {alert.instrument?.symbol?.slice(0, 3) ?? "—"}
            </div>
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {alert.instrument?.companyName ?? "Stock"}
              </p>
              <p className="text-xs text-faint">
                <span className="font-mono text-muted">{alert.instrument?.symbol}</span>
                <span className="mx-1">·</span>
                {alert.instrument?.exchange}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-faint">Target</p>
              <p className="font-mono text-sm font-medium text-foreground">{conditionLabel}</p>
            </div>
            {last !== null && (
              <div className="text-right">
                <p className="text-xs text-faint">Current</p>
                <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
                  ₹{last.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </p>
              </div>
            )}
          </div>

          {progress !== null && distance !== null && distance > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-[10px] text-faint">
                <span>Progress to target</span>
                <span className="font-mono">{distance.toFixed(2)} away</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-2">
            <span className={`badge ring-1 ${STATUS_STYLES[alert.status]}`}>
              {alert.status === "ACTIVE" && (
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500 animate-pulse-soft" />
              )}
              {alert.status}
            </span>
            <span className="badge bg-elevated text-muted ring-1 ring-border">
              {alert.alertMode === "ONE_TIME" ? "One-time" : "Recurring"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="btn-danger-ghost opacity-0 transition group-hover:opacity-100 focus:opacity-100"
          aria-label="Delete alert"
        >
          {deleting ? (
            <span className="text-xs">...</span>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          )}
        </button>
      </div>
    </li>
  );
}
