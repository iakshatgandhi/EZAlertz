"use client";

import { useEffect, useState } from "react";
import type { Instrument, MarketDataConnectionStatus, SystemStatus } from "@stock-alert/shared-types";
import { ActiveAlertsList } from "@/components/alerts/ActiveAlertsList";
import { AlertForm } from "@/components/alerts/AlertForm";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Header } from "@/components/layout/Header";
import { SearchResults } from "@/components/search/SearchResults";
import { StockSearchBar } from "@/components/search/StockSearchBar";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import { useAlerts } from "@/hooks/useAlerts";
import { useLivePrice } from "@/hooks/useLivePrice";
import { apiGet, ApiError } from "@/lib/apiClient";
import { useRealtimeEvents } from "@/lib/realtimeClient";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<MarketDataConnectionStatus>("disconnected");
  const { alerts, loading, refresh } = useAlerts();
  const { price, setPrice } = useLivePrice();
  const [ltpLoading, setLtpLoading] = useState(false);
  const [ltpError, setLtpError] = useState<string | null>(null);

  async function handleSelectStock(instrument: Instrument) {
    setSelectedInstrument(instrument);
    setSearchQuery(instrument.symbol);
    setSearchResults([]);
    setPrice(null);
    setLtpError(null);
    setLtpLoading(true);

    try {
      const quote = await apiGet<{ instrumentKey: string; ltp: number }>(
        `/api/stocks/${instrument.id}/ltp`,
      );
      setPrice(quote.ltp);
    } catch (err) {
      setPrice(null);
      setLtpError(
        err instanceof ApiError
          ? err.message
          : "Could not fetch LTP — check your Upstox token or try again",
      );
    } finally {
      setLtpLoading(false);
    }
  }

  useEffect(() => {
    apiGet<SystemStatus>("/api/status")
      .then((status) => setConnectionStatus(status.marketData))
      .catch(() => setConnectionStatus("disconnected"));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timeout = setTimeout(() => {
      apiGet<Instrument[]>(`/api/stocks/search?q=${encodeURIComponent(searchQuery)}`)
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 250);

    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useRealtimeEvents((event) => {
    if (event.type === "CONNECTION_STATUS") {
      const data = event.data as { marketData: MarketDataConnectionStatus };
      setConnectionStatus(data.marketData);
    }
    if (event.type === "PRICE_UPDATE") {
      const data = event.data as { ltp: number; instrumentKey: string };
      if (selectedInstrument?.instrumentKey === data.instrumentKey) {
        setPrice(data.ltp);
      }
    }
    if (
      event.type === "ALERT_CREATED" ||
      event.type === "ALERT_TRIGGERED" ||
      event.type === "ALERT_DELETED" ||
      event.type === "ALERT_DISABLED"
    ) {
      void refresh();
    }
  });

  return (
    <RequireAuth>
      <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 px-4 py-6 sm:gap-8 sm:py-8">
        <Header connectionStatus={connectionStatus} />

        <WhatsAppSettings />

        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Search stocks</h2>
            <p className="text-sm text-slate-400">
              Live suggestions from Upstox — includes new IPOs automatically
            </p>
          </div>
          <StockSearchBar value={searchQuery} onChange={setSearchQuery} />
          <SearchResults
            results={searchResults}
            onSelect={(instrument) => {
              void handleSelectStock(instrument);
            }}
          />
        </section>

        <AlertForm
          instrument={selectedInstrument}
          currentPrice={price}
          ltpLoading={ltpLoading}
          ltpError={ltpError}
          onCreated={() => {
            void refresh();
            setSelectedInstrument(null);
            setSearchQuery("");
            setPrice(null);
            setLtpError(null);
          }}
        />

        <ActiveAlertsList
          alerts={alerts}
          loading={loading}
          onDelete={() => void refresh()}
        />
      </main>
    </RequireAuth>
  );
}
