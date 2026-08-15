"use client";

import { useState } from "react";
import type { Alert } from "@stock-alert/shared-types";
import { apiDelete } from "@/lib/apiClient";

interface AlertCardProps {
  alert: Alert;
  onDelete?: () => void;
}

const STATUS_STYLES: Record<Alert["status"], string> = {
  ACTIVE: "bg-brand-500/20 text-brand-400",
  TRIGGERED: "bg-amber-500/20 text-amber-400",
  DISABLED: "bg-slate-500/20 text-slate-400",
  ERROR: "bg-red-500/20 text-red-400",
};

export function AlertCard({ alert, onDelete }: AlertCardProps) {
  const [deleting, setDeleting] = useState(false);

  const conditionLabel =
    alert.conditionType === "ABOVE"
      ? `Above ₹${Number(alert.targetPrice).toLocaleString("en-IN")}`
      : `Below ₹${Number(alert.targetPrice).toLocaleString("en-IN")}`;

  const distance =
    alert.lastPrice !== null
      ? alert.conditionType === "ABOVE"
        ? Number(alert.targetPrice) - Number(alert.lastPrice)
        : Number(alert.lastPrice) - Number(alert.targetPrice)
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
    <li className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 backdrop-blur transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{alert.instrument?.companyName ?? "Stock"}</p>
            <span className="text-xs text-slate-500">
              {alert.instrument?.symbol} · {alert.instrument?.exchange}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-300">{conditionLabel}</p>
          {alert.lastPrice !== null && (
            <p className="mt-1 text-sm text-slate-400">
              Current ₹{Number(alert.lastPrice).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              {distance !== null && distance > 0 && (
                <span className="ml-2 text-slate-500">
                  ({distance.toFixed(2)} away)
                </span>
              )}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <span
              className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[alert.status]}`}
            >
              {alert.status}
            </span>
            <span className="inline-block rounded-full bg-slate-800 px-2.5 py-0.5 text-xs text-slate-400">
              {alert.alertMode === "ONE_TIME" ? "One-time" : "Recurring"}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={deleting}
          className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-red-400 transition hover:bg-red-500/10 hover:text-red-300 disabled:opacity-50"
        >
          {deleting ? "..." : "Delete"}
        </button>
      </div>
    </li>
  );
}
