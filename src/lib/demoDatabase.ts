import { normalizeStudentProfile, profileDefaults, type StoredUser, type StudentProfile } from "./auth";

export const DEMO_DATABASE_KEY = "scholarpath_demo_database_v2";
export const DEMO_ADMIN_PASSWORD = "ScholarPathAdminDemo2026!";

type DemoUser = StoredUser & {
  id: string;
  fullName: string;
  profile: StudentProfile;
  isAdmin: boolean;
  passwordSalt: string;
  passwordHash: string;
};

type DemoNewsletter = {
  id: number;
  title: string;
  summary: string;
  category: string;
  created_at: string;
  created_by: string;
};

type DemoDatabase = {
  users: DemoUser[];
  newsletters: DemoNewsletter[];
  currentUserId: string | null;
  nextNewsletterId: number;
};

let demoAdminCredentials: Promise<{ passwordSalt: string; passwordHash: string }> | undefined;

function getStorage(): Storage {
  if (typeof window === "undefined") throw new Error("Demo storage is only available in a browser.");
  return window.localStorage;
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function createPasswordHash(password: string, salt = globalThis.crypto.getRandomValues(new Uint8Array(16))) {
  const key = await globalThis.crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const hash = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 120_000, hash: "SHA-256" },
    key,
    256,
  );

  return { passwordSalt: toHex(salt), passwordHash: toHex(new Uint8Array(hash)) };
}

function fromHex(value: string): Uint8Array {
  return Uint8Array.from(value.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
}

async function loadDatabase(): Promise<DemoDatabase> {
  const storage = getStorage();
  const saved = storage.getItem(DEMO_DATABASE_KEY);
  let database: DemoDatabase;
  if (saved) {
    try {
      database = JSON.parse(saved) as DemoDatabase;
    } catch {
      storage.removeItem(DEMO_DATABASE_KEY);
      database = createEmptyDatabase();
    }
  } else {
    storage.removeItem("scholarpath_demo_database_v1");
    database = createEmptyDatabase();
  }

  const admin = database.users.find((user) => user.username.toLowerCase() === "admin");
  if (admin) {
    admin.isAdmin = true;
  } else {
    demoAdminCredentials ??= createPasswordHash(DEMO_ADMIN_PASSWORD);
    database.users.push({
      id: "demo-admin",
      username: "admin",
      fullName: "ScholarPath Demo Admin",
      email: null,
      isAdmin: true,
      profile: normalizeStudentProfile({}),
      ...(await demoAdminCredentials),
    });
  }

  storage.setItem(DEMO_DATABASE_KEY, JSON.stringify(database));
  return database;
}

function createEmptyDatabase(): DemoDatabase {
  return {
    users: [],
    newsletters: [],
    currentUserId: null,
    nextNewsletterId: 1,
  };
}

function saveDatabase(database: DemoDatabase): void {
  getStorage().setItem(DEMO_DATABASE_KEY, JSON.stringify(database));
}

function publicUser(user: DemoUser): StoredUser {
  const { passwordSalt: _passwordSalt, passwordHash: _passwordHash, ...safeUser } = user;
  return { ...safeUser, profile: normalizeStudentProfile(user.profile) };
}

function currentUser(database: DemoDatabase): DemoUser | undefined {
  return database.users.find((user) => user.id === database.currentUserId);
}

function requestBody(options: RequestInit): Record<string, any> {
  if (typeof options.body !== "string") return {};
  try {
    return JSON.parse(options.body);
  } catch {
    return {};
  }
}

export async function demoApiRequest(path: string, options: RequestInit = {}): Promise<any> {
  const database = await loadDatabase();
  const method = (options.method ?? "GET").toUpperCase();
  const body = requestBody(options);

  if (path === "/newsletters" && method === "GET") {
    return { ok: true, newsletters: database.newsletters };
  }

  if (path === "/register" && method === "POST") {
    const username = String(body.username ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const password = String(body.password ?? "");
    if (!username || !fullName || !password) throw new Error("Full name, username, and password are required.");
    if (password.length < 12) throw new Error("Choose a password with at least 12 characters.");
    if (username.toLowerCase() === "admin") throw new Error("That username is reserved.");
    if (database.users.some((user) => user.username.toLowerCase() === username.toLowerCase())) {
      throw new Error("That username is already taken. Please choose another one.");
    }

    const user: DemoUser = {
      id: globalThis.crypto.randomUUID(),
      username,
      fullName,
      email: typeof body.email === "string" ? body.email : null,
      isAdmin: false,
      profile: normalizeStudentProfile(body.profile ?? {
        ...profileDefaults,
        interests: `New student profile for ${fullName}`,
      }),
      ...(await createPasswordHash(password)),
    };
    database.users.push(user);
    saveDatabase(database);
    return { ok: true, user: publicUser(user) };
  }

  if (path === "/login" && method === "POST") {
    const username = String(body.username ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const user = database.users.find((candidate) => candidate.username.toLowerCase() === username);
    if (!user) throw new Error("No account matched those credentials. Register first to create a profile.");
    const { passwordHash } = await createPasswordHash(password, fromHex(user.passwordSalt));
    if (passwordHash !== user.passwordHash) {
      throw new Error("No account matched those credentials. Register first to create a profile.");
    }
    database.currentUserId = user.id;
    saveDatabase(database);
    return { ok: true, user: publicUser(user) };
  }

  if (path === "/me" && method === "GET") {
    const user = currentUser(database);
    if (!user) throw new Error("Please sign in again.");
    return { ok: true, user: publicUser(user) };
  }

  if (path === "/logout" && method === "POST") {
    database.currentUserId = null;
    saveDatabase(database);
    return { ok: true };
  }

  if (path === "/profile" && method === "PUT") {
    const user = currentUser(database);
    if (!user) throw new Error("Please sign in again.");
    user.profile = normalizeStudentProfile({ ...user.profile, ...(body.profile ?? {}) });
    saveDatabase(database);
    return { ok: true, user: publicUser(user) };
  }

  if (path === "/admin/newsletters" && method === "POST") {
    const user = currentUser(database);
    if (!user?.isAdmin) throw new Error("Admin access required.");
    const title = String(body.title ?? "").trim();
    const summary = String(body.summary ?? "").trim();
    if (!title || !summary) throw new Error("Title and summary are required.");
    database.newsletters.unshift({
      id: database.nextNewsletterId++,
      title,
      summary,
      category: String(body.category ?? "General").trim() || "General",
      created_at: new Date().toISOString(),
      created_by: user.username,
    });
    saveDatabase(database);
    return { ok: true, message: "Newsletter created." };
  }

  throw new Error("This demo action is not available.");
}