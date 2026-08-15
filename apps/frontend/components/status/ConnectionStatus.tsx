import type { MarketDataConnectionStatus } from "@stock-alert/shared-types";

interface ConnectionStatusProps {
  status: MarketDataConnectionStatus;
}

const LABELS: Record<MarketDataConnectionStatus, string> = {
  connected: "Live data connected",
  reconnecting: "Reconnecting to live market data...",
  disconnected: "Live data disconnected",
};

const COLORS: Record<MarketDataConnectionStatus, string> = {
  connected: "text-brand-500",
  reconnecting: "text-amber-400",
  disconnected: "text-red-400",
};

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  return (
    <p className={`text-sm ${COLORS[status]}`} role="status">
      {LABELS[status]}
    </p>
  );
}
