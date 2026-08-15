import type { Instrument } from "@stock-alert/shared-types";

interface SearchResultsProps {
  results: Instrument[];
  onSelect: (instrument: Instrument) => void;
}

export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <ul className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90 shadow-lg backdrop-blur">
      {results.map((instrument) => (
        <li key={instrument.id}>
          <button
            type="button"
            onClick={() => onSelect(instrument)}
            className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-slate-800/80"
          >
            <div>
              <p className="font-medium text-slate-100">{instrument.companyName}</p>
              <p className="text-sm text-slate-400">
                {instrument.symbol} · {instrument.exchange}
              </p>
            </div>
            <span className="text-xs text-brand-500">Select</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
