import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export type StoredWorkspaceSettings = {
  workspaceId: string;
  aiRouterWebhookUrl: string;
  createdAt: string;
  updatedAt: string;
};

type WorkspaceSettingsFile = {
  version: 1;
  items: StoredWorkspaceSettings[];
};

const defaultSettingsFilePath = path.join(
  process.cwd(),
  ".data",
  "workspace-settings.json"
);

export class WorkspaceSettingsStoreError extends Error {
  constructor(
    public readonly code:
      | "SETTINGS_STORE_NOT_WRITABLE"
      | "SETTINGS_STORE_CORRUPTED",
    message: string
  ) {
    super(message);
    this.name = "WorkspaceSettingsStoreError";
  }
}

function resolveSettingsFilePath(): string {
  const configuredPath = process.env.WORKSPACE_SETTINGS_FILE_PATH?.trim();
  if (configuredPath) {
    return configuredPath;
  }

  if (process.env.NODE_ENV === "production" || process.env.VERCEL === "1") {
    return path.join("/tmp", "recuperaventas-dashboard", "workspace-settings.json");
  }

  return defaultSettingsFilePath;
}

async function readWorkspaceSettingsFile(): Promise<WorkspaceSettingsFile> {
  const resolvedPath = resolveSettingsFilePath();

  try {
    const raw = await readFile(resolvedPath, "utf8");
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new WorkspaceSettingsStoreError(
        "SETTINGS_STORE_CORRUPTED",
        "Workspace settings storage file has invalid JSON"
      );
    }

    if (!parsed || typeof parsed !== "object") {
      throw new WorkspaceSettingsStoreError(
        "SETTINGS_STORE_CORRUPTED",
        "Workspace settings storage is invalid"
      );
    }

    const maybeData = parsed as Partial<WorkspaceSettingsFile>;
    const items = Array.isArray(maybeData.items) ? maybeData.items : [];

    return {
      version: 1,
      items: items.filter(
        (item): item is StoredWorkspaceSettings =>
          Boolean(
            item &&
              typeof item === "object" &&
              typeof (item as StoredWorkspaceSettings).workspaceId === "string" &&
              typeof (item as StoredWorkspaceSettings).aiRouterWebhookUrl ===
                "string" &&
              typeof (item as StoredWorkspaceSettings).createdAt === "string" &&
              typeof (item as StoredWorkspaceSettings).updatedAt === "string"
          )
      )
    };
  } catch (error) {
    if (error instanceof WorkspaceSettingsStoreError) {
      throw error;
    }

    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "ENOENT") {
      return { version: 1, items: [] };
    }

    throw error;
  }
}

async function saveWorkspaceSettingsFile(data: WorkspaceSettingsFile): Promise<void> {
  const resolvedPath = resolveSettingsFilePath();
  const directoryPath = path.dirname(resolvedPath);

  try {
    await mkdir(directoryPath, { recursive: true });
    await writeFile(resolvedPath, JSON.stringify(data, null, 2), "utf8");
  } catch (error) {
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code === "EROFS" || nodeError.code === "EACCES") {
      throw new WorkspaceSettingsStoreError(
        "SETTINGS_STORE_NOT_WRITABLE",
        "Workspace settings storage path is not writable"
      );
    }

    throw error;
  }
}

export async function getWorkspaceSettings(
  workspaceId: string
): Promise<StoredWorkspaceSettings | null> {
  const data = await readWorkspaceSettingsFile();
  return data.items.find((item) => item.workspaceId === workspaceId) ?? null;
}

export async function upsertWorkspaceSettings(input: {
  workspaceId: string;
  aiRouterWebhookUrl: string;
}): Promise<StoredWorkspaceSettings> {
  const data = await readWorkspaceSettingsFile();
  const now = new Date().toISOString();

  const existing = data.items.find((item) => item.workspaceId === input.workspaceId);
  if (existing) {
    existing.aiRouterWebhookUrl = input.aiRouterWebhookUrl;
    existing.updatedAt = now;
    await saveWorkspaceSettingsFile(data);
    return existing;
  }

  const created: StoredWorkspaceSettings = {
    workspaceId: input.workspaceId,
    aiRouterWebhookUrl: input.aiRouterWebhookUrl,
    createdAt: now,
    updatedAt: now
  };

  data.items.push(created);
  await saveWorkspaceSettingsFile(data);
  return created;
}
