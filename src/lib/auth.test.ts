import { beforeEach, describe, expect, it } from "vitest";
import {
  clearLegacyAuthData,
  normalizeStudentProfile,
  SESSION_KEY,
  STORAGE_KEY,
} from "./auth";

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

describe("student profile normalization", () => {
  it("keeps form fields controlled when stored profiles are incomplete", () => {
    const profile = normalizeStudentProfile({ ethnicity: undefined, gpa: "3.8" });

    expect(profile.ethnicity).toBe("");
    expect(profile.gender).toBe("");
    expect(profile.grade).toBe("");
    expect(profile.gpa).toBe("3.8");
    expect(profile.apTests3Plus).toBe("");
    expect(profile.citizenshipStatus).toBe("");
    expect(profile.familyIncomeRange).toBe("");
    expect(profile.isInUS).toBe("");
    expect(profile.state).toBe("");
    expect(profile.leadershipActivities).toBe("");
    expect(profile.newsletters).toEqual([]);
  });

  it("preserves the selected grade level", () => {
    expect(normalizeStudentProfile({ grade: "11" }).grade).toBe("11");
  });

  it("preserves the added academic and location details", () => {
    const profile = normalizeStudentProfile({
      apTests3Plus: "3",
      isInUS: "yes",
      state: "California",
      leadershipActivities: "Student council",
    });

    expect(profile.apTests3Plus).toBe("3");
    expect(profile.isInUS).toBe("yes");
    expect(profile.state).toBe("California");
    expect(profile.leadershipActivities).toBe("Student council");
  });
});
