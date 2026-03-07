"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getAiChatbotSettings,
  getDefaultWorkspaceId,
  getStoredWorkspaceId,
  saveAiChatbotSettings
} from "@/lib/api";

export function SettingsClient(): JSX.Element {
  const defaultWorkspaceId = useMemo(() => getDefaultWorkspaceId(), []);
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const storedWorkspaceId = getStoredWorkspaceId();
    if (workspaceId || !storedWorkspaceId) {
      return;
    }

    setWorkspaceId(storedWorkspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setErrorMessage(null);

    void getAiChatbotSettings({ workspaceId })
      .then((settings) => {
        if (isCancelled) {
          return;
        }

        setWebhookUrl(settings.aiRouterWebhookUrl);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Could not load AI chatbot settings";
        setErrorMessage(message);
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [workspaceId]);

  async function handleSave(): Promise<void> {
    if (!workspaceId) {
      return;
    }

    const normalized = webhookUrl.trim();
    if (!normalized || !/^https?:\/\//i.test(normalized)) {
      setErrorMessage("AI Router Webhook URL must start with http:// or https://");
      setSuccessMessage(null);
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const saved = await saveAiChatbotSettings({
        workspaceId,
        aiRouterWebhookUrl: normalized
      });
      setWebhookUrl(saved.aiRouterWebhookUrl);
      setSuccessMessage("Chatbot settings saved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save chatbot settings";
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  }

  if (!workspaceId) {
    return (
      <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="mt-3 text-sm text-amber-100">
          No workspace selected yet. Connect WhatsApp first to create a workspace
          and configure AI chatbot settings.
        </p>
        <Link
          href="/connect-whatsapp"
          className="mt-6 inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950"
        >
          Go to WhatsApp connection
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-3xl font-semibold text-white">Settings</h2>
        <p className="mt-2 text-sm text-slate-300">
          Configure workspace-level chatbot integrations.
        </p>
      </header>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {successMessage}
        </p>
      ) : null}

      <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white">AI Chatbot</h3>
        <p className="mt-2 text-sm text-slate-300">
          Workspace ID: <span className="break-all text-cyan-200">{workspaceId}</span>
        </p>

        {isLoading ? (
          <p className="mt-4 text-sm text-slate-300">Loading chatbot settings...</p>
        ) : (
          <div className="mt-4 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">
                AI Router Webhook URL
              </span>
              <input
                type="url"
                value={webhookUrl}
                onChange={(event) => {
                  setWebhookUrl(event.target.value);
                }}
                placeholder="https://enarched-preaortic-tish.ngrok-free.dev/webhook/wa/ai-router"
                className="mt-2 w-full rounded-xl border border-white/15 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-300 focus:ring-2 focus:ring-cyan-400/40"
              />
            </label>

            <button
              type="button"
              onClick={() => {
                void handleSave();
              }}
              disabled={isSaving}
              className="inline-flex rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSaving ? "Saving..." : "Save Chatbot Settings"}
            </button>
          </div>
        )}
      </article>
    </section>
  );
}
