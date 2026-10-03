import { describe, expect, it } from "vitest";
import { profileDefaults } from "./auth";
import { getProfileRecommendations } from "./recommendations";

const scholarships = [
  { title: "Engineering Award", type: "Scholarship" as const, keywords: ["engineering", "computer", "science", "stem", "academic", "gpa"] },
  { title: "Community Service Award", type: "Scholarship" as const, keywords: ["community", "service", "leadership"] },
];

const financialAid = [
  { title: "General Federal Aid", type: "Financial aid" as const, keywords: ["all", "federal", "financial", "aid"] },
];

describe("profile-based opportunity matching", () => {
  it("returns no personalized matches when the matching profile fields are empty", () => {
    expect(getProfileRecommendations(profileDefaults, scholarships, financialAid)).toEqual([]);
  });

  it("changes scholarship rankings with academics and interests, not demographic fields", () => {
    const engineeringProfile = {
      ...profileDefaults,
      gpa: "3.9",
      major: "Computer Science",
    };
    const serviceProfile = {
      ...profileDefaults,
      interests: "Community volunteering and service",
    };
    const demographicOnlyProfile = {
      ...profileDefaults,
      ethnicity: "Asian",
      gender: "Woman",
    };

    expect(getProfileRecommendations(engineeringProfile, scholarships, financialAid)[0].title).toBe("Engineering Award");
    expect(getProfileRecommendations(serviceProfile, scholarships, financialAid)[0].title).toBe("Community Service Award");
    expect(getProfileRecommendations(demographicOnlyProfile, scholarships, financialAid)).toEqual([]);
  });
});