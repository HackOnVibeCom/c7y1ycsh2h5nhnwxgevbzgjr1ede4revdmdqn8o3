import { describe, expect, it } from "vitest";

function healthPayload(): { ok: boolean; app: string } {
  return { ok: true, app: "launchdesk" };
}

describe("smoke", () => {
  it("health payload shape matches", () => {
    expect(healthPayload()).toEqual({ ok: true, app: "launchdesk" });
  });
});