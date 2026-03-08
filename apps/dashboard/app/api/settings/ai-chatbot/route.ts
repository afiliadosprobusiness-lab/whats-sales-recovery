import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth-token";
import {
  getWorkspaceSettings,
  upsertWorkspaceSettings,
  WorkspaceSettingsStoreError
} from "@/lib/workspace-settings-store";

type UpdateRequestBody = {
  workspaceId?: string;
  ai_router_webhook_url?: string;
};

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function ensureAuthenticated(): boolean {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  return Boolean(verifyAuthToken(token));
}

function readWorkspaceIdFromQuery(request: Request): string {
  const { searchParams } = new URL(request.url);
  return searchParams.get("workspaceId")?.trim() ?? "";
}

function handleStoreError(error: unknown): NextResponse {
  if (error instanceof WorkspaceSettingsStoreError) {
    if (error.code === "SETTINGS_STORE_NOT_WRITABLE") {
      return jsonError(
        "Workspace settings storage is not writable in this environment",
        503
      );
    }

    if (error.code === "SETTINGS_STORE_CORRUPTED") {
      return jsonError("Workspace settings storage is corrupted", 500);
    }
  }

  console.error("[ai-chatbot-settings] Unexpected route error", error);
  return jsonError("Unexpected server error while handling AI chatbot settings", 500);
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!ensureAuthenticated()) {
    return jsonError("Unauthorized", 401);
  }

  const workspaceId = readWorkspaceIdFromQuery(request);
  if (!workspaceId) {
    return jsonError("workspaceId query param is required", 400);
  }

  try {
    const stored = await getWorkspaceSettings(workspaceId);
    return NextResponse.json({
      ai_router_webhook_url: stored?.aiRouterWebhookUrl ?? ""
    });
  } catch (error) {
    return handleStoreError(error);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!ensureAuthenticated()) {
    return jsonError("Unauthorized", 401);
  }

  const body = (await request.json().catch(() => null)) as UpdateRequestBody | null;
  const workspaceId = body?.workspaceId?.trim() ?? "";
  const aiRouterWebhookUrl = body?.ai_router_webhook_url?.trim() ?? "";

  if (!workspaceId) {
    return jsonError("workspaceId is required", 400);
  }

  if (!aiRouterWebhookUrl || !/^https?:\/\//i.test(aiRouterWebhookUrl)) {
    return jsonError(
      "ai_router_webhook_url must start with http:// or https://",
      400
    );
  }

  try {
    await upsertWorkspaceSettings({
      workspaceId,
      aiRouterWebhookUrl
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleStoreError(error);
  }
}
