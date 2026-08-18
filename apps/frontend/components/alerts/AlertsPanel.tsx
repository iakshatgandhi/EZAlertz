"use client";

import { useState } from "react";
import type { Alert } from "@stock-alert/shared-types";
import { ActiveAlertsList } from "./ActiveAlertsList";
import { HistoryAlertCard } from "./HistoryAlertCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

type AlertsTab = "monitoring" | "history";

interface AlertsPanelProps {
  alerts: Alert[];
  history: Alert[];
  loading: boolean;
  historyLoading: boolean;
  onDelete?: () => void;
}

export function AlertsPanel({
  alerts,
  history,
  loading,
  historyLoading,
  onDelete,
}: AlertsPanelProps) {
  const [tab, setTab] = useState<AlertsTab>("monitoring");

  return (
    <section className="glass-card flex min-h-[480px] flex-col p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-label mb-1">Portfolio</p>
          <h2 className="text-lg font-semibold text-foreground">Your alerts</h2>
          <p className="mt-1 text-sm text-muted">
            {tab === "monitoring"
              ? alerts.length === 0
                ? "No active alerts yet"
                : `${alerts.length} stock${alerts.length === 1 ? "" : "s"} being monitored`
              : history.length === 0
                ? "No triggers in the last 24 hours"
                : `${history.length} trigger${history.length === 1 ? "" : "s"} in the last 24h`}
          </p>
        </div>

        <div className="segmented-control w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setTab("monitoring")}
            className={`segmented-option flex-1 sm:flex-none ${
              tab === "monitoring" ? "segmented-option-active" : "hover:text-foreground"
            }`}
          >
            Monitoring
            {alerts.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-bold text-brand-600 dark:text-brand-400">
                {alerts.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab("history")}
            className={`segmented-option flex-1 sm:flex-none ${
              tab === "history" ? "segmented-option-active" : "hover:text-foreground"
            }`}
          >
            History
            {history.length > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1">
        {tab === "monitoring" ? (
          <ActiveAlertsList
            alerts={alerts}
            loading={loading}
            onDelete={onDelete}
            embedded
          />
        ) : historyLoading ? (
          <div className="flex justify-center py-16">
            <Spinner />
          </div>
        ) : history.length === 0 ? (
          <EmptyState
            icon={
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="No triggered alerts yet"
            description="When a one-time alert fires, it appears here for 24 hours before being removed."
          />
        ) : (
          <ul className="space-y-3">
            {history.map((alert) => (
              <HistoryAlertCard key={alert.id} alert={alert} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
