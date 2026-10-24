export type StudentProfile = {
  ethnicity: string;
  gender: string;
  age: string;
  gpa: string;
  apCount: string;
  apTests3Plus: string;
  citizenshipStatus: string;
  familyIncomeRange: string;
  isInUS: string;
  state: string;
  school?: string;
  major?: string;
  graduationYear?: string;
  interests?: string;
  leadershipActivities?: string;
  newsletters?: string[];
  grade?: string;
};

export type StoredUser = {
  id?: string | number;
  username: string;
  fullName?: string;
  email?: string | null;
  isAdmin?: boolean;
  profile: StudentProfile;
};

export const profileDefaults: StudentProfile = {
  ethnicity: "",
  gender: "",
  age: "",
  grade: "",
  gpa: "",
  apCount: "",
  apTests3Plus: "",
  citizenshipStatus: "",
  familyIncomeRange: "",
  isInUS: "",
  state: "",
  school: "",
  major: "",
  graduationYear: "",
  interests: "",
  leadershipActivities: "",
  newsletters: [],
};

export function normalizeStudentProfile(value: unknown): StudentProfile {
  const profile = value && typeof value === "object" ? (value as Partial<StudentProfile>) : {};

  return {
    ...profileDefaults,
    ...profile,
    ethnicity: typeof profile.ethnicity === "string" ? profile.ethnicity : "",
    gender: typeof profile.gender === "string" ? profile.gender : "",
    age: typeof profile.age === "string" ? profile.age : "",
    grade: typeof profile.grade === "string" ? profile.grade : "",
    gpa: typeof profile.gpa === "string" ? profile.gpa : "",
    apCount: typeof profile.apCount === "string" ? profile.apCount : "",
    apTests3Plus: typeof profile.apTests3Plus === "string" ? profile.apTests3Plus : "",
    citizenshipStatus: typeof profile.citizenshipStatus === "string" ? profile.citizenshipStatus : "",
    familyIncomeRange: typeof profile.familyIncomeRange === "string" ? profile.familyIncomeRange : "",
    isInUS: typeof profile.isInUS === "string" ? profile.isInUS : "",
    state: typeof profile.state === "string" ? profile.state : "",
    school: typeof profile.school === "string" ? profile.school : "",
    major: typeof profile.major === "string" ? profile.major : "",
    graduationYear: typeof profile.graduationYear === "string" ? profile.graduationYear : "",
    interests: typeof profile.interests === "string" ? profile.interests : "",
    leadershipActivities: typeof profile.leadershipActivities === "string" ? profile.leadershipActivities : "",
    newsletters: Array.isArray(profile.newsletters)
      ? profile.newsletters.filter((item): item is string => typeof item === "string")
      : [],
  };
}

export const STORAGE_KEY = "scholarpath_users_v1";
export const SESSION_KEY = "scholarpath_session_v1";

export function clearLegacyAuthData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem("scholarpath_token_v1");
}
