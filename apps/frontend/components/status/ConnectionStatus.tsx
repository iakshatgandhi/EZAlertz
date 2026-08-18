import type { MarketDataConnectionStatus } from "@stock-alert/shared-types";

interface ConnectionStatusProps {
  status: MarketDataConnectionStatus;
}

const CONFIG: Record<
  MarketDataConnectionStatus,
  { label: string; dot: string; pill: string }
> = {
  connected: {
    label: "Live",
    dot: "bg-brand-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    pill: "border-brand-500/25 bg-brand-500/10 text-brand-700 dark:text-brand-300",
  },
  reconnecting: {
    label: "Reconnecting",
    dot: "bg-amber-500 animate-pulse-soft",
    pill: "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  },
  disconnected: {
    label: "Offline",
    dot: "bg-red-500",
    pill: "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300",
  },
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const { label, dot, pill } = CONFIG[status];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium ${pill}`}
      role="status"
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </div>
  );
}
