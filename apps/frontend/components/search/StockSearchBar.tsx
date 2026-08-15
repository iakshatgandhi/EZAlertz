"use client";

interface StockSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function StockSearchBar({ value, onChange }: StockSearchBarProps) {
  return (
    <div className="relative w-full">
      <label htmlFor="stock-search" className="sr-only">
        Search stocks
      </label>
      <svg
        className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      <input
        id="stock-search"
        type="search"
        placeholder="Search stocks... type at least 2 letters"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3.5 pl-12 pr-4 text-base outline-none ring-brand-500 placeholder:text-slate-500 focus:ring-2"
      />
    </div>
  );
}
