import { describe, expect, it } from "vitest";
import {
  buildRoadmapTasks,
  calculateEstimatedFundingGap,
  getNextBestStep,
  roadmapProfileDefaults,
} from "./fundingRoadmap";

describe("funding roadmap logic", () => {
  it("prioritizes FAFSA preparation for students applying and not started", () => {
    const profile = {
      ...roadmapProfileDefaults,
      gradeLevel: "12",
      applicationStatus: "applying",
      fafsaStatus: "not started",
      intendedEnrollment: "2027",
      school: "Northside High School",
      major: "Computer Science",
    };

    const tasks = buildRoadmapTasks(profile, {});
    const nextStep = getNextBestStep(profile, tasks);

    expect(nextStep?.title).toContain("FAFSA");
    expect(nextStep?.why).toContain("application");
  });

  it("shows a check-off deadline placeholder when no verified deadline exists", () => {
    const tasks = buildRoadmapTasks({ ...roadmapProfileDefaults, gradeLevel: "9" }, {});

    expect(tasks.some((task) => task.deadline === "Check official deadline")).toBe(true);
  });

  it("calculates annual cost and remaining gap correctly, including negative minimums", () => {
    const estimate = calculateEstimatedFundingGap({
      tuitionAndFees: "12000",
      housingFood: "6000",
      otherExpenses: "1500",
      grants: "1000",
      scholarships: "3000",
      otherAssistance: "2500",
    });

    expect(estimate.annualCost).toBe(19500);
    expect(estimate.remainingCost).toBe(13000);

    const negativeEstimate = calculateEstimatedFundingGap({
      tuitionAndFees: "5000",
      housingFood: "2000",
      otherExpenses: "1000",
      grants: "6000",
      scholarships: "2000",
      otherAssistance: "500",
    });

    expect(negativeEstimate.remainingCost).toBeLessThan(0);
    expect(negativeEstimate.note).toContain("preliminary estimate");
  });
});
