"use client";

import { useEffect, useState } from "react";
import { ConnectNoir } from "./ConnectNoir";

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
  const [payer, setPayer] = useState<string | null>(null);

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
      const { getNoirWallet } = await import("@noir-wallet/sdk");
      const wallet = getNoirWallet();
      if (!wallet?.zcash || !payer) {
        throw new Error("Connect Noir first.");
      }
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
    <article className="invoice">
      <p className="inv-label">Invoice {payment.id.replace(/^bill_|^pay_/, "")}</p>
      <p className="inv-amount">{payment.amountZec ? `${payment.amountZec} ZEC` : "Open amount"}</p>
      <p className={`inv-due status status-${payment.status}`}>{words[payment.status]}</p>
      <dl className="inv-meta">
        <div>
          <dt>For</dt>
          <dd>{payment.title}</dd>
        </div>
        <div>
          <dt>Memo</dt>
          <dd>{payment.note || "—"}</dd>
        </div>
      </dl>
      <table className="inv-lines">
        <tbody>
          <tr>
            <td>{payment.title}</td>
            <td>{payment.amountZec ? `${payment.amountZec} ZEC` : "—"}</td>
          </tr>
          <tr className="total">
            <td>Total due</td>
            <td>{payment.amountZec ? `${payment.amountZec} ZEC` : "—"}</td>
          </tr>
        </tbody>
      </table>
      {payment.receivedZec !== "0" ? <p className="fine">Received {payment.receivedZec} ZEC</p> : null}
      {payable && qr ? (
        <div className="inv-pay">
          <div className="qr" dangerouslySetInnerHTML={{ __html: qr }} />
          <p className="fine">Scan the code, or connect Noir and pay here.</p>
          <ConnectNoir onAddress={setPayer} />
          <button className="button block" type="button" onClick={payWithNoir} disabled={busy || !payer}>
            {busy ? "Waiting for Noir" : payment.amountZec ? `Pay ${payment.amountZec} ZEC` : "Pay"}
          </button>
          <button className="button quiet block" type="button" onClick={() => copy(payment.address, "Address")}>
            {copied === "Address" ? "Copied" : "Copy address"}
          </button>
          <p className="mono">{payment.address}</p>
          {error ? <p className="error">{error}</p> : null}
        </div>
      ) : null}
      {payment.txid ? <p className="mono">{payment.txid}</p> : null}
      {payment.status === "paid" ? (
        <a className="button" href={`/receipt/${payment.id}`}>
          Receipt
        </a>
      ) : null}
    </article>
  );
}
