declare module "upstox-js-sdk" {
  export class ApiClient {
    static instance: {
      authentications: {
        OAUTH2: {
          accessToken: string;
        };
      };
    };
  }

  export class MarketDataStreamerV3 {
    constructor(instrumentKeys?: string[], mode?: string);
    connect(): Promise<void>;
    disconnect(): void;
    subscribe(instrumentKeys: string[], mode: string): void;
    unsubscribe(instrumentKeys: string[]): void;
    autoReconnect(enable: boolean, interval: number, retryCount: number): void;
    on(event: string, handler: (...args: unknown[]) => void): void;
  }
}
