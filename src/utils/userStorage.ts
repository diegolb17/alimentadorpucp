const PREFIX = "catfeeder";
const ACTIVE_USER_KEY = `${PREFIX}-active-user`;
const USERS_KEY = `${PREFIX}-users`;

interface StoredUser {
  username: string;
  passwordHash: string;
  displayName?: string;
}

export function getUserKey(username: string, key: string): string {
  return `${PREFIX}:${username}:${key}`;
}

// --- Password hashing ---

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export async function hashPassword(password: string): Promise<string> {
  try {
    if (typeof crypto !== "undefined" && crypto.subtle?.digest) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch {
    console.warn("Web Crypto not available, using fallback hash");
  }
  return "f_" + simpleHash(password + "catfeeder_salt_2024");
}

// --- Active user ---

export function getActiveUser(): string | null {
  try {
    return localStorage.getItem(ACTIVE_USER_KEY);
  } catch {
    return null;
  }
}

export function setActiveUser(username: string | null): void {
  try {
    if (username) {
      localStorage.setItem(ACTIVE_USER_KEY, username);
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
  } catch {
    // localStorage may be full or unavailable
  }
}

// --- Registered users (with passwords) ---

function getStoredUsers(): StoredUser[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    // localStorage may be full
  }
}

export function getRegisteredUsers(): string[] {
  return getStoredUsers().map(u => u.username);
}

export function userExists(username: string): boolean {
  return getStoredUsers().some(u => u.username === username);
}

export async function registerUser(username: string, password: string, displayName?: string): Promise<boolean> {
  if (userExists(username)) return false;
  const passwordHash = await hashPassword(password);
  const users = getStoredUsers();
  users.push({ username, passwordHash, displayName: displayName || username });
  saveStoredUsers(users);
  return true;
}

export function getUserDisplayName(username: string): string | null {
  const users = getStoredUsers();
  const user = users.find(u => u.username === username);
  return user?.displayName ?? null;
}

export function setUserDisplayName(username: string, displayName: string): void {
  const users = getStoredUsers();
  const idx = users.findIndex(u => u.username === username);
  if (idx !== -1) {
    users[idx].displayName = displayName;
    saveStoredUsers(users);
  }
}

export async function verifyPassword(username: string, password: string): Promise<boolean> {
  const users = getStoredUsers();
  const user = users.find(u => u.username === username);
  if (!user) return false;
  const hash = await hashPassword(password);
  return hash === user.passwordHash;
}

// --- User-scoped data ---

export function getUserData<T>(username: string, key: string, fallback: T): T {
  try {
    const fullKey = getUserKey(username, key);
    const raw = localStorage.getItem(fullKey);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setUserData<T>(username: string, key: string, value: T): void {
  try {
    localStorage.setItem(getUserKey(username, key), JSON.stringify(value));
  } catch {
    // localStorage may be full
  }
}

// --- Legacy keys migration ---

const LEGACY_KEYS = ["cat", "portions", "water", "meals", "humidify", "portions"];

export function hasLegacyData(): boolean {
  return LEGACY_KEYS.some((k) => localStorage.getItem(`${PREFIX}-${k}`) !== null);
}

export function migrateLegacyData(username: string): void {
  const existingMeals = getUserData(username, "meals", null);
  if (existingMeals !== null) return;

  let migrated = false;

  const cat = localStorage.getItem(`${PREFIX}-cat`);
  if (cat) {
    setUserData(username, "cat", cat);
    migrated = true;
  }

  const meals = localStorage.getItem(`${PREFIX}-meals`);
  if (meals) {
    try {
      const parsed = JSON.parse(meals);
      if (Array.isArray(parsed)) {
        setUserData(username, "meals", parsed);
        migrated = true;
      }
    } catch {
      // ignore invalid JSON
    }
  }

  const portionsRaw = localStorage.getItem(`${PREFIX}-portions`);
  if (portionsRaw !== null) {
    const asNumber = parseInt(portionsRaw, 10);
    if (!isNaN(asNumber) && asNumber >= 0 && asNumber < 1000) {
      setUserData(username, "portions-total", asNumber);
      migrated = true;
    } else {
      try {
        const parsed = JSON.parse(portionsRaw);
        if (typeof parsed === "object") {
          setUserData(username, "portions-map", parsed);
          migrated = true;
        }
      } catch {
        // ignore
      }
    }
  }

  const water = localStorage.getItem(`${PREFIX}-water`);
  if (water) {
    const parsed = parseInt(water, 10);
    if (!isNaN(parsed)) {
      setUserData(username, "water", parsed);
      migrated = true;
    }
  }

  const humidify = localStorage.getItem(`${PREFIX}-humidify`);
  if (humidify) {
    try {
      const parsed = JSON.parse(humidify);
      if (typeof parsed === "object") {
        setUserData(username, "humidify-map", parsed);
        migrated = true;
      }
    } catch {
      // ignore invalid JSON
    }
  }

  if (migrated) {
    setUserData(username, "history", []);
    setUserData(username, "analyses", []);
  }
}
