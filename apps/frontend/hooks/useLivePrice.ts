"use client";

import { useState } from "react";

export function useLivePrice() {
  const [price, setPrice] = useState<number | null>(null);
  const [instrumentKey, setInstrumentKey] = useState<string | null>(null);

  return {
    price,
    instrumentKey,
    setPrice,
    setInstrumentKey,
  };
}
