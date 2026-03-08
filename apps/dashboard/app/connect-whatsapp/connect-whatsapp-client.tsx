"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  createWorkspace,
  disconnectWhatsappSessionByWorkspace,
  getDefaultWorkspaceId,
  getStoredWorkspaceId,
  getWhatsappSessionStatusByWorkspace,
  saveWorkspaceId,
  startWhatsappSessionByWorkspace
} from "@/lib/api";

const POLL_INTERVAL_MS = 3000;

type ConnectionUiStatus = "disconnected" | "waiting_qr_scan" | "connected";

export function ConnectWhatsappClient(): JSX.Element {
  const defaultWorkspaceId = useMemo(() => getDefaultWorkspaceId(), []);
  const [businessName, setBusinessName] = useState("");
  const [workspaceId, setWorkspaceId] = useState(defaultWorkspaceId);
  const [qr, setQr] = useState("");
  const [connected, setConnected] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    void getWhatsappSessionStatusByWorkspace({ workspaceId })
      .then((response) => {
        if (!isCancelled) {
          setConnected(response.connected);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setConnected(false);
        }
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
          if (!isCancelled) {
            setError("Could not refresh session status.");
            setIsPolling(false);
          }
        });
    }, POLL_INTERVAL_MS);

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [connected, isPolling, workspaceId]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    await connectWhatsapp();
  }

  async function connectWhatsapp(): Promise<void> {
    setError(null);
    setSuccessMessage(null);
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

      const isNowConnected = await startAndSyncSession({
        workspaceId: nextWorkspaceId
      });
      if (isNowConnected) {
        setSuccessMessage("WhatsApp connected successfully.");
      }
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

  async function startAndSyncSession(input: {
    workspaceId: string;
  }): Promise<boolean> {
    const session = await startWhatsappSessionByWorkspace({
      workspaceId: input.workspaceId
    });
    setQr(session.qr);

    const status = await getWhatsappSessionStatusByWorkspace({
      workspaceId: input.workspaceId
    });
    setConnected(status.connected);
    setIsPolling(!status.connected);

    return status.connected;
  }

  async function disconnectWhatsapp(): Promise<void> {
    if (!workspaceId) {
      return;
    }

    const shouldDisconnect = window.confirm(
      "Are you sure you want to disconnect this WhatsApp session?"
    );
    if (!shouldDisconnect) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsDisconnecting(true);

    try {
      await disconnectWhatsappSessionByWorkspace({ workspaceId });
      setConnected(false);
      setQr("");
      setIsPolling(false);
      setSuccessMessage("WhatsApp session disconnected successfully.");
    } catch (disconnectError) {
      const message =
        disconnectError instanceof Error
          ? disconnectError.message
          : "Could not disconnect WhatsApp.";
      setError(message);
    } finally {
      setIsDisconnecting(false);
    }
  }

  async function reconnectWhatsapp(): Promise<void> {
    if (!workspaceId) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);
    setIsDisconnecting(true);

    try {
      await disconnectWhatsappSessionByWorkspace({ workspaceId });
      setConnected(false);
      setQr("");
      setIsPolling(false);

      const isNowConnected = await startAndSyncSession({
        workspaceId
      });

      setSuccessMessage(
        isNowConnected
          ? "WhatsApp reconnected successfully."
          : "WhatsApp reconnection started. Scan the QR code."
      );
    } catch (reconnectError) {
      const message =
        reconnectError instanceof Error
          ? reconnectError.message
          : "Could not reconnect WhatsApp.";
      setError(message);
      setIsPolling(false);
    } finally {
      setIsSubmitting(false);
      setIsDisconnecting(false);
    }
  }

  const showBusinessNameInput = !workspaceId;
  const isBusy = isSubmitting || isDisconnecting;
  const connectionStatus: ConnectionUiStatus = connected
    ? "connected"
    : qr || isPolling || isSubmitting
      ? "waiting_qr_scan"
      : "disconnected";

  const connectionStatusCopy =
    connectionStatus === "connected"
      ? "Connected"
      : connectionStatus === "waiting_qr_scan"
        ? "Waiting for QR scan"
        : "Disconnected";

  return (
    <section className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-3xl font-semibold text-white">Connect WhatsApp</h2>
        <p className="mt-2 text-sm text-slate-300">
          Start your business session, scan the QR code, and activate real-time
          conversation recovery.
        </p>
      </header>

      <article className="grid gap-6 rounded-2xl border border-white/10 bg-slate-900/50 p-6 lg:grid-cols-[1fr_1fr]">
        <form className="space-y-4" onSubmit={onSubmit}>
          {showBusinessNameInput ? (
            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Business name</span>
              <input
                type="text"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Business Name"
                maxLength={120}
                required
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70"
              />
            </label>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm text-slate-300">
              Workspace ID
              <p className="mt-1 break-all text-cyan-200">{workspaceId}</p>
            </div>
          )}

          {!connected ? (
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
              disabled={isBusy}
            >
              {isSubmitting ? "Connecting..." : "Connect WhatsApp"}
            </button>
          ) : (
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  void disconnectWhatsapp();
                }}
                className="rounded-xl bg-gradient-to-r from-rose-400 to-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
                disabled={isBusy}
              >
                {isDisconnecting ? "Disconnecting..." : "Disconnect WhatsApp"}
              </button>
              <button
                type="button"
                onClick={() => {
                  void reconnectWhatsapp();
                }}
                className="rounded-xl border border-white/20 bg-white/[0.02] px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:opacity-60"
                disabled={isBusy}
              >
                {isSubmitting ? "Reconnecting..." : "Reconnect WhatsApp"}
              </button>
            </div>
          )}

          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2 text-sm text-slate-300">
            Connection status:{" "}
            <span
              className={
                connectionStatus === "connected"
                  ? "font-semibold text-emerald-200"
                  : connectionStatus === "waiting_qr_scan"
                    ? "font-semibold text-amber-200"
                    : "font-semibold text-rose-200"
              }
            >
              {connectionStatusCopy}
            </span>
          </div>

          {error ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
              {error}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {successMessage}
            </p>
          ) : null}
        </form>

        <div className="rounded-2xl border border-dashed border-white/15 bg-slate-950/50 p-5">
          {!connected && qr ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-300">
                Scan this QR with your WhatsApp mobile app.
              </p>
              <div className="inline-flex rounded-xl border border-white/10 bg-white p-2">
                <QRCodeSVG key={qr} value={qr} size={240} includeMargin level="M" />
              </div>
            </div>
          ) : null}

          {!connected && !qr && isPolling ? (
            <p className="text-sm text-slate-300">
              Waiting for QR code. Keep this page open.
            </p>
          ) : null}

          {connected ? (
            <p className="text-sm text-emerald-200">
              Session is active. You can now operate the recovery flow.
            </p>
          ) : null}
        </div>
      </article>
    </section>
  );
}
