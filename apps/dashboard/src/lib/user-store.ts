import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

const usersFilePath = path.join(process.cwd(), ".data", "users.json");

export class UserStoreError extends Error {
  constructor(
    public readonly code:
      | "USER_STORE_NOT_WRITABLE"
      | "USER_STORE_CORRUPTED"
      | "EMAIL_IN_USE",
    message: string
  ) {
    super(message);
    this.name = "UserStoreError";
  }
}

function resolveUsersFilePath(): string {
  const configuredPath = process.env.AUTH_USERS_FILE_PATH?.trim();
  if (configuredPath) {
    return configuredPath;
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return path.join("/tmp", "recuperaventas-dashboard", "users.json");
  }

  return usersFilePath;
}

async function readUsers(): Promise<StoredUser[]> {
  const resolvedPath = resolveUsersFilePath();

  try {
    const raw = await readFile(resolvedPath, "utf8");
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new UserStoreError(
        "USER_STORE_CORRUPTED",
        "User storage file has invalid JSON"
      );
    }

    if (!Array.isArray(parsed)) {
      throw new UserStoreError(
        "USER_STORE_CORRUPTED",
        "User storage file does not contain a valid users array"
      );
    }

    return parsed as StoredUser[];
  } catch (error) {
    if (error instanceof UserStoreError) {
      throw error;
    }

    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  const resolvedPath = resolveUsersFilePath();
  const directoryPath = path.dirname(resolvedPath);

  try {
    await mkdir(directoryPath, { recursive: true });
    await writeFile(resolvedPath, JSON.stringify(users, null, 2), "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "EROFS" || nodeError.code === "EACCES") {
      throw new UserStoreError(
        "USER_STORE_NOT_WRITABLE",
        "User storage path is not writable"
      );
    }

    throw error;
  }
}

export async function findUserByEmail(email: string): Promise<StoredUser | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const users = await readUsers();

  return users.find((user) => user.email === normalizedEmail) ?? null;
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<StoredUser> {
  const users = await readUsers();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new UserStoreError("EMAIL_IN_USE", "Email already in use");
  }

  const user: StoredUser = {
    id: randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString()
  };

  users.push(user);
  await saveUsers(users);

  return user;
}
