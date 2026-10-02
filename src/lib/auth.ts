export type StudentProfile = {
  ethnicity: string;
  gender: string;
  age: string;
  gpa: string;
  apCount: string;
  school?: string;
  major?: string;
  graduationYear?: string;
  interests?: string;
  newsletters?: string[];
};

export type StoredUser = {
  id?: number;
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
  gpa: "",
  apCount: "",
  school: "",
  major: "",
  graduationYear: "",
  interests: "",
  newsletters: [],
};

export const STORAGE_KEY = "scholarpath_users_v1";
export const SESSION_KEY = "scholarpath_session_v1";

export function clearLegacyAuthData() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem("scholarpath_token_v1");
}
