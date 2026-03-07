"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { postMarkSaleRecovered } from "@/lib/api";

type MarkSaleFormProps = {
  recoveryId: string;
};

export function MarkSaleForm({ recoveryId }: MarkSaleFormProps): JSX.Element {
  const router = useRouter();
  const [amount, setAmount] = useState("0");
  const [currency, setCurrency] = useState("PEN");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setIsSubmitting(true);

    try {
      await postMarkSaleRecovered({
        recoveryId,
        amount: parsedAmount,
        currency: currency.toUpperCase()
      });

      setSuccess("Recovered sale saved.");
      router.refresh();
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Could not save recovered sale.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={onSubmit}>
      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-slate-400">Amount</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/70"
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs uppercase tracking-wide text-slate-400">Currency</span>
        <input
          type="text"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          maxLength={3}
          required
          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400/70"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Mark sale recovered"}
      </button>

      {error ? (
        <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {success}
        </p>
      ) : null}
    </form>
  );
}
