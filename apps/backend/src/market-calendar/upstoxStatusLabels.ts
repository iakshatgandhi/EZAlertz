export interface MarketStatusPresentation {
  label: string;
  description: string;
}

const STATUS_MAP: Record<string, MarketStatusPresentation> = {
  NORMAL_OPEN: {
    label: "Trading live",
    description: "Regular market session is active. Alerts are monitoring prices.",
  },
  NORMAL_CLOSE: {
    label: "Session ended",
    description: "Regular trading has closed for the day.",
  },
  PRE_OPEN_START: {
    label: "Pre-open started",
    description: "Pre-open order collection has begun.",
  },
  PRE_OPEN_END: {
    label: "Pre-open ended",
    description: "Pre-open session finished. Regular session starts soon.",
  },
  CLOSING_START: {
    label: "Closing auction",
    description: "Closing price discovery session is in progress.",
  },
  CLOSING_END: {
    label: "Closing session ended",
    description: "All trading sessions are done for today.",
  },
  OPEN: {
    label: "Market open",
    description: "The exchange is open for trading.",
  },
  CLOSE: {
    label: "Market closed",
    description: "The exchange is closed.",
  },
};

export function formatMarketStatus(status: string | undefined): MarketStatusPresentation {
  const key = (status ?? "UNKNOWN").toUpperCase();

  if (STATUS_MAP[key]) {
    return STATUS_MAP[key];
  }

  const friendly = key.replaceAll("_", " ").toLowerCase();
  return {
    label: friendly.charAt(0).toUpperCase() + friendly.slice(1),
    description: `Exchange status: ${friendly}`,
  };
}
