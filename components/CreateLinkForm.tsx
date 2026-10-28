"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateLinkForm({ merchantId }: { merchantId: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const amount = String(form.get("amountZec") || "").trim();
    const cap = String(form.get("maxPayments") || "").trim();
    const response = await fetch("/api/links", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        merchantId,
        title: form.get("title"),
        note: form.get("note"),
        amountZec: amount || null,
        maxPayments: cap ? Number(cap) : null,
      }),
    });
    const data = (await response.json()) as { error?: string; link?: { id: string } };
    setBusy(false);
    if (!response.ok || !data.link) {
      setError(data.error || "Could not create the pay link.");
      return;
    }
    router.push(`/links/${data.link.id}`);
    router.refresh();
  }

  return (
    <form className="form" onSubmit={onSubmit}>
      <label>
        What is for sale
        <input name="title" required placeholder="Coffee" />
      </label>
      <label>
        Amount in ZEC
        <input name="amountZec" inputMode="decimal" placeholder="Leave empty and the payer types it" />
      </label>
      <label>
        Note
        <textarea name="note" rows={3} placeholder="Espresso" />
      </label>
      <label>
        Maximum payments
        <input name="maxPayments" type="number" min={1} placeholder="Leave empty for no cap" />
      </label>
      {error ? <p className="error">{error}</p> : null}
      <button className="button" type="submit" disabled={busy}>
        {busy ? "Creating" : "Create pay link"}
      </button>
    </form>
  );
}
