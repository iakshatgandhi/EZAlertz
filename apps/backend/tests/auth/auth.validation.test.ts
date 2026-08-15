import { describe, expect, it } from "vitest";
import { registerSchema, loginSchema } from "../../src/auth/auth.validation.js";

describe("auth.validation", () => {
  it("validates register input", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      whatsappPhone: "919876543210",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("validates login input", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });
});
