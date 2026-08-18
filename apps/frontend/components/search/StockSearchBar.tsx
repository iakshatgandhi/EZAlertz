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
      <div className="pointer-events-none absolute left-4 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg bg-elevated">
        <svg
          className="h-4 w-4 text-faint"
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
      </div>
      <input
        id="stock-search"
        type="search"
        placeholder="Search by symbol or company name..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-field !py-3.5 !pl-14 !text-base"
      />
      {value.length > 0 && value.length < 2 && (
        <p className="mt-2 text-xs text-faint">Type at least 2 characters to search</p>
      )}
    </div>
  );
}
