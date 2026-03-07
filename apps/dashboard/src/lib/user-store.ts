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

async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await readFile(usersFilePath, "utf8");
    const parsed = JSON.parse(raw) as StoredUser[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function saveUsers(users: StoredUser[]): Promise<void> {
  const directoryPath = path.dirname(usersFilePath);
  await mkdir(directoryPath, { recursive: true });
  await writeFile(usersFilePath, JSON.stringify(users, null, 2), "utf8");
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
    throw new Error("EMAIL_IN_USE");
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
