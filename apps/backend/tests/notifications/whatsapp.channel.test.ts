import { describe, expect, it, vi } from "vitest";
import {
  normalizePhone,
  WhatsAppChannel,
} from "../../src/notifications/channels/whatsapp.channel.js";

describe("normalizePhone", () => {
  it("strips non-digit characters", () => {
    expect(normalizePhone("+91 98765-43210")).toBe("919876543210");
  });
});

describe("WhatsAppChannel", () => {
  it("sends message via Meta API", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.test" }] }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const channel = new WhatsAppChannel("test-token", "123456789");
    const result = await channel.send({
      notificationId: "notif-1",
      alertId: "alert-1",
      userId: "user-1",
      phone: "+919876543210",
      message: "RELIANCE crossed below ₹1450. Current price: ₹1449.80.",
    });

    expect(result.providerMessageId).toBe("wamid.test");
    expect(fetchMock).toHaveBeenCalledOnce();

    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("123456789/messages");
    expect(options.headers).toMatchObject({
      Authorization: "Bearer test-token",
    });

    vi.unstubAllGlobals();
  });

  it("throws on API error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: { message: "Invalid token" } }),
      })),
    );

    const channel = new WhatsAppChannel("bad-token", "123456789");

    await expect(
      channel.send({
        notificationId: "notif-1",
        alertId: "alert-1",
        userId: "user-1",
        phone: "919876543210",
        message: "test",
      }),
    ).rejects.toThrow("Invalid token");

    vi.unstubAllGlobals();
  });
});
