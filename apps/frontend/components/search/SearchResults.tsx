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
    <ul className="glass-card animate-slide-up overflow-hidden divide-y divide-border">
      {results.map((instrument, index) => (
        <li key={instrument.id}>
          <button
            type="button"
            onClick={() => onSelect(instrument)}
            className="group flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-elevated"
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground group-hover:text-brand-600 dark:group-hover:text-brand-400">
                {instrument.companyName}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                <span className="font-mono text-foreground/80">{instrument.symbol}</span>
                <span className="mx-1.5 text-faint">·</span>
                {instrument.exchange}
              </p>
            </div>
            <span className="shrink-0 rounded-lg bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-600 opacity-0 transition group-hover:opacity-100 dark:text-brand-400">
              Select
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
