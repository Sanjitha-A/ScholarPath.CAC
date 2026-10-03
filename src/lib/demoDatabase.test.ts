import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_ADMIN_PASSWORD, DEMO_DATABASE_KEY, demoApiRequest } from "./demoDatabase";

describe("browser demo database", () => {
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

  it("registers, authenticates, and persists profile updates without storing a plain password", async () => {
    const username = "demo-test-student";
    const password = "LongDemoPassword123!";

    await demoApiRequest("/register", {
      method: "POST",
      body: JSON.stringify({ fullName: "Demo Student", username, password }),
    });
    await demoApiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    await demoApiRequest("/profile", {
      method: "PUT",
      body: JSON.stringify({ profile: { gpa: "3.9", apCount: "7" } }),
    });
    await demoApiRequest("/logout", { method: "POST" });
    await demoApiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const response = await demoApiRequest("/me");
    expect(response.user.profile.gpa).toBe("3.9");
    expect(response.user.profile.apCount).toBe("7");
    expect(values.get(DEMO_DATABASE_KEY)).not.toContain(password);
  });

  it("seeds only the admin, with no student accounts or newsletters", async () => {
    const response = await demoApiRequest("/newsletters");
    const database = JSON.parse(values.get(DEMO_DATABASE_KEY) ?? "{}");
    expect(database.users.map((user: { username: string }) => user.username)).toEqual(["admin"]);
    expect(response.newsletters).toEqual([]);
    await expect(demoApiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username: "student", password: "NotARealPassword123!" }),
    })).rejects.toThrow("No account matched those credentials.");
  });

  it("allows the seeded admin to publish demo newsletters", async () => {
    await demoApiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username: "admin", password: DEMO_ADMIN_PASSWORD }),
    });
    await demoApiRequest("/admin/newsletters", {
      method: "POST",
      body: JSON.stringify({ title: "Demo update", summary: "Sample newsletter", category: "General" }),
    });

    const response = await demoApiRequest("/newsletters");
    expect(response.newsletters[0].title).toBe("Demo update");
  });
});