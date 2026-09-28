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
  username: string;
  password: string;
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

export function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function normalizePassword(password: string) {
  return password.trim();
}

function sanitizeUser(user: Partial<StoredUser>): StoredUser | null {
  if (!user || typeof user !== "object") {
    return null;
  }

  const username = typeof user.username === "string" ? user.username.trim() : "";
  const password = typeof user.password === "string" ? user.password.trim() : "";

  if (!username || !password) {
    return null;
  }

  return {
    username,
    password,
    profile: {
      ...profileDefaults,
      ...(user.profile ?? {}),
    },
  };
}

export function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    const users = Array.isArray(parsed) ? parsed : [];
    const cleaned = users
      .map((user) => sanitizeUser(user as Partial<StoredUser>))
      .filter((user): user is StoredUser => Boolean(user));

    const deduped = new Map<string, StoredUser>();
    for (const user of cleaned) {
      const key = normalizeUsername(user.username);
      if (!deduped.has(key)) {
        deduped.set(key, user);
      }
    }

    const sanitized = Array.from(deduped.values());
    saveStoredUsers(sanitized);
    return sanitized;
  } catch {
    return [];
  }
}

export function saveStoredUsers(users: StoredUser[]) {
  if (typeof window !== "undefined") {
    const cleaned = users
      .map((user) => sanitizeUser(user))
      .filter((user): user is StoredUser => Boolean(user));

    const deduped = new Map<string, StoredUser>();
    for (const user of cleaned) {
      const key = normalizeUsername(user.username);
      if (!deduped.has(key)) {
        deduped.set(key, user);
      }
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(deduped.values())));
  }
}

export function getStoredSession() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(SESSION_KEY);
}

export function saveStoredSession(username: string | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (username) {
    window.localStorage.setItem(SESSION_KEY, username);
    return;
  }

  window.localStorage.removeItem(SESSION_KEY);
}

export function createUser(
  users: StoredUser[],
  details: { username: string; password: string; profile?: Partial<StudentProfile> },
): StoredUser[] {
  const username = details.username.trim();
  const password = normalizePassword(details.password);

  if (!username || !password) {
    return users;
  }

  const normalized = normalizeUsername(username);
  const sanitizedUsers = users
    .map((user) => sanitizeUser(user))
    .filter((user): user is StoredUser => Boolean(user));
  const exists = sanitizedUsers.some((user) => normalizeUsername(user.username) === normalized);

  if (exists) {
    return sanitizedUsers;
  }

  const nextUsers = [
    ...sanitizedUsers,
    {
      username,
      password,
      profile: {
        ...profileDefaults,
        ...details.profile,
      },
    },
  ];

  saveStoredUsers(nextUsers);
  return nextUsers;
}

export function loginUser(users: StoredUser[], username: string, password: string) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedPassword = normalizePassword(password);

  return (
    users.find(
      (user) =>
        normalizeUsername(user.username) === normalizedUsername &&
        normalizePassword(user.password) === normalizedPassword,
    ) ?? null
  );
}

export function saveUserProfile(
  users: StoredUser[],
  username: string,
  profile: Partial<StudentProfile>,
): StoredUser[] {
  const normalizedUsername = normalizeUsername(username);
  const sanitizedUsers = users
    .map((user) => sanitizeUser(user))
    .filter((user): user is StoredUser => Boolean(user));

  const nextUsers = sanitizedUsers.map((user) => {
    if (normalizeUsername(user.username) !== normalizedUsername) {
      return user;
    }

    return {
      ...user,
      profile: {
        ...user.profile,
        ...profile,
      },
    };
  });

  saveStoredUsers(nextUsers);
  return nextUsers;
}
