"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateBillForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/bills", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: form.get("title"),
        amountZec: form.get("amountZec"),
        note: form.get("note"),
        expiresInHours: Number(form.get("expiresInHours") || 24),
      }),
    });
    const data = (await response.json()) as { error?: string; payment?: { id: string } };
    setBusy(false);
    if (!response.ok || !data.payment) {
      setError(data.error || "Could not create the bill.");
      return;
    }
    router.push(`/bills/${data.payment.id}`);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        What is this for
        <input name="title" required placeholder="Table 4" />
      </label>
      <label>
        Amount in ZEC
        <input name="amountZec" required inputMode="decimal" placeholder="0.001" />
      </label>
      <label>
        Note the payer can read
        <textarea name="note" rows={3} placeholder="Dinner, 28 Oct" />
      </label>
      <label>
        Hours before it expires
        <input name="expiresInHours" type="number" min={1} defaultValue={24} />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Creating" : "Create bill"}
      </button>
    </form>
  );
}
