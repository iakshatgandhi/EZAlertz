import type { Alert } from "@stock-alert/shared-types";
import { AlertCard } from "./AlertCard";

interface ActiveAlertsListProps {
  alerts: Alert[];
  loading?: boolean;
  onDelete?: () => void;
}

export function ActiveAlertsList({ alerts, loading, onDelete }: ActiveAlertsListProps) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Your alerts</h2>
        <p className="text-sm text-slate-400">
          {alerts.length === 0
            ? "No active alerts yet"
            : `${alerts.length} alert${alerts.length === 1 ? "" : "s"} monitoring`}
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/40 px-6 py-10 text-center">
          <p className="text-slate-400">Search for a stock above and set your first alert.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDelete={onDelete} />
          ))}
        </ul>
      )}
    </section>
  );
}
