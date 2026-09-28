import { describe, expect, it } from "vitest";
import { createUser, getStoredUsers, loginUser, saveUserProfile } from "./auth";

describe("ScholarPath auth flow", () => {
  it("registers a user and then allows a matching login", () => {
    const users = getStoredUsers();
    const created = createUser(users, {
      username: "alex",
      password: "secret123",
      profile: {
        ethnicity: "Hispanic/Latino",
        gender: "Woman",
        age: "19",
        gpa: "3.9",
        apCount: "6",
      },
    });

    expect(created).toHaveLength(users.length + 1);
    expect(loginUser(created, "alex", "secret123")).toBeTruthy();
    expect(loginUser(created, "alex", "wrongPass")).toBeNull();
  });

  it("accepts a registered account even when legacy saved data has extra whitespace", () => {
    const legacyUsers = [
      {
        username: "  Alex  ",
        password: " secret123 ",
        profile: {
          ethnicity: "",
          gender: "",
          age: "",
          gpa: "",
          apCount: "",
        },
      },
    ];

    expect(loginUser(legacyUsers, "alex", "secret123")).toMatchObject({ username: "  Alex  " });
  });

  it("updates a profile only for the logged-in user", () => {
    const initialUsers = [
      {
        username: "riley",
        password: "abc123",
        profile: {
          ethnicity: "",
          gender: "",
          age: "",
          gpa: "",
          apCount: "",
        },
      },
    ];

    const updated = saveUserProfile(initialUsers, "riley", {
      ethnicity: "Asian",
      gender: "Non-binary",
      age: "21",
      gpa: "3.8",
      apCount: "8",
    });

    expect(updated[0].profile.ethnicity).toBe("Asian");
    expect(updated[0].profile.gpa).toBe("3.8");
  });
});
