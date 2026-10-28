"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function StartPay({ linkId, needsAmount }: { linkId: string; needsAmount: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/links/${linkId}/payments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ amountZec: needsAmount ? form.get("amountZec") : null }),
    });
    const data = (await response.json()) as { error?: string; payment?: { id: string } };
    setBusy(false);
    if (!response.ok || !data.payment) {
      setError(data.error || "Could not start your payment.");
      return;
    }
    router.push(`/pay/${data.payment.id}`);
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      {needsAmount ? (
        <label>
          Amount in ZEC
          <input name="amountZec" required inputMode="decimal" placeholder="0.001" />
        </label>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Opening your payment" : "Pay"}
      </button>
    </form>
  );
}
