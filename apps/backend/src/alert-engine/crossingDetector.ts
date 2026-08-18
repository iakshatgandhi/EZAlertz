import type { AlertCondition } from "@stock-alert/shared-types";

export interface CrossingInput {
  conditionType: AlertCondition;
  targetPrice: number;
  previousPrice: number | null;
  currentPrice: number;
}

export function isConditionMet(input: Omit<CrossingInput, "previousPrice">): boolean {
  const { conditionType, targetPrice, currentPrice } = input;

  if (conditionType === "BELOW") {
    return currentPrice <= targetPrice;
  }

  return currentPrice >= targetPrice;
}

export function detectCrossing(input: CrossingInput): boolean {
  const { conditionType, targetPrice, previousPrice, currentPrice } = input;

  const metNow = isConditionMet({ conditionType, targetPrice, currentPrice });

  if (previousPrice === null) {
    return metNow;
  }

  const metBefore = isConditionMet({
    conditionType,
    targetPrice,
    currentPrice: previousPrice,
  });

  return !metBefore && metNow;
}
