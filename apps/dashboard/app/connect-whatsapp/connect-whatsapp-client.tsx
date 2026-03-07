"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createWorkspace,
  getDefaultWorkspaceId,
  getStoredWorkspaceId,
  getWhatsappSessionStatusByWorkspace,
  saveWorkspaceId,
  startWhatsappSessionByWorkspace
} from "@/lib/api";

const POLL_INTERVAL_MS = 3000;

export function ConnectWhatsappClient(): JSX.Element {
  const defaultWorkspaceId = useMemo(() => getDefaultWorkspaceId(), []);
  const [businessName, setBusinessName] = useState("");
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);
  const [qr, setQr] = useState("");
  const [connected, setConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

    void getWhatsappSessionStatusByWorkspace({ workspaceId })
      .then((response) => {
        if (isCancelled) {
          return;
        }

        setConnected(response.connected);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }

        setConnected(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId || connected || !isPolling) {
      return;
    }

    let isCancelled = false;

    const intervalId = window.setInterval(() => {
      void getWhatsappSessionStatusByWorkspace({ workspaceId })
        .then((response) => {
          if (isCancelled) {
            return;
          }

          if (response.connected) {
            setConnected(true);
            setIsPolling(false);
            setQr("");
          }
        })
        .catch(() => {
          if (isCancelled) {
            return;
          }

          setError("Could not refresh session status.");
          setIsPolling(false);
        });
    }, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [connected, isPolling, workspaceId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setConnected(false);
    setIsSubmitting(true);

    try {
      let nextWorkspaceId = workspaceId;

      if (!nextWorkspaceId) {
        const trimmedName = businessName.trim();
        if (!trimmedName) {
          throw new Error("Business name is required.");
        }

        const created = await createWorkspace({ name: trimmedName });
        nextWorkspaceId = created.workspaceId;
        setWorkspaceId(nextWorkspaceId);
        saveWorkspaceId(nextWorkspaceId);
      }

      const session = await startWhatsappSessionByWorkspace({
        workspaceId: nextWorkspaceId
      });
      setQr(session.qr);

      const status = await getWhatsappSessionStatusByWorkspace({
        workspaceId: nextWorkspaceId
      });
      setConnected(status.connected);
      setIsPolling(!status.connected);
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not connect WhatsApp.";
      setError(message);
      setIsPolling(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const showBusinessNameInput = !workspaceId;

  return (
    <section className="page">
      <header className="page-header">
        <h1 className="page-title">Connect WhatsApp</h1>
        <p className="muted">
          Create your workspace and scan the QR code to connect your WhatsApp.
        </p>
      </header>

      <article className="panel connect-flow">
        <form className="sale-form" onSubmit={onSubmit}>
          {showBusinessNameInput ? (
            <label className="field">
              <span>Business name</span>
              <input
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Business Name"
                maxLength={120}
                required
              />
            </label>
          ) : (
            <p className="muted">Workspace ID: {workspaceId}</p>
          )}

          <button type="submit" className="button" disabled={isSubmitting}>
            {isSubmitting ? "Connecting..." : "Connect WhatsApp"}
          </button>

          {error ? <p className="error-text">{error}</p> : null}
        </form>

        {connected ? (
          <p className="success-text">WhatsApp session connected.</p>
        ) : null}

        {!connected && qr ? (
          <div className="qr-wrap">
            <p className="muted">Scan this QR with WhatsApp on your phone.</p>
            <pre className="qr-box">{qr}</pre>
          </div>
        ) : null}

        {!connected && !qr && isPolling ? (
          <p className="muted">Waiting for QR code. Please keep this page open.</p>
        ) : null}
      </article>
    </section>
  );
}
