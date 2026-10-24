import { describe, expect, it } from "vitest";
import { profileDefaults } from "./auth";
import { getEligibilityAssessment, getProfileRecommendations, getRecommendationReasons } from "./recommendations";

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

  it("explains matches with the specific profile fields that matched", () => {
    const profile = {
      ...profileDefaults,
      major: "Biomedical Engineering",
      interests: "Medical research and healthcare",
      gpa: "3.8",
      apCount: "6",
      ethnicity: "Asian",
    };
    const biomedicalScholarship = {
      type: "Scholarship" as const,
      keywords: ["biomedical", "engineering", "medical", "research", "academic"],
    };

    const reasons = getRecommendationReasons(profile, biomedicalScholarship);

    expect(reasons.map((reason) => reason.label)).toEqual([
      "Intended major",
      "Interests and goals",
      "GPA",
      "AP classes",
    ]);
    expect(reasons[0].detail).toContain("biomedical, engineering");
    expect(reasons[1].detail).toContain("medical, research");
    expect(reasons.some((reason) => reason.detail.includes("Asian"))).toBe(false);
  });

  it("separates explicit eligibility evidence from unknowns and possible disqualifiers", () => {
    const opportunity = {
      type: "Scholarship" as const,
      keywords: ["engineering"],
      forWho: "Students pursuing engineering with financial need and a minimum GPA of 3.5.",
    };

    const assessment = getEligibilityAssessment(
      { ...profileDefaults, major: "Engineering", gpa: "3.2" },
      opportunity,
    );

    expect(assessment.met).toContain("Field of study aligns with the provider summary (engineering)");
    expect(assessment.unknown).toContain("Financial need or Pell Grant eligibility (family income alone does not establish eligibility)");
    expect(assessment.mayDisqualify).toContain("Minimum GPA of 3.5 (profile GPA: 3.2)");
  });

  it("keeps missing or non-numeric eligibility facts unknown", () => {
    const assessment = getEligibilityAssessment(profileDefaults, {
      type: "Scholarship",
      keywords: ["academic"],
      forWho: "High school seniors with academic potential and a minimum GPA of 3.0.",
    });

    expect(assessment.unknown).toContain("Minimum GPA of 3.0 (your GPA is not provided)");
    expect(assessment.unknown).toContain("Education, enrollment, work, or applicant status");
    expect(assessment.mayDisqualify).toEqual([]);
  });

  it("assesses citizenship status and stated family-income consideration ranges", () => {
    const opportunity = {
      type: "Scholarship" as const,
      keywords: ["academic"],
      forWho: "U.S. citizens or permanent residents; annual gross family income up to $95,000 may be considered.",
    };
    const assessment = getEligibilityAssessment({
      ...profileDefaults,
      citizenshipStatus: "permanent-resident",
      familyIncomeRange: "75000-95000",
    }, opportunity);

    expect(assessment.met).toContain("U.S. citizen or permanent resident requirement matches the profile status");
    expect(assessment.met).toContain("Family income range is at or below $95,000 (provider review required)");
    expect(assessment.mayDisqualify).toEqual([]);
  });

  it("does not infer Pell eligibility from family income", () => {
    const assessment = getEligibilityAssessment({
      ...profileDefaults,
      familyIncomeRange: "under-50000",
    }, {
      type: "Scholarship",
      keywords: ["need"],
      forWho: "Students who qualify for a Federal Pell Grant.",
    });

    expect(assessment.unknown).toContain("Financial need or Pell Grant eligibility (family income alone does not establish eligibility)");
  });

  it("returns different results when the profile changes", () => {
    const computerScienceProfile = {
      ...profileDefaults,
      gpa: "3.9",
      apCount: "8",
      major: "Computer Science",
      interests: "Artificial intelligence and software engineering",
    };
    const communityServiceProfile = {
      ...profileDefaults,
      gpa: "3.7",
      apCount: "4",
      major: "Education",
      interests: "Community volunteering and leadership",
    };
    const biomedicalProfile = {
      ...profileDefaults,
      gpa: "3.8",
      apCount: "6",
      major: "Biomedical Engineering",
      interests: "Medical research and healthcare innovation",
    };
    const scholarshipCatalog = [
      { title: "Computer Science Excellence", type: "Scholarship" as const, keywords: ["computer", "science", "engineering", "stem", "academic"] },
      { title: "Community Leadership Award", type: "Scholarship" as const, keywords: ["community", "leadership", "service", "volunteer"] },
      { title: "NIH Undergraduate Scholarship Program", type: "Scholarship" as const, keywords: ["biomedical", "biology", "medicine", "health", "research", "science", "stem", "clinical"] },
      { title: "Amgen Scholars", type: "Scholarship" as const, keywords: ["biomedical", "biology", "research", "science", "stem", "health"] },
    ];
    const aidCatalog = [
      { title: "STEM Access Grant", type: "Financial aid" as const, keywords: ["stem", "technology", "grant", "need"] },
      { title: "Teaching Support Grant", type: "Financial aid" as const, keywords: ["teacher", "education", "grant", "need"] },
    ];

    const computerScienceResults = getProfileRecommendations(computerScienceProfile, scholarshipCatalog, aidCatalog);
    const communityServiceResults = getProfileRecommendations(communityServiceProfile, scholarshipCatalog, aidCatalog);
    const biomedicalResults = getProfileRecommendations(biomedicalProfile, scholarshipCatalog, aidCatalog);

    expect(computerScienceResults[0].title).toBe("Computer Science Excellence");
    expect(computerScienceResults.map((item) => item.title)).toContain("STEM Access Grant");
    expect(communityServiceResults[0].title).toBe("Community Leadership Award");
    expect(communityServiceResults[1].title).toBe("Teaching Support Grant");
    expect(biomedicalResults[0].title).toBe("NIH Undergraduate Scholarship Program");
    expect(biomedicalResults[1].title).toBe("Amgen Scholars");
  });

  it("returns up to seven relevant opportunities in each category", () => {
    const profile = { ...profileDefaults, gpa: "3.9", apCount: "8" };
    const manyScholarships = Array.from({ length: 9 }, (_, index) => ({
      title: `Academic scholarship ${index + 1}`,
      type: "Scholarship" as const,
      keywords: ["academic", "gpa", "merit"],
    }));
    const manyAidOptions = Array.from({ length: 9 }, (_, index) => ({
      title: `General aid option ${index + 1}`,
      type: "Financial aid" as const,
      keywords: ["all", "general", "financial aid"],
    }));

    const results = getProfileRecommendations(profile, manyScholarships, manyAidOptions);

    expect(results.filter((item) => item.type === "Scholarship")).toHaveLength(7);
    expect(results.filter((item) => item.type === "Financial aid")).toHaveLength(7);
  });
});