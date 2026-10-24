import type { StudentProfile } from "./auth";

export type OpportunityCandidate = {
  type: "Scholarship" | "Financial aid";
  keywords: readonly string[];
  forWho?: string;
};

export type RecommendationReason = {
  label: string;
  detail: string;
};

export type EligibilityAssessment = {
  met: string[];
  unknown: string[];
  mayDisqualify: string[];
};

const topicGroups = [
  ["stem", "science", "math", "engineering", "technology", "tech", "computer", "biology", "health", "medicine"],
  ["community", "leadership", "service", "volunteer", "impact"],
  ["business", "finance", "entrepreneur"],
  ["education", "teacher", "teaching", "counseling"],
];

const genericKeywords = new Set(["all", "general", "college", "scholarship", "financial", "aid", "federal"]);
const academicKeywords = new Set(["academic", "gpa", "merit", "grades", "stem"]);
const eligibilityStopWords = new Set([
  "a", "an", "and", "or", "the", "for", "to", "in", "of", "with", "who", "their", "they",
  "students", "student", "people", "demonstrating", "demonstrated", "pursuing", "pursue", "interested",
  "career", "careers", "related", "eligible", "qualifying", "current", "program", "programs", "higher",
  "education", "college", "academic", "achievement", "potential", "strong", "high", "need", "financial",
  "leadership", "community", "service", "work", "experience", "requirements", "meet", "meeting",
]);

function words(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

export function getEligibilityAssessment(
  profile: StudentProfile,
  opportunity: OpportunityCandidate,
): EligibilityAssessment {
  const summary = opportunity.forWho ?? "";
  const assessment: EligibilityAssessment = { met: [], unknown: [], mayDisqualify: [] };
  const addUnknown = (criterion: string) => {
    if (!assessment.unknown.includes(criterion)) assessment.unknown.push(criterion);
  };

  const gpaMinimum = summary.match(/(?:minimum\s+GPA\s*(?:of\s*)?|GPA\s*(?:of\s*)?(?:at least|>=|≥)\s*)(\d(?:\.\d+)?)/i);
  if (gpaMinimum) {
    const minimum = Number(gpaMinimum[1]);
    const gpa = Number(profile.gpa);
    if (!Number.isFinite(gpa) || gpa <= 0) {
      addUnknown(`Minimum GPA of ${minimum.toFixed(1)} (your GPA is not provided)`);
    } else if (gpa >= minimum) {
      assessment.met.push(`Minimum GPA of ${minimum.toFixed(1)} (profile GPA: ${profile.gpa})`);
    } else {
      assessment.mayDisqualify.push(`Minimum GPA of ${minimum.toFixed(1)} (profile GPA: ${profile.gpa})`);
    }
  } else if (/\b(high-achieving|academic achievement|academic potential|academic commitment|academic excellence|merit)\b/i.test(summary)) {
    addUnknown("Academic standing (the provider's specific standard is not listed)");
  }

  if (/\b(u\.?s\.? citizens?|citizenship|permanent residents?|immigration-status|residency requirements)\b/i.test(summary)) {
    const status = profile.citizenshipStatus;
    if (!status || status === "prefer-not-to-say") {
      addUnknown("U.S. citizenship or eligible immigration status (not provided)");
    } else {
      const allowsPermanentResidents = /permanent resident/i.test(summary);
      const allowsOtherEligibleStatuses = /eligible (?:u\.?s\.? )?citizenship or immigration-status requirements|eligible noncitizen/i.test(summary);
      const qualifies = status === "us-citizen"
        || (allowsPermanentResidents && status === "permanent-resident")
        || (allowsOtherEligibleStatuses && status === "eligible-noncitizen");
      const requirement = allowsPermanentResidents
        ? "U.S. citizen or permanent resident"
        : allowsOtherEligibleStatuses
          ? "eligible U.S. citizenship or immigration status"
          : "U.S. citizen";

      if (qualifies) {
        assessment.met.push(`${requirement} requirement matches the profile status`);
      } else {
        assessment.mayDisqualify.push(`${requirement} requirement does not match the profile status`);
      }
    }
  }

  const incomeLimit = summary.match(/(?:annual gross family income|family income|income)\s+(?:of\s+)?(?:up to|under|below|no more than)\s+\$?([\d,]+)/i);
  if (incomeLimit) {
    const limit = Number(incomeLimit[1].replace(/,/g, ""));
    const incomeRange = profile.familyIncomeRange;
    const rangeCeilings: Record<string, number> = {
      "under-50000": 49999,
      "50000-74999": 74999,
      "75000-95000": 95000,
    };
    if (incomeRange in rangeCeilings && rangeCeilings[incomeRange] <= limit) {
      assessment.met.push(`Family income range is at or below $${limit.toLocaleString()} (provider review required)`);
    } else if (incomeRange === "over-95000" && limit <= 95000) {
      assessment.unknown.push(`Family income may be above the $${limit.toLocaleString()} consideration level`);
    } else {
      addUnknown(`Family income range compared with the $${limit.toLocaleString()} consideration level`);
    }
  }

  if (/\b(need|low-income|income|financial obstacles|Pell Grant)\b/i.test(summary)) {
    addUnknown("Financial need or Pell Grant eligibility (family income alone does not establish eligibility)");
  }

  if (/\b(high school seniors?|undergraduates?|graduates?|professional students?|enrolled|attending college|college students?|teachers?|AmeriCorps|taxpayers?|parents? of)\b/i.test(summary)) {
    addUnknown("Education, enrollment, work, or applicant status");
  }

  if (/\b(pursu\w*|interested in|career|field|profession|major)\b/i.test(summary)) {
    const majorWords = [...words(profile.major ?? "")].filter((word) => !eligibilityStopWords.has(word));
    const requirementWords = words(summary);
    const matchingMajorWords = majorWords.filter((word) => requirementWords.has(word));
    if (matchingMajorWords.length) {
      assessment.met.push(`Field of study aligns with the provider summary (${matchingMajorWords.join(", ")})`);
    } else {
      addUnknown("Required field of study or career path (not confirmed by your intended major)");
    }
  }

  if (/\b(leadership|service|volunteer|work experience|research project|research experience|commit to|willing to)\b/i.test(summary)) {
    addUnknown("Required experience, activity, or service commitment");
  }

  if (/\b(eligible program|eligible institution|accredited|school's timeline|school timeline)\b/i.test(summary)) {
    addUnknown("Program, institution, or school-specific requirements");
  }

  if (!assessment.met.length && !assessment.unknown.length && !assessment.mayDisqualify.length) {
    addUnknown(summary || "Provider eligibility requirements are not described in the catalog");
  }

  return assessment;
}

export function getRecommendationReasons(
  profile: StudentProfile,
  opportunity: OpportunityCandidate,
): RecommendationReason[] {
  const profileFields: Array<[string, string]> = [
    ["Intended major", profile.major ?? ""],
    ["Interests and goals", profile.interests ?? ""],
  ];
  const keywordWords = new Set(opportunity.keywords.flatMap((keyword) => [...words(keyword)]));
  const reasons: RecommendationReason[] = [];

  for (const [label, value] of profileFields) {
    const matchingWords = [...words(value)].filter(
      (word) => keywordWords.has(word) && !genericKeywords.has(word),
    );
    if (matchingWords.length) {
      reasons.push({
        label,
        detail: `Your ${label.toLowerCase()} mention ${matchingWords.join(", ")}, which align with this opportunity.`,
      });
    }
  }

  const supportsAcademics = opportunity.keywords.some(
    (keyword) => words(keyword).size === 1 && academicKeywords.has(keyword.toLowerCase()),
  );
  const gpa = Number(profile.gpa);
  if (supportsAcademics && Number.isFinite(gpa) && gpa > 0) {
    reasons.push({
      label: "GPA",
      detail: `Your GPA of ${profile.gpa} was considered for this academic-focused opportunity.`,
    });
  }

  const apCount = Number(profile.apCount);
  if (supportsAcademics && Number.isFinite(apCount) && apCount > 0) {
    reasons.push({
      label: "AP classes",
      detail: `Your ${profile.apCount} AP classes were considered for this academic-focused opportunity.`,
    });
  }

  return reasons;
}

export function getProfileRecommendations<
  TScholarship extends OpportunityCandidate,
  TFinancialAid extends OpportunityCandidate,
>(
  profile: StudentProfile,
  scholarships: readonly TScholarship[],
  financialAid: readonly TFinancialAid[],
): Array<(TScholarship | TFinancialAid) & { match: number }> {
  const interestText = `${profile.major ?? ""} ${profile.interests ?? ""}`.trim();
  const profileWords = words(interestText);
  const gpa = Number(profile.gpa);
  const apCount = Number(profile.apCount);
  const hasGpa = Number.isFinite(gpa) && gpa > 0;
  const hasApCount = Number.isFinite(apCount) && apCount > 0;

  if (!profileWords.size && !hasGpa && !hasApCount) return [];

  const candidates = [...scholarships, ...financialAid];
  return candidates
    .map((item) => {
      const keywordWords = new Set(item.keywords.flatMap((keyword) => [...words(keyword)]));
      const specificOverlap = [...profileWords].filter(
        (word) => keywordWords.has(word) && !genericKeywords.has(word),
      ).length;
      const matchingTopicGroups = topicGroups.filter((group) =>
        group.some((word) => profileWords.has(word)) && group.some((word) => keywordWords.has(word)),
      ).length;
      const supportsAcademics = item.keywords.some(
        (keyword) => words(keyword).size === 1 && academicKeywords.has(keyword.toLowerCase()),
      );

      let score = 10 + Math.min(specificOverlap * 18, 54) + matchingTopicGroups * 12;

      if (hasGpa && supportsAcademics) {
        score += gpa >= 3.8 ? 18 : gpa >= 3 ? 12 : gpa >= 2.5 ? 6 : 0;
      }
      if (hasApCount && supportsAcademics) {
        score += Math.min(Math.round(apCount * 2), 12);
      }

      return { item, match: Math.min(score, 96) };
    })
    .sort((left, right) => right.match - left.match)
    .reduce<Array<(TScholarship | TFinancialAid) & { match: number }>>((matches, { item, match }) => {
      const categoryMatches = matches.filter((candidate) => candidate.type === item.type).length;
      if (categoryMatches < 7) matches.push({ ...item, match });
      return matches;
    }, []);
}