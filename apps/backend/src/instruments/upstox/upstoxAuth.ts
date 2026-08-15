import { UnauthorizedError } from "../../shared/errors.js";

export async function validateUpstoxAccessToken(accessToken: string): Promise<boolean> {
  const url = new URL("https://api.upstox.com/v3/market-quote/ltp");
  url.searchParams.set("instrument_key", "NSE_EQ|INE002A01018");

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  });

  if (response.status === 401) {
    return false;
  }

  return response.ok;
}

export function assertUpstoxAuthorized(status: number, context: string): void {
  if (status === 401) {
    throw new UnauthorizedError(
      `Upstox access token is invalid or expired (${context}). ` +
        "Regenerate UPSTOX_ACCESS_TOKEN from the Upstox developer portal.",
    );
  }
}
