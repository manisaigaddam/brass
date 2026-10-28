import Link from "next/link";
import { notFound } from "next/navigation";
import { getLink } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function LinkDeskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getLink(id);
  if (!found) notFound();
  const { link, payments } = found;
  return (
    <main className="page">
      <h1>{link.title}</h1>
      <p className="lede">
        Share <Link href={`/l/${link.id}`}>{`/l/${link.id}`}</Link>
        {". "}
        {link.amountZatoshi ? `${zatoshiToZec(link.amountZatoshi)} ZEC.` : "The payer enters the amount."}{" "}
        {link.maxPayments ? `Limit ${link.maxPayments}.` : "No limit."}
      </p>
      <section className="panel">
        <h2>Payments</h2>
        <div className="list">
          {payments.length === 0 ? <p>No one has started a payment.</p> : null}
          {payments.map((payment) => (
            <Link key={payment.id} href={`/pay/${payment.id}`}>
              <span>{payment.amountZatoshi ? `${zatoshiToZec(payment.amountZatoshi)} ZEC` : payment.id}</span>
              <span>{payment.status}</span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
