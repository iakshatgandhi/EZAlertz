import type {
  AlertCondition,
  AlertMode,
  AlertStatus,
} from "@stock-alert/shared-types";

export interface EngineAlert {
  id: string;
  userId: string;
  instrumentId: string;
  instrumentKey: string;
  symbol: string;
  companyName: string;
  conditionType: AlertCondition;
  targetPrice: number;
  alertMode: AlertMode;
  status: AlertStatus;
  previousPrice: number | null;
  lastPrice: number | null;
}
