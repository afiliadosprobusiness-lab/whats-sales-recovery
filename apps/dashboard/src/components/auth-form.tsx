"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

type AuthMode = "register" | "login";

type AuthFormProps = {
  mode: AuthMode;
};

type AuthResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export function AuthForm({ mode }: AuthFormProps): JSX.Element {
  const router = useRouter();
  const isRegisterMode = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const title = useMemo(
    () => (isRegisterMode ? "Create your account" : "Welcome back"),
    [isRegisterMode]
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name,
        email,
        password
      };

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const body = (await response.json()) as
        | AuthResponse
        | { error?: string; message?: string };

      if (!response.ok || !("token" in body)) {
        const errorBody = body as { error?: string; message?: string };
        const fallbackMessage = isRegisterMode
          ? "Could not create account"
          : "Could not sign in";
        setErrorMessage(errorBody.error ?? errorBody.message ?? fallbackMessage);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorMessage("Unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-12 sm:px-6">
      <div className="grid w-full overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-glow md:grid-cols-[1.1fr_1fr]">
        <article className="hidden border-r border-white/10 bg-gradient-to-br from-cyan-500/20 via-blue-600/20 to-slate-900 p-10 md:block">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200">RecuperaVentas</p>
          <h1 className="mt-4 text-4xl font-semibold text-white">
            Convert WhatsApp chats into recovered revenue.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-200/85">
            Sign in to manage conversations, trigger recovery campaigns, and track
            conversion analytics from one panel.
          </p>
        </article>

        <article className="p-6 sm:p-10">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-300">SaaS access</p>
          <h2 className="mt-3 text-3xl font-semibold text-white">{title}</h2>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            {isRegisterMode ? (
              <label className="block space-y-2">
                <span className="text-sm text-slate-300">Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70"
                  placeholder="Ken Ramirez"
                  required
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70"
                placeholder="you@business.com"
                required
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm text-slate-300">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/70"
                placeholder="At least 8 characters"
                minLength={8}
                required
              />
            </label>

            {errorMessage ? (
              <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-65"
            >
              {isSubmitting
                ? "Please wait..."
                : isRegisterMode
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-5 text-sm text-slate-400">
            {isRegisterMode ? "Already have an account?" : "Need an account?"}{" "}
            <Link
              href={isRegisterMode ? "/login" : "/register"}
              className="font-medium text-cyan-300 hover:text-cyan-200"
            >
              {isRegisterMode ? "Sign in" : "Create one"}
            </Link>
          </p>
        </article>
      </div>
    </section>
  );
}
