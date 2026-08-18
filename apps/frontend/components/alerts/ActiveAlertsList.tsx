import type { Alert } from "@stock-alert/shared-types";
import { AlertCard } from "./AlertCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";

interface ActiveAlertsListProps {
  alerts: Alert[];
  loading?: boolean;
  onDelete?: () => void;
  embedded?: boolean;
}

export function ActiveAlertsList({
  alerts,
  loading,
  onDelete,
  embedded = false,
}: ActiveAlertsListProps) {
  const content = loading ? (
    <div className="flex justify-center py-16">
      <Spinner />
    </div>
  ) : alerts.length === 0 ? (
    <EmptyState
      icon={
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      }
      title="No active alerts"
      description="Search for a stock and set a price target to start monitoring."
    />
  ) : (
    <ul className="space-y-3">
      {alerts.map((alert) => (
        <AlertCard key={alert.id} alert={alert} onDelete={onDelete} />
      ))}
    </ul>
  );

  if (embedded) {
    return content;
  }

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-foreground">Your alerts</h2>
        <p className="text-sm text-muted">
          {alerts.length === 0
            ? "No active alerts yet"
            : `${alerts.length} alert${alerts.length === 1 ? "" : "s"} monitoring`}
        </p>
      </div>
      {content}
    </section>
  );
}
