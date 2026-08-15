export function buildTriggerId(
  alertId: string,
  instrumentKey: string,
  currentPrice: number,
  timestamp: string,
): string {
  return `${alertId}:${instrumentKey}:${currentPrice}:${timestamp}`;
}

export class IdempotencyGuard {
  private readonly processed = new Set<string>();

  hasProcessed(triggerId: string): boolean {
    return this.processed.has(triggerId);
  }

  markProcessed(triggerId: string): void {
    this.processed.add(triggerId);
  }
}
