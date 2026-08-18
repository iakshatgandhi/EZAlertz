"use client";

import { useEffect, useState } from "react";
import type { AlertCondition, AlertMode, Instrument } from "@stock-alert/shared-types";
import { ApiError, apiPost } from "@/lib/apiClient";

interface AlertFormProps {
  instrument: Instrument | null;
  currentPrice?: number | null;
  ltpLoading?: boolean;
  ltpError?: string | null;
  onCreated?: () => void;
}

export function AlertForm({
  instrument,
  currentPrice,
  ltpLoading = false,
  ltpError = null,
  onCreated,
}: AlertFormProps) {
  const [condition, setCondition] = useState<AlertCondition>("BELOW");
  const [targetPrice, setTargetPrice] = useState("");
  const [ltpPrefilled, setLtpPrefilled] = useState(false);
  const [mode, setMode] = useState<AlertMode>("ONE_TIME");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setTargetPrice("");
    setLtpPrefilled(false);
    setSuccess(false);
    setError(null);
  }, [instrument?.id]);

  useEffect(() => {
    if (currentPrice && instrument && !ltpPrefilled) {
      setTargetPrice(currentPrice.toFixed(2));
      setLtpPrefilled(true);
    }
  }, [currentPrice, instrument?.id, ltpPrefilled]);

  async function handleSubmit() {
    if (!instrument) {
      return;
    }

    const price = Number(targetPrice);
    if (!price || price <= 0) {
      setError("Enter a valid target price");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      await apiPost("/api/alerts", {
        instrumentId: instrument.id,
        condition,
        targetPrice: price,
        mode,
      });
      setSuccess(true);
      onCreated?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create alert");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="glass-card animate-slide-up p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="section-label mb-1">New alert</p>
          <h2 className="text-lg font-semibold text-foreground">Set price target</h2>
          <p className="mt-1 text-sm text-muted">
            {instrument
              ? `Configure alert for ${instrument.symbol}`
              : "Select a stock from search first"}
          </p>
        </div>
        {instrument && (
          <div className="shrink-0 rounded-xl border border-border bg-elevated px-3 py-2 text-right">
            <p className="font-mono text-sm font-semibold text-foreground">{instrument.symbol}</p>
            <p className="text-[10px] uppercase tracking-wider text-faint">{instrument.exchange}</p>
          </div>
        )}
      </div>

      {instrument && (
        <div className="mb-5 rounded-xl border border-border bg-gradient-to-r from-elevated to-transparent px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-faint">
            {instrument.companyName}
          </p>
          <div className="mt-1 flex flex-wrap items-baseline gap-2">
            {ltpLoading ? (
              <span className="text-sm text-muted">Fetching live price...</span>
            ) : currentPrice !== null && currentPrice !== undefined ? (
              <>
                <span className="text-2xl font-bold tabular-nums text-foreground">
                  ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
                <span className="badge bg-brand-500/15 text-brand-600 dark:text-brand-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
                  Live
                </span>
              </>
            ) : ltpError ? (
              <span className="text-sm text-amber-600 dark:text-amber-400">{ltpError}</span>
            ) : (
              <span className="text-sm text-muted">Price unavailable</span>
            )}
          </div>
        </div>
      )}

      <div className="space-y-5">
        <fieldset disabled={!instrument}>
          <legend className="mb-2.5 text-sm font-medium text-muted">Alert when price goes</legend>
          <div className="segmented-control">
            {(["ABOVE", "BELOW"] as const).map((value) => (
              <label
                key={value}
                className={`segmented-option ${
                  condition === value ? "segmented-option-active" : "hover:text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={value}
                  checked={condition === value}
                  onChange={() => setCondition(value)}
                  className="sr-only"
                />
                {value === "ABOVE" ? "↑ Above" : "↓ Below"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="target-price" className="mb-2 block text-sm font-medium text-muted">
            Target price (₹)
            {ltpPrefilled && (
              <span className="ml-1 font-normal text-faint">· prefilled from LTP</span>
            )}
          </label>
          <input
            id="target-price"
            type="number"
            step="0.05"
            placeholder={ltpLoading ? "Fetching LTP..." : "0.00"}
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            disabled={!instrument || ltpLoading}
            className="input-field !py-3 font-mono text-lg tabular-nums"
          />
        </div>

        <fieldset disabled={!instrument}>
          <legend className="mb-2.5 text-sm font-medium text-muted">After trigger</legend>
          <div className="segmented-control">
            {(
              [
                ["ONE_TIME", "One-time"],
                ["RECURRING", "Keep active"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`segmented-option ${
                  mode === value ? "segmented-option-active" : "hover:text-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value={value}
                  checked={mode === value}
                  onChange={() => setMode(value)}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-600 dark:text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-brand-500/20 bg-brand-500/10 px-4 py-3 text-sm text-brand-700 dark:text-brand-300">
            Alert created — monitoring started
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!instrument || submitting}
          className="btn-primary w-full !py-3"
        >
          {submitting ? "Creating alert..." : "Create alert"}
        </button>
      </div>
    </div>
  );
}
