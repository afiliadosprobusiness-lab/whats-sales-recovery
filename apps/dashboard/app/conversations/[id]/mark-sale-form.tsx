"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
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
    <form className="sale-form" onSubmit={onSubmit}>
      <label className="field">
        <span>Amount</span>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          required
        />
      </label>

      <label className="field">
        <span>Currency</span>
        <input
          type="text"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          maxLength={3}
          required
        />
      </label>

      <button type="submit" className="button" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : "Mark sale recovered"}
      </button>

      {error ? <p className="error-text">{error}</p> : null}
      {success ? <p className="success-text">{success}</p> : null}
    </form>
  );
}
