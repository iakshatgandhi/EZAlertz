"use client";

import { useEffect, useState } from "react";
import type { Instrument, MarketDataConnectionStatus, SystemStatus } from "@stock-alert/shared-types";
import { AlertsPanel } from "@/components/alerts/AlertsPanel";
import { AlertForm } from "@/components/alerts/AlertForm";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { Header } from "@/components/layout/Header";
import { MarketStatusBanner } from "@/components/market/MarketStatusBanner";
import { SearchResults } from "@/components/search/SearchResults";
import { StockSearchBar } from "@/components/search/StockSearchBar";
import { WhatsAppSettings } from "@/components/settings/WhatsAppSettings";
import { useAlertHistory } from "@/hooks/useAlertHistory";
import { useAlerts } from "@/hooks/useAlerts";
import { useLivePrice } from "@/hooks/useLivePrice";
import { useMarketCalendar } from "@/hooks/useMarketCalendar";
import { apiGet, ApiError } from "@/lib/apiClient";
import { useRealtimeEvents } from "@/lib/realtimeClient";

export default function DashboardPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Instrument[]>([]);
  const [selectedInstrument, setSelectedInstrument] = useState<Instrument | null>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<MarketDataConnectionStatus>("disconnected");
  const { alerts, loading, refresh, updateLivePrice } = useAlerts();
  const { history, loading: historyLoading, refresh: refreshHistory } = useAlertHistory();
  const { calendar, loading: calendarLoading, error: calendarError } = useMarketCalendar();
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
      updateLivePrice(data.instrumentKey, data.ltp);
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
      void refreshHistory();
    }
  });

  return (
    <RequireAuth>
      <div className="min-h-screen">
        <Header connectionStatus={connectionStatus} activeAlertCount={alerts.length} />

        <MarketStatusBanner
          calendar={calendar}
          loading={calendarLoading}
          error={calendarError}
        />

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="grid gap-6 lg:grid-cols-5 lg:gap-8">
            {/* Left column — search & create */}
            <div className="space-y-5 lg:col-span-2 lg:space-y-6">
              <WhatsAppSettings />

              <section className="glass-card animate-fade-in p-6">
                <div className="mb-5">
                  <p className="section-label mb-1">Discover</p>
                  <h2 className="text-lg font-semibold text-foreground">Search stocks</h2>
                  <p className="mt-1 text-sm text-muted">
                    Live results from Upstox · NSE & BSE equities
                  </p>
                </div>
                <StockSearchBar value={searchQuery} onChange={setSearchQuery} />
                <div className="mt-3">
                  <SearchResults
                    results={searchResults}
                    onSelect={(instrument) => {
                      void handleSelectStock(instrument);
                    }}
                  />
                </div>
              </section>

              <AlertForm
                instrument={selectedInstrument}
                currentPrice={price}
                ltpLoading={ltpLoading}
                ltpError={ltpError}
                onCreated={() => {
                  const instrumentKey = selectedInstrument?.instrumentKey;
                  const ltp = price;
                  if (instrumentKey && ltp !== null) {
                    updateLivePrice(instrumentKey, ltp);
                  }
                  void refresh();
                  setSelectedInstrument(null);
                  setSearchQuery("");
                  setPrice(null);
                  setLtpError(null);
                }}
              />
            </div>

            {/* Right column — alerts */}
            <div className="lg:col-span-3">
              <AlertsPanel
                alerts={alerts}
                history={history}
                loading={loading}
                historyLoading={historyLoading}
                onDelete={() => {
                  void refresh();
                  void refreshHistory();
                }}
              />
            </div>
          </div>
        </main>
      </div>
    </RequireAuth>
  );
}
