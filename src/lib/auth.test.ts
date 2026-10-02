import { beforeEach, describe, expect, it } from "vitest";
import { clearLegacyAuthData, SESSION_KEY, STORAGE_KEY } from "./auth";

describe("ScholarPath session storage", () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        localStorage: {
          getItem: (key: string) => values.get(key) ?? null,
          setItem: (key: string, value: string) => values.set(key, value),
          removeItem: (key: string) => values.delete(key),
        },
      },
    });
  });

  it("removes old browser-stored accounts and username-only sessions", () => {
    values.set(STORAGE_KEY, JSON.stringify([{ username: "alex", password: "plain-text" }]));
    values.set(SESSION_KEY, "alex");
    values.set("scholarpath_token_v1", "legacy-token");
    clearLegacyAuthData();
    expect(values.has(STORAGE_KEY)).toBe(false);
    expect(values.has(SESSION_KEY)).toBe(false);
    expect(values.has("scholarpath_token_v1")).toBe(false);
  });
});
