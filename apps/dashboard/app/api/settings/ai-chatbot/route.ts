import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth-token";

type UpstreamSettingsResponse = {
  data?: {
    ai_router_webhook_url?: string | null;
  } | null;
  error?: {
    message?: string;
  } | null;
};

type UpdateRequestBody = {
  ai_router_webhook_url?: string;
};

function getApiOrigin(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!configured) {
    return null;
  }

  try {
    return new URL(configured).origin;
  } catch {
    return null;
  }
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function requireWorkspaceId(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId")?.trim() ?? "";
  return workspaceId || null;
}

function ensureAuthenticated(): boolean {
  const token = cookies().get(AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return false;
  }

  return Boolean(verifyAuthToken(token));
}

async function parseUpstreamJson(
  response: Response
): Promise<UpstreamSettingsResponse | null> {
  const payloadText = await response.text();

  try {
    return JSON.parse(payloadText) as UpstreamSettingsResponse;
  } catch {
    return null;
  }
}

function getUpstreamUrl(workspaceId: string): string | null {
  const origin = getApiOrigin();
  if (!origin) {
    return null;
  }

  const query = new URLSearchParams({ workspaceId });
  return `${origin}/api/settings/ai-chatbot?${query.toString()}`;
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!ensureAuthenticated()) {
    return jsonError("Unauthorized", 401);
  }

  const workspaceId = requireWorkspaceId(request);
  if (!workspaceId) {
    return jsonError("workspaceId query param is required", 400);
  }

  const upstreamUrl = getUpstreamUrl(workspaceId);
  if (!upstreamUrl) {
    return jsonError("API base URL is not configured", 500);
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      cache: "no-store"
    });

    const upstreamPayload = await parseUpstreamJson(upstreamResponse);
    if (!upstreamPayload) {
      return jsonError("Upstream API returned non-JSON response", 502);
    }

    if (!upstreamResponse.ok || upstreamPayload.error) {
      return jsonError(
        upstreamPayload.error?.message ?? "Could not load AI chatbot settings",
        upstreamResponse.status || 502
      );
    }

    return NextResponse.json({
      ai_router_webhook_url: upstreamPayload.data?.ai_router_webhook_url ?? ""
    });
  } catch {
    return jsonError("Could not reach upstream settings API", 502);
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!ensureAuthenticated()) {
    return jsonError("Unauthorized", 401);
  }

  const workspaceId = requireWorkspaceId(request);
  if (!workspaceId) {
    return jsonError("workspaceId query param is required", 400);
  }

  const upstreamUrl = getUpstreamUrl(workspaceId);
  if (!upstreamUrl) {
    return jsonError("API base URL is not configured", 500);
  }

  const body = (await request.json().catch(() => null)) as UpdateRequestBody | null;
  const aiRouterWebhookUrl = body?.ai_router_webhook_url?.trim() ?? "";
  if (!aiRouterWebhookUrl || !/^https?:\/\//i.test(aiRouterWebhookUrl)) {
    return jsonError(
      "ai_router_webhook_url must start with http:// or https://",
      400
    );
  }

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        ai_router_webhook_url: aiRouterWebhookUrl
      }),
      cache: "no-store"
    });

    const upstreamPayload = await parseUpstreamJson(upstreamResponse);
    if (!upstreamPayload) {
      return jsonError("Upstream API returned non-JSON response", 502);
    }

    if (!upstreamResponse.ok || upstreamPayload.error) {
      return jsonError(
        upstreamPayload.error?.message ?? "Could not update AI chatbot settings",
        upstreamResponse.status || 502
      );
    }

    return NextResponse.json({
      success: true,
      ai_router_webhook_url: upstreamPayload.data?.ai_router_webhook_url ?? ""
    });
  } catch {
    return jsonError("Could not reach upstream settings API", 502);
  }
}
