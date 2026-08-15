export type AlertCondition = "ABOVE" | "BELOW";
export type AlertMode = "ONE_TIME" | "RECURRING";
export type AlertStatus = "ACTIVE" | "TRIGGERED" | "DISABLED" | "ERROR";
export type NotificationChannel = "WHATSAPP" | "EMAIL" | "PUSH" | "TELEGRAM";
export type NotificationStatus = "PENDING" | "SENT" | "FAILED";
export type MarketDataConnectionStatus =
  | "connected"
  | "reconnecting"
  | "disconnected";

export interface NormalizedTick {
  instrumentKey: string;
  symbol: string;
  exchange: string;
  ltp: number;
  timestamp: string;
}

export interface Instrument {
  id: string;
  symbol: string;
  companyName: string;
  exchange: string;
  instrumentKey: string;
  instrumentType: string;
  isActive: boolean;
}

export interface User {
  id: string;
  email: string;
  whatsappPhone: string | null;
}

export interface Alert {
  id: string;
  userId: string;
  instrumentId: string;
  conditionType: AlertCondition;
  targetPrice: number;
  alertMode: AlertMode;
  status: AlertStatus;
  previousPrice: number | null;
  lastPrice: number | null;
  createdAt: string;
  triggeredAt: string | null;
  updatedAt: string;
  instrument?: Instrument;
}

export interface CreateAlertRequest {
  instrumentId: string;
  condition: AlertCondition;
  targetPrice: number;
  mode: AlertMode;
}

export interface SystemStatus {
  marketData: MarketDataConnectionStatus;
  subscribedInstruments: number;
  uptimeSeconds: number;
  devUserId?: string | null;
  latestTick?: {
    instrumentKey: string;
    ltp: number;
    timestamp: string;
  } | null;
}

export type SSEEventType =
  | "PRICE_UPDATE"
  | "ALERT_CREATED"
  | "ALERT_TRIGGERED"
  | "ALERT_DISABLED"
  | "ALERT_DELETED"
  | "CONNECTION_STATUS";

export interface SSEEvent<T = unknown> {
  type: SSEEventType;
  data: T;
  timestamp: string;
}

export interface PriceUpdateEvent {
  instrumentKey: string;
  symbol: string;
  exchange: string;
  ltp: number;
}
