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
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur">
      <h2 className="mb-1 text-lg font-semibold">Create alert</h2>
      <p className="mb-4 text-sm text-slate-400">
        {instrument
          ? `Set a price target for ${instrument.companyName}`
          : "Select a stock from search results first"}
      </p>

      {instrument && (
        <div className="mb-4 rounded-lg bg-slate-950/80 px-3 py-2 text-sm">
          <span className="font-medium text-slate-200">{instrument.symbol}</span>
          <span className="text-slate-500"> · {instrument.exchange}</span>
          {ltpLoading && (
            <span className="ml-2 text-slate-400">Fetching LTP...</span>
          )}
          {!ltpLoading && currentPrice !== null && currentPrice !== undefined && (
            <span className="ml-2 text-brand-400">
              LTP ₹{currentPrice.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          )}
          {!ltpLoading && ltpError && (
            <span className="ml-2 text-amber-400">{ltpError}</span>
          )}
        </div>
      )}

      <div className="space-y-4">
        <fieldset disabled={!instrument}>
          <legend className="mb-2 text-sm font-medium text-slate-400">Alert me when</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["ABOVE", "BELOW"] as const).map((value) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm transition ${
                  condition === value
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
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
                Price goes {value === "ABOVE" ? "above" : "below"}
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="target-price" className="mb-1 block text-sm font-medium text-slate-400">
            Target price (₹)
            {ltpPrefilled ? " — prefilled with LTP, adjust for your alert" : ""}
          </label>
          <input
            id="target-price"
            type="number"
            step="0.05"
            placeholder={ltpLoading ? "Fetching LTP..." : "Enter target price"}
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            disabled={!instrument || ltpLoading}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none ring-brand-500 focus:ring-2 disabled:opacity-50"
          />
        </div>

        <fieldset disabled={!instrument}>
          <legend className="mb-2 text-sm font-medium text-slate-400">Alert mode</legend>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                ["ONE_TIME", "One-time"],
                ["RECURRING", "Keep active"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-sm transition ${
                  mode === value
                    ? "border-brand-500 bg-brand-500/10 text-brand-400"
                    : "border-slate-700 text-slate-400 hover:border-slate-600"
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

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-brand-400">Alert created successfully</p>}

        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={!instrument || submitting}
          className="w-full rounded-lg bg-brand-600 py-2.5 font-medium text-white transition hover:bg-brand-500 disabled:opacity-50"
        >
          {submitting ? "Setting alert..." : "Set alert"}
        </button>
      </div>
    </div>
  );
}
