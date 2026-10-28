"use client";

import { useEffect, useState } from "react";

type View = {
  id: string;
  title: string;
  note: string;
  amountZec: string | null;
  receivedZec: string;
  address: string;
  sharedAddress: boolean;
  memo: string;
  status: "open" | "broadcast" | "partial" | "paid" | "expired";
  txid: string | null;
  merchantName: string;
};

const words: Record<View["status"], string> = {
  open: "Waiting for payment",
  broadcast: "Broadcast. Waiting to see it arrive.",
  partial: "Partial payment",
  paid: "Paid",
  expired: "Expired",
};

export function PayBox({ initial, uri, qr }: { initial: View; uri: string; qr: string }) {
  const [payment, setPayment] = useState(initial);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");

  useEffect(() => {
    if (payment.status === "paid" || payment.status === "expired") return;
    const timer = setInterval(async () => {
      const response = await fetch(`/api/payments/${payment.id}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { payment: View };
      setPayment(data.payment);
    }, 6000);
    return () => clearInterval(timer);
  }, [payment.id, payment.status]);

  async function copy(value: string, label: string) {
    await navigator.clipboard.writeText(value);
    setCopied(label);
  }

  async function payWithNoir() {
    setBusy(true);
    setError("");
    try {
      const { detectProvider, getNoirWallet } = await import("@noir-wallet/sdk");
      const start = Date.now();
      void detectProvider(4000).catch(() => null);
      let wallet = getNoirWallet();
      while (!wallet?.zcash && Date.now() - start < 4000) {
        await new Promise((resolve) => setTimeout(resolve, 120));
        wallet = getNoirWallet();
      }
      if (!wallet?.zcash) {
        throw new Error("Noir was not detected. Install or open the Noir extension in Chrome, then reload this page.");
      }
      const existing = await wallet.zcash.getAccounts();
      if (!existing) await wallet.zcash.connect();
      if (!payment.amountZec) throw new Error("This payment has no amount.");
      const txid = await wallet.zcash.sendTransaction({
        to: payment.address,
        amount: payment.amountZec,
        memo: payment.memo,
        fundingSource: "shielded",
      });
      const response = await fetch(`/api/payments/${payment.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "broadcast", txid }),
      });
      const data = (await response.json()) as { error?: string; payment?: View };
      if (!response.ok || !data.payment) throw new Error(data.error || "The send was not recorded.");
      setPayment(data.payment);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Noir did not send.");
    } finally {
      setBusy(false);
    }
  }

  const payable = payment.status === "open" || payment.status === "partial" || payment.status === "broadcast";

  return (
    <section className="receipt">
      <p className="kicker">{payment.merchantName}</p>
      <h1>{payment.title}</h1>
      {payment.note ? <p className="note">{payment.note}</p> : null}
      <p className={`status status-${payment.status}`}>{words[payment.status]}</p>
      <p className="amount">{payment.amountZec ? `${payment.amountZec} ZEC` : "Amount open"}</p>
      {payment.receivedZec !== "0" ? <p className="fine">Seen: {payment.receivedZec} ZEC</p> : null}
      {payable && qr ? (
        <>
          <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="fine">Scan with Zodl, Zashi, YWallet, or Zingo. The QR is one ZIP-321 request.</p>
          <div className="row">
            <button className="button" type="button" onClick={payWithNoir} disabled={busy}>
              {busy ? "Waiting for Noir" : "Pay with Noir"}
            </button>
            <button className="button quiet" type="button" onClick={() => copy(payment.address, "Address")}>
              {copied === "Address" ? "Copied" : "Copy address"}
            </button>
            <button className="button quiet" type="button" onClick={() => copy(uri, "Link")}>
              {copied === "Link" ? "Copied" : "Copy wallet request"}
            </button>
          </div>
          <p className="mono">{payment.address}</p>
          <p className="fine">Memo: {payment.memo}</p>
          {payment.sharedAddress ? (
            <p className="fine">
              This checkout is using one shared address, so Brass cannot see the payment on its own. Start the watcher
              to give this bill its own address and to mark it paid when the note arrives.
            </p>
          ) : (
            <p className="fine">This page marks itself paid when the watcher sees the note. Leave it open.</p>
          )}
        </>
      ) : null}
      {payment.txid ? <p className="mono">txid {payment.txid}</p> : null}
      {payment.status === "paid" ? (
        <a className="button" href={`/receipt/${payment.id}`}>
          Open receipt
        </a>
      ) : null}
      {error ? <p className="error">{error}</p> : null}
    </section>
  );
}
