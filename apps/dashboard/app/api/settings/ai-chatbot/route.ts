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

type UpstreamAttempt = {
  url: string;
  status: number;
  contentType: string;
  bodyText: string;
  payload: UpstreamSettingsResponse | null;
};

function getConfiguredApiBaseUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (!configured) {
    return null;
  }

  return configured.replace(/\/+$/, "");
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

function parseUpstreamJson(payloadText: string): UpstreamSettingsResponse | null {
  try {
    return JSON.parse(payloadText) as UpstreamSettingsResponse;
  } catch {
    return null;
  }
}

function getUpstreamCandidateUrls(
  workspaceId: string,
  request: Request
): string[] {
  const baseUrl = getConfiguredApiBaseUrl();
  if (!baseUrl) {
    return [];
  }

  const query = new URLSearchParams({ workspaceId });
  const candidates: string[] = [];

  // Primary: use configured API base as-is (usually .../api/v1).
  candidates.push(`${baseUrl}/settings/ai-chatbot?${query.toString()}`);

  // Fallback: compatibility alias in backend API root.
  try {
    const origin = new URL(baseUrl).origin;
    candidates.push(`${origin}/api/settings/ai-chatbot?${query.toString()}`);
  } catch {
    // Ignore invalid URL; request will fail gracefully later.
  }

  // Avoid infinite recursion when env accidentally points back to this dashboard route.
  const currentUrl = new URL(request.url);
  const deduped = Array.from(new Set(candidates));
  return deduped.filter((candidate) => {
    try {
      const parsed = new URL(candidate);
      return !(
        parsed.origin === currentUrl.origin &&
        parsed.pathname === "/api/settings/ai-chatbot"
      );
    } catch {
      return true;
    }
  });
}

function logUpstreamAttempt(attempt: UpstreamAttempt): void {
  console.error("[ai-chatbot-settings] Upstream response", {
    url: attempt.url,
    status: attempt.status,
    contentType: attempt.contentType,
    bodyPreview: attempt.bodyText.slice(0, 300)
  });
}

async function requestUpstreamSettings(
  urls: string[],
  method: "GET" | "POST",
  body?: UpdateRequestBody
): Promise<
  | { ok: true; payload: UpstreamSettingsResponse }
  | { ok: false; status: number; message: string }
> {
  if (!urls.length) {
    return { ok: false, status: 500, message: "API base URL is not configured" };
  }

  let lastStatus = 502;
  let lastMessage = "Could not reach upstream settings API";

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        method,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store"
      });

      const bodyText = await response.text();
      const contentType = response.headers.get("content-type") ?? "unknown";
      const payload = parseUpstreamJson(bodyText);

      logUpstreamAttempt({
        url,
        status: response.status,
        contentType,
        bodyText,
        payload
      });

      if (!payload) {
        lastStatus = 502;
        lastMessage =
          "Upstream API returned non-JSON response. Check API base URL/path.";
        continue;
      }

      if (!response.ok || payload.error) {
        lastStatus = response.status || 502;
        lastMessage =
          payload.error?.message ?? `Upstream request failed (${response.status})`;
        continue;
      }

      return { ok: true, payload };
    } catch (error) {
      console.error("[ai-chatbot-settings] Upstream request failed", { url, error });
      lastStatus = 502;
      lastMessage = "Could not reach upstream settings API";
    }
  }

  return { ok: false, status: lastStatus, message: lastMessage };
}

export async function GET(request: Request): Promise<NextResponse> {
  if (!ensureAuthenticated()) {
    return jsonError("Unauthorized", 401);
  }

  const workspaceId = requireWorkspaceId(request);
  if (!workspaceId) {
    return jsonError("workspaceId query param is required", 400);
  }

  const upstreamUrls = getUpstreamCandidateUrls(workspaceId, request);
  const result = await requestUpstreamSettings(upstreamUrls, "GET");
  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return NextResponse.json({
    ai_router_webhook_url: result.payload.data?.ai_router_webhook_url ?? ""
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  if (!ensureAuthenticated()) {
    return jsonError("Unauthorized", 401);
  }

  const workspaceId = requireWorkspaceId(request);
  if (!workspaceId) {
    return jsonError("workspaceId query param is required", 400);
  }

  const body = (await request.json().catch(() => null)) as UpdateRequestBody | null;
  const aiRouterWebhookUrl = body?.ai_router_webhook_url?.trim() ?? "";
  if (!aiRouterWebhookUrl || !/^https?:\/\//i.test(aiRouterWebhookUrl)) {
    return jsonError(
      "ai_router_webhook_url must start with http:// or https://",
      400
    );
  }

  const upstreamUrls = getUpstreamCandidateUrls(workspaceId, request);
  const result = await requestUpstreamSettings(upstreamUrls, "POST", {
    ai_router_webhook_url: aiRouterWebhookUrl
  });
  if (!result.ok) {
    return jsonError(result.message, result.status);
  }

  return NextResponse.json({ success: true });
}
