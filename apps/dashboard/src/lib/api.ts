const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000/api/v1";
const WORKSPACE_ID = process.env.NEXT_PUBLIC_WORKSPACE_ID ?? "";
const WORKSPACE_STORAGE_KEY = "recuperaventas_workspace_id";

type ApiError = {
  code: string;
  message: string;
};

type ApiResponse<T> = {
  data: T | null;
  error: ApiError | null;
};

type OnboardingErrorResponse = {
  error?: ApiError;
};

type DashboardErrorResponse = {
  error?: string;
};

export type ConversationItem = {
  id: string;
  workspaceId: string;
  contactId: string;
  contactPhone?: string | null;
  whatsappSessionId: string;
  status: "open" | "idle" | "closed";
  lastCustomerMessageAt: string | null;
  lastBusinessMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMessage = {
  id: string;
  providerMessageId: string;
  direction: "inbound" | "outbound";
  messageType: string;
  bodyText: string | null;
  sentAt: string | null;
  receivedAt: string | null;
  createdAt: string;
};

export type RecoverySummary = {
  id: string;
  status: "scheduled" | "sent" | "replied" | "recovered" | "failed";
  scheduledAt: string;
  sentAt: string | null;
  repliedAt: string | null;
};

export type ConversationDetail = {
  conversation: ConversationItem;
  messages: ConversationMessage[];
  latest_recovery: RecoverySummary | null;
  is_recovered: boolean;
  recovery_status: RecoverySummary["status"] | null;
  sale_recovered: boolean;
  recovered_amount: number | null;
};

export type ConversationSummary = {
  conversationId: string;
  contactPhone: string;
  lastMessage: string;
  status: ConversationItem["status"];
  recoveryStatus: RecoverySummary["status"] | "none";
  saleRecovered: boolean;
  recoveredAmount: number;
  latestRecoveryId: string | null;
};

export type DashboardMetrics = {
  totalConversations: number;
  idleConversations: number;
  recoveryMessagesSent: number;
  recoveredSales: number;
  recoveredRevenue: number;
};

export type AutomationSettings = {
  quickRecoveryWebhook: string;
  followupRecoveryWebhook: string;
  finalRecoveryWebhook: string;
};

export type AiChatbotSettings = {
  aiRouterWebhookUrl: string;
};

export type AutomationPlaybookName = "sales_recovery";

export type AutomationPlaybook = {
  playbook: AutomationPlaybookName;
  enabled: boolean;
};

type AutomationSettingsApiData = {
  workspace_id: string;
  quick_recovery_webhook: string | null;
  followup_recovery_webhook: string | null;
  final_recovery_webhook: string | null;
};

type AutomationPlaybooksApiData = {
  items: Array<{
    playbook: AutomationPlaybookName;
    enabled: boolean;
  }>;
  running: AutomationPlaybookName[];
};

type AiChatbotSettingsApiData = {
  workspace_id: string;
  ai_router_webhook_url: string | null;
};

function isConfigured(): boolean {
  return Boolean(API_BASE_URL && WORKSPACE_ID);
}

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function formatNonJsonResponseError(
  path: string,
  response: Response,
  payloadText: string
): string {
  const compact = payloadText.replace(/\s+/g, " ").trim();
  const preview = compact ? ` Response preview: ${compact.slice(0, 120)}.` : "";
  const isLikelyHtml = /^\s*</.test(payloadText);
  const detail = isLikelyHtml
    ? "Received HTML instead of JSON. Check API path/auth redirect/base URL."
    : "Received a non-JSON response from the API.";

  return `${detail} (${response.status} ${response.statusText}) for ${path}.${preview}`;
}

async function fetchApiByUrl<T>(
  url: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payloadText = await response.text();
  const payload = safeParseJson<ApiResponse<T>>(payloadText);
  if (!payload) {
    throw new Error(formatNonJsonResponseError(path, response, payloadText));
  }

  if (!response.ok || payload.error || !payload.data) {
    throw new Error(payload.error?.message ?? `API request failed: ${path}`);
  }

  return payload.data;
}

async function fetchDashboardRoute<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  const payloadText = await response.text();
  const payload = safeParseJson<T | DashboardErrorResponse>(payloadText);
  if (!payload) {
    throw new Error(formatNonJsonResponseError(path, response, payloadText));
  }

  if (!response.ok) {
    const errorPayload = payload as DashboardErrorResponse;
    throw new Error(errorPayload.error ?? `API request failed: ${path}`);
  }

  return payload as T;
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T> {
  return fetchApiByUrl(`${API_BASE_URL}${path}`, path, init);
}

function getOnboardingErrorMessage(payload: unknown, fallback: string): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const errorPayload = payload as OnboardingErrorResponse;
    if (errorPayload.error?.message) {
      return errorPayload.error.message;
    }
  }

  return fallback;
}

function mapAutomationSettings(
  data: AutomationSettingsApiData
): AutomationSettings {
  return {
    quickRecoveryWebhook: data.quick_recovery_webhook ?? "",
    followupRecoveryWebhook: data.followup_recovery_webhook ?? "",
    finalRecoveryWebhook: data.final_recovery_webhook ?? ""
  };
}

function normalizeWebhookInput(value: string): string | null {
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function mapAiChatbotSettings(
  data: AiChatbotSettingsApiData
): AiChatbotSettings {
  return {
    aiRouterWebhookUrl: data.ai_router_webhook_url ?? ""
  };
}

export async function getConversations(): Promise<ConversationItem[]> {
  if (!isConfigured()) {
    return [];
  }

  const query = new URLSearchParams({
    workspaceId: WORKSPACE_ID,
    limit: "100",
    offset: "0"
  });

  const data = await fetchApi<{
    items: ConversationItem[];
    pagination: { limit: number; offset: number };
  }>(`/conversations?${query.toString()}`);

  return data.items;
}

export async function getConversationById(
  conversationId: string,
  messageLimit = 100
): Promise<ConversationDetail | null> {
  if (!isConfigured()) {
    return null;
  }

  const query = new URLSearchParams({
    workspaceId: WORKSPACE_ID,
    messageLimit: String(messageLimit)
  });

  try {
    return await fetchApi<ConversationDetail>(
      `/conversations/${conversationId}?${query.toString()}`
    );
  } catch {
    return null;
  }
}

export async function getConversationSummaries(): Promise<ConversationSummary[]> {
  const list = await getConversations();
  const detailResults = await Promise.all(
    list.map((conversation) => getConversationById(conversation.id, 30))
  );

  return list.map((conversation, index) => {
    const detail = detailResults[index];
    const lastMessageText =
      detail?.messages[detail.messages.length - 1]?.bodyText?.trim() || "-";
    const recoveryStatus = detail?.recovery_status ?? "none";
    const recoveredAmount = detail?.recovered_amount ?? 0;

    return {
      conversationId: conversation.id,
      contactPhone: conversation.contactPhone || conversation.contactId,
      lastMessage: lastMessageText,
      status: conversation.status,
      recoveryStatus,
      saleRecovered: detail?.sale_recovered ?? false,
      recoveredAmount,
      latestRecoveryId: detail?.latest_recovery?.id ?? null
    };
  });
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const summaries = await getConversationSummaries();

  const recoveryMessagesSent = summaries.filter((item) =>
    ["sent", "replied", "recovered"].includes(item.recoveryStatus)
  ).length;
  const recoveredSales = summaries.filter((item) => item.saleRecovered).length;
  const recoveredRevenue = summaries.reduce(
    (acc, item) => acc + item.recoveredAmount,
    0
  );

  return {
    totalConversations: summaries.length,
    idleConversations: summaries.filter((item) => item.status === "idle").length,
    recoveryMessagesSent,
    recoveredSales,
    recoveredRevenue
  };
}

export async function getAutomationSettings(input: {
  workspaceId: string;
}): Promise<AutomationSettings> {
  const query = new URLSearchParams({
    workspaceId: input.workspaceId
  });

  const data = await fetchApi<AutomationSettingsApiData>(
    `/settings/automations?${query.toString()}`
  );

  return mapAutomationSettings(data);
}

export async function saveAutomationSettings(input: {
  workspaceId: string;
  quickRecoveryWebhook: string;
  followupRecoveryWebhook: string;
  finalRecoveryWebhook: string;
}): Promise<AutomationSettings> {
  const query = new URLSearchParams({
    workspaceId: input.workspaceId
  });

  const data = await fetchApi<AutomationSettingsApiData>(
    `/settings/automations?${query.toString()}`,
    {
      method: "POST",
      body: JSON.stringify({
        quick_recovery_webhook: normalizeWebhookInput(input.quickRecoveryWebhook),
        followup_recovery_webhook: normalizeWebhookInput(
          input.followupRecoveryWebhook
        ),
        final_recovery_webhook: normalizeWebhookInput(input.finalRecoveryWebhook)
      })
    }
  );

  return mapAutomationSettings(data);
}

export async function getAiChatbotSettings(input: {
  workspaceId: string;
}): Promise<AiChatbotSettings> {
  const query = new URLSearchParams({
    workspaceId: input.workspaceId
  });

  const path = `/api/settings/ai-chatbot?${query.toString()}`;
  const data = await fetchDashboardRoute<{
    ai_router_webhook_url?: string | null;
  }>(path);

  return mapAiChatbotSettings({
    workspace_id: input.workspaceId,
    ai_router_webhook_url: data.ai_router_webhook_url ?? ""
  });
}

export async function saveAiChatbotSettings(input: {
  workspaceId: string;
  aiRouterWebhookUrl: string;
}): Promise<AiChatbotSettings> {
  const path = "/api/settings/ai-chatbot";
  const data = await fetchDashboardRoute<{
    success?: boolean;
    ai_router_webhook_url?: string | null;
  }>(
    path,
    {
      method: "POST",
      body: JSON.stringify({
        workspaceId: input.workspaceId,
        ai_router_webhook_url: input.aiRouterWebhookUrl.trim()
      })
    }
  );

  if (!data.success) {
    throw new Error("Could not save chatbot settings");
  }

  return mapAiChatbotSettings({
    workspace_id: input.workspaceId,
    ai_router_webhook_url:
      data.ai_router_webhook_url ?? input.aiRouterWebhookUrl.trim()
  });
}

export async function getAutomationPlaybooks(input: {
  workspaceId: string;
}): Promise<AutomationPlaybooksApiData> {
  const query = new URLSearchParams({
    workspaceId: input.workspaceId
  });

  return fetchApi<AutomationPlaybooksApiData>(
    `/automations/playbooks?${query.toString()}`
  );
}

export async function setAutomationPlaybook(input: {
  workspaceId: string;
  playbook: AutomationPlaybookName;
  enabled: boolean;
}): Promise<AutomationPlaybook> {
  const query = new URLSearchParams({
    workspaceId: input.workspaceId
  });

  const data = await fetchApi<{
    workspace_id: string;
    playbook: AutomationPlaybookName;
    enabled: boolean;
  }>(`/automations/playbooks?${query.toString()}`, {
    method: "POST",
    body: JSON.stringify({
      playbook: input.playbook,
      enabled: input.enabled
    })
  });

  return {
    playbook: data.playbook,
    enabled: data.enabled
  };
}

export async function postMarkSaleRecovered(input: {
  recoveryId: string;
  amount: number;
  currency: string;
}): Promise<void> {
  const response = await fetch(
    `${API_BASE_URL}/recoveries/${input.recoveryId}/mark-sale`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency
      })
    }
  );

  const payload = (await response.json()) as ApiResponse<Record<string, unknown>>;
  if (!response.ok || payload.error) {
    throw new Error(payload.error?.message ?? "Could not mark recovered sale");
  }
}

export async function createWorkspace(input: {
  name: string;
}): Promise<{ workspaceId: string }> {
  const response = await fetch(`${API_BASE_URL}/workspaces`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: input.name
    })
  });

  const payload = (await response.json()) as
    | { workspace_id: string }
    | OnboardingErrorResponse;

  if (!response.ok || !("workspace_id" in payload)) {
    throw new Error(getOnboardingErrorMessage(payload, "Could not create workspace"));
  }

  return { workspaceId: payload.workspace_id };
}

export async function startWhatsappSessionByWorkspace(input: {
  workspaceId: string;
}): Promise<{ qr: string }> {
  const response = await fetch(`${API_BASE_URL}/whatsapp/session/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      workspace_id: input.workspaceId
    })
  });

  const payload = (await response.json()) as { qr: string } | OnboardingErrorResponse;
  if (!response.ok || !("qr" in payload)) {
    throw new Error(
      getOnboardingErrorMessage(payload, "Could not start WhatsApp session")
    );
  }

  return {
    qr: payload.qr
  };
}

export async function getWhatsappSessionStatusByWorkspace(input: {
  workspaceId: string;
}): Promise<{ connected: boolean }> {
  const query = new URLSearchParams({
    workspace_id: input.workspaceId
  });

  const response = await fetch(
    `${API_BASE_URL}/whatsapp/session/status?${query.toString()}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      },
      cache: "no-store"
    }
  );

  const payload = (await response.json()) as
    | { connected: boolean }
    | OnboardingErrorResponse;

  if (!response.ok || !("connected" in payload)) {
    throw new Error(
      getOnboardingErrorMessage(
        payload,
        "Could not get WhatsApp session status"
      )
    );
  }

  return {
    connected: payload.connected
  };
}

export function getStoredWorkspaceId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(WORKSPACE_STORAGE_KEY);
}

export function saveWorkspaceId(workspaceId: string): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId);
}

export function getDefaultWorkspaceId(): string {
  return WORKSPACE_ID;
}

export function getWorkspaceConfig(): {
  apiBaseUrl: string;
  workspaceId: string;
  configured: boolean;
} {
  return {
    apiBaseUrl: API_BASE_URL,
    workspaceId: WORKSPACE_ID,
    configured: isConfigured()
  };
}

export function getApiBaseConfig(): {
  apiBaseUrl: string;
  configured: boolean;
} {
  return {
    apiBaseUrl: API_BASE_URL,
    configured: Boolean(API_BASE_URL)
  };
}
