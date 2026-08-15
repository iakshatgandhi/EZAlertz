import type { AlertMode, AlertStatus } from "@stock-alert/shared-types";

export function nextAlertStatus(
  currentStatus: AlertStatus,
  alertMode: AlertMode,
  triggered: boolean,
): AlertStatus {
  if (!triggered || currentStatus !== "ACTIVE") {
    return currentStatus;
  }

  if (alertMode === "ONE_TIME") {
    return "TRIGGERED";
  }

  return "ACTIVE";
}
