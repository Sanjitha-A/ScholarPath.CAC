import { beforeEach, describe, expect, it } from "vitest";
import { DEMO_DATABASE_KEY, demoApiRequest } from "./demoDatabase";

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
      body: JSON.stringify({ fullName: "Demo Student", username, email: "demo@example.com", password }),
    });
    await demoApiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    await demoApiRequest("/profile", {
      method: "PUT",
      body: JSON.stringify({
        profile: {
          gpa: "3.9",
          apCount: "7",
          apTests3Plus: "5",
          isInUS: "yes",
          state: "California",
          leadershipActivities: "Student council",
        },
      }),
    });
    await demoApiRequest("/logout", { method: "POST" });
    await demoApiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    const response = await demoApiRequest("/me");
    expect(response.user.email).toBe("demo@example.com");
    expect(response.user.profile.gpa).toBe("3.9");
    expect(response.user.profile.apCount).toBe("7");
    expect(response.user.profile.apTests3Plus).toBe("5");
    expect(response.user.profile.isInUS).toBe("yes");
    expect(response.user.profile.state).toBe("California");
    expect(response.user.profile.leadershipActivities).toBe("Student council");
    expect(values.get(DEMO_DATABASE_KEY)).not.toContain(password);
  });

  it("does not seed an account or grant client-side admin privileges", async () => {
    const response = await demoApiRequest("/newsletters");
    const database = JSON.parse(values.get(DEMO_DATABASE_KEY) ?? "{}");
    expect(database.users).toEqual([]);
    expect(response.newsletters).toEqual([]);
  });

  it("removes admin privileges from previously saved browser accounts", async () => {
    values.set(DEMO_DATABASE_KEY, JSON.stringify({
      users: [{
        id: "old-admin",
        username: "admin",
        fullName: "Old Demo Admin",
        email: null,
        isAdmin: true,
        profile: {},
        passwordSalt: "",
        passwordHash: "",
      }],
      newsletters: [],
      currentUserId: "old-admin",
      nextNewsletterId: 1,
    }));

    await demoApiRequest("/newsletters");

    const database = JSON.parse(values.get(DEMO_DATABASE_KEY) ?? "{}");
    expect(database.users[0].isAdmin).toBe(false);
  });

  it("does not allow a registered browser account to publish admin newsletters", async () => {
    await demoApiRequest("/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Demo Student",
        username: "demo-student",
        password: "LongDemoPassword123!",
      }),
    });
    await demoApiRequest("/login", {
      method: "POST",
      body: JSON.stringify({ username: "demo-student", password: "LongDemoPassword123!" }),
    });

    await expect(demoApiRequest("/admin/newsletters", {
      method: "POST",
      body: JSON.stringify({ title: "Demo update", summary: "Sample newsletter", category: "General" }),
    })).rejects.toThrow("Admin access required.");
  });
});