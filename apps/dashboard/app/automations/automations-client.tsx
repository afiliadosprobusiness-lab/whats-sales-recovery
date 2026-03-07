"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  getAutomationPlaybooks,
  getDefaultWorkspaceId,
  getStoredWorkspaceId,
  setAutomationPlaybook,
  type AutomationPlaybookName
} from "@/lib/api";

type PlaybookCatalogEntry = {
  title: string;
  description: string;
  steps: string[];
};

const PLAYBOOK_CATALOG: Record<AutomationPlaybookName, PlaybookCatalogEntry> = {
  sales_recovery: {
    title: "Sales Recovery Playbook",
    description:
      "Automatically follow up with leads that stop responding.",
    steps: [
      "Reminder after 2 hours",
      "Follow-up after 12 hours",
      "Final message after 48 hours"
    ]
  }
};

export function AutomationsClient(): JSX.Element {
  const defaultWorkspaceId = useMemo(() => getDefaultWorkspaceId(), []);
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);
  const [enabledByPlaybook, setEnabledByPlaybook] = useState<
    Record<AutomationPlaybookName, boolean>
  >({
    sales_recovery: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState<
    Partial<Record<AutomationPlaybookName, boolean>>
  >({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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

    void getAutomationPlaybooks({ workspaceId })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        const nextState: Record<AutomationPlaybookName, boolean> = {
          sales_recovery: false
        };

        for (const item of response.items) {
          nextState[item.playbook] = item.enabled;
        }

        setEnabledByPlaybook(nextState);
      })
      .catch((error) => {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof Error
            ? error.message
            : "Could not load automations playbooks";
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

  async function togglePlaybook(playbook: AutomationPlaybookName): Promise<void> {
    if (!workspaceId) {
      return;
    }

    const nextEnabled = !enabledByPlaybook[playbook];
    setIsUpdating((prev) => ({ ...prev, [playbook]: true }));
    setErrorMessage(null);

    try {
      const result = await setAutomationPlaybook({
        workspaceId,
        playbook,
        enabled: nextEnabled
      });
      setEnabledByPlaybook((prev) => ({
        ...prev,
        [result.playbook]: result.enabled
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not update playbook";
      setErrorMessage(message);
    } finally {
      setIsUpdating((prev) => ({ ...prev, [playbook]: false }));
    }
  }

  if (!workspaceId) {
    return (
      <section className="rounded-2xl border border-amber-400/30 bg-amber-500/10 p-6">
        <h2 className="text-2xl font-semibold text-white">Automations</h2>
        <p className="mt-3 text-sm text-amber-100">
          No workspace selected yet. Connect WhatsApp first to create a workspace
          and then enable automation playbooks.
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

  const runningPlaybooks = (Object.keys(PLAYBOOK_CATALOG) as AutomationPlaybookName[])
    .filter((playbook) => enabledByPlaybook[playbook])
    .map((playbook) => PLAYBOOK_CATALOG[playbook].title);

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-3xl font-semibold text-white">Automations</h2>
        <p className="mt-2 text-sm text-slate-300">
          Enable or disable recovery playbooks without managing n8n infrastructure.
        </p>
      </header>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {errorMessage}
        </p>
      ) : null}

      {isLoading ? (
        <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-slate-300">
          Loading automation playbooks...
        </p>
      ) : null}

      <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-6">
        <h3 className="text-lg font-semibold text-white">Playbooks</h3>
        <p className="mt-2 text-sm text-slate-300">
          Workspace ID: <span className="break-all text-cyan-200">{workspaceId}</span>
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {(Object.keys(PLAYBOOK_CATALOG) as AutomationPlaybookName[]).map(
            (playbook) => {
              const details = PLAYBOOK_CATALOG[playbook];
              const enabled = enabledByPlaybook[playbook];
              const updating = Boolean(isUpdating[playbook]);

              return (
                <article
                  key={playbook}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {details.title}
                      </h4>
                      <p className="mt-2 text-sm text-slate-300">
                        {details.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      role="switch"
                      aria-checked={enabled}
                      aria-label={`Toggle ${details.title}`}
                      onClick={() => {
                        void togglePlaybook(playbook);
                      }}
                      disabled={updating || isLoading}
                      className={[
                        "relative inline-flex h-7 w-14 shrink-0 items-center rounded-full border transition",
                        enabled
                          ? "border-cyan-300 bg-cyan-400/80"
                          : "border-white/20 bg-slate-800",
                        updating ? "opacity-70" : "opacity-100"
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "inline-block h-5 w-5 transform rounded-full bg-white transition",
                          enabled ? "translate-x-7" : "translate-x-1"
                        ].join(" ")}
                      />
                    </button>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-200">
                    {details.steps.map((step) => (
                      <li key={step}>- {step}</li>
                    ))}
                  </ul>

                  <p className="mt-4 text-xs font-medium text-cyan-200">
                    {enabled ? "Enabled" : "Disabled"}
                  </p>
                </article>
              );
            }
          )}
        </div>
      </article>

      <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-lg font-semibold text-white">Automations running</h3>
        {runningPlaybooks.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-200">
            {runningPlaybooks.map((name) => (
              <li key={name}>- {name}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-300">No playbooks running.</p>
        )}
      </article>
    </section>
  );
}
