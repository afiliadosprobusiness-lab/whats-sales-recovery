"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getAutomationPlaybooks,
  getDefaultWorkspaceId,
  getStoredWorkspaceId,
  type AutomationPlaybookName
} from "@/lib/api";

const PLAYBOOK_LABELS: Record<AutomationPlaybookName, string> = {
  sales_recovery: "Sales Recovery Playbook"
};

export function AutomationsStatusCard(): JSX.Element {
  const defaultWorkspaceId = useMemo(() => getDefaultWorkspaceId(), []);
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);
  const [running, setRunning] = useState<AutomationPlaybookName[]>([]);
  const [loading, setLoading] = useState(false);

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
    setLoading(true);

    void getAutomationPlaybooks({ workspaceId })
      .then((response) => {
        if (!isCancelled) {
          setRunning(response.running);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setRunning([]);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [workspaceId]);

  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-lg font-semibold text-white">Automations running</h3>

      {!workspaceId ? (
        <p className="mt-2 text-sm text-slate-300">
          Connect WhatsApp to create a workspace and enable playbooks.
        </p>
      ) : null}

      {workspaceId && loading ? (
        <p className="mt-2 text-sm text-slate-300">Loading playbook status...</p>
      ) : null}

      {workspaceId && !loading && running.length === 0 ? (
        <p className="mt-2 text-sm text-slate-300">No playbooks running.</p>
      ) : null}

      {workspaceId && !loading && running.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-200">
          {running.map((playbook) => (
            <li key={playbook}>- {PLAYBOOK_LABELS[playbook]}</li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
