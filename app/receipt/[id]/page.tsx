import Link from "next/link";
import { notFound } from "next/navigation";
import { Mark } from "@/components/Mark";
import { getPayment } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

const words = {
  open: "Not paid yet",
  broadcast: "Broadcast, not confirmed here yet",
  partial: "Partial payment",
  paid: "Paid",
  expired: "Expired",
};

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payment = await getPayment(id);
  if (!payment) notFound();
  const merchant = process.env.MERCHANT_NAME?.trim() || "Brass";
  return (
    <main className="payer">
      <article className="receipt">
        <Mark />
        <p className="kicker">{merchant}</p>
        <h1>Receipt</h1>
        <p className={`status status-${payment.status}`}>{words[payment.status]}</p>
        <p className="amount">{payment.amountZatoshi ? `${zatoshiToZec(payment.amountZatoshi)} ZEC` : "Open amount"}</p>
        <p>{payment.title}</p>
        {payment.note ? <p className="note">{payment.note}</p> : null}
        <p className="fine">Seen {zatoshiToZec(payment.receivedZatoshi)} ZEC</p>
        {payment.paidAt ? <p className="fine">Paid {payment.paidAt}</p> : null}
        {payment.txid ? <p className="mono">{payment.txid}</p> : null}
        <p className="fine">This receipt is Brass’s record of the payment. The ZEC is in the merchant wallet.</p>
        <Link href={`/pay/${payment.id}`}>Back to the payment</Link>
      </article>
    </main>
  );
}
