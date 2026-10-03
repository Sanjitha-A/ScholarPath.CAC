import type { StudentProfile } from "./auth";

export type OpportunityCandidate = {
  type: "Scholarship" | "Financial aid";
  keywords: readonly string[];
};

const topicGroups = [
  ["stem", "science", "math", "engineering", "technology", "tech", "computer", "biology", "health", "medicine"],
  ["community", "leadership", "service", "volunteer", "impact"],
  ["business", "finance", "entrepreneur"],
  ["education", "teacher", "teaching"],
];

const genericKeywords = new Set(["all", "general", "college", "scholarship", "financial", "aid", "federal"]);
const academicKeywords = new Set(["academic", "gpa", "merit", "grades", "stem"]);

function words(value: string): Set<string> {
  return new Set(value.toLowerCase().match(/[a-z0-9]+/g) ?? []);
}

export function getProfileRecommendations<T extends OpportunityCandidate>(
  profile: StudentProfile,
  scholarships: readonly T[],
  financialAid: readonly T[],
): Array<T & { match: number }> {
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
      const supportsAcademics = item.keywords.some((keyword) => words(keyword).size === 1 && academicKeywords.has(keyword.toLowerCase()));

      let score = 18 + Math.min(specificOverlap * 9, 27) + matchingTopicGroups * 22;
      if (hasGpa) {
        score += supportsAcademics
          ? gpa >= 3.8 ? 22 : gpa >= 3 ? 15 : gpa >= 2.5 ? 8 : 0
          : 3;
      }
      if (hasApCount && supportsAcademics) score += Math.min(Math.round(apCount * 2), 12);
      if (item.type === "Financial aid" && item.keywords.some((keyword) => ["all", "general"].includes(keyword.toLowerCase()))) {
        score += 18;
      }

      return { item, match: Math.min(score, 96) };
    })
    .sort((left, right) => right.match - left.match)
    .reduce<Array<T & { match: number }>>((matches, { item, match }) => {
      const categoryMatches = matches.filter((candidate) => candidate.type === item.type).length;
      if (categoryMatches < 7) matches.push({ ...item, match });
      return matches;
    }, []);
}