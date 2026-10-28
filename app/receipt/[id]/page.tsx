import Link from "next/link";
import { notFound } from "next/navigation";
import { getPayment } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

const words = {
  open: "Not paid yet",
  broadcast: "Sent, waiting to be seen",
  partial: "Partial payment",
  paid: "Paid",
  expired: "Expired",
};

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPayment(id);
  if (!payment) notFound();
  return (
    <main className="page">
      <article className="panel" style={{ maxWidth: 480 }}>
        <p className="kicker">Receipt</p>
        <h1>{payment.title}</h1>
        <p className={`status status-${payment.status}`}>{words[payment.status]}</p>
        <p className="amount">{payment.amountZatoshi ? `${zatoshiToZec(payment.amountZatoshi)} ZEC` : "Open amount"}</p>
        {payment.note ? <p className="note">{payment.note}</p> : null}
        <p className="fine">Received {zatoshiToZec(payment.receivedZatoshi)} ZEC</p>
        {payment.paidAt ? <p className="fine">{payment.paidAt}</p> : null}
        {payment.txid ? <p className="mono">{payment.txid}</p> : null}
        <Link href={`/pay/${payment.id}`}>Back to the payment</Link>
      </article>
    </main>
  );
}
