import type { AlertCondition } from "@stock-alert/shared-types";

export interface CrossingInput {
  conditionType: AlertCondition;
  targetPrice: number;
  previousPrice: number | null;
  currentPrice: number;
}

export function detectCrossing(input: CrossingInput): boolean {
  const { conditionType, targetPrice, previousPrice, currentPrice } = input;

  if (previousPrice === null) {
    return false;
  }

  if (conditionType === "BELOW") {
    return previousPrice >= targetPrice && currentPrice < targetPrice;
  }

  return previousPrice <= targetPrice && currentPrice > targetPrice;
}
