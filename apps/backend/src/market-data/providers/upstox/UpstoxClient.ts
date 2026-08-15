import * as Upstox from "upstox-js-sdk";
import { logger } from "../../../shared/logger.js";
import { formatUnknownError } from "../../../shared/formatError.js";
import { mapUpstoxMessage } from "./mapUpstoxTick.js";
import { DEFAULT_MARKET_DATA_MODE } from "../../../config/constants.js";

type StreamerInstance = InstanceType<typeof Upstox.MarketDataStreamerV3>;

export class UpstoxClientWrapper {
  private streamer: StreamerInstance | null = null;

  constructor(private readonly accessToken: string) {
    Upstox.ApiClient.instance.authentications.OAUTH2.accessToken = accessToken;
  }

  createStreamer(instrumentKeys: string[] = []): StreamerInstance {
    this.streamer = new Upstox.MarketDataStreamerV3(
      instrumentKeys,
      DEFAULT_MARKET_DATA_MODE,
    );
    return this.streamer;
  }

  getStreamer(): StreamerInstance | null {
    return this.streamer;
  }

  clearStreamer(): void {
    this.streamer = null;
  }

  attachMessageHandler(
    streamer: StreamerInstance,
    onTicks: (ticks: ReturnType<typeof mapUpstoxMessage>) => void,
  ): void {
    streamer.on("message", (message: unknown) => {
      let payload: unknown = message;

      if (typeof message === "string") {
        try {
          payload = JSON.parse(message);
        } catch {
          logger.debug({ message }, "Non-JSON Upstox message received");
          return;
        }
      }

      const ticks = mapUpstoxMessage(payload);
      if (ticks.length > 0) {
        onTicks(ticks);
      }
    });

    streamer.on("error", (error: unknown) => {
      logger.error(
        { error: formatUnknownError(error) },
        "Upstox streamer error — check UPSTOX_ACCESS_TOKEN if this repeats",
      );
    });
  }
}
