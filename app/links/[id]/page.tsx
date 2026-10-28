import Link from "next/link";
import { notFound } from "next/navigation";
import { Mark } from "@/components/Mark";
import { getLink } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function LinkDeskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getLink(id);
  if (!found) notFound();
  const { link, payments } = found;
  return (
    <main className="desk">
      <Link className="brand" href="/">
        <Mark />
        <strong>Brass</strong>
      </Link>
      <h1>{link.title}</h1>
      <p className="lede">
        Public link: <a href={`/l/${link.id}`}>{`/l/${link.id}`}</a>
      </p>
      <p className="lede">
        {link.amountZatoshi ? `${zatoshiToZec(link.amountZatoshi)} ZEC` : "The payer chooses the amount"}.{" "}
        {link.maxPayments ? `Cap ${link.maxPayments}.` : "No cap."}
      </p>
      <section className="panel">
        <h2>Payments</h2>
        <div className="list">
          {payments.length === 0 ? <p>Nobody has opened a payment yet.</p> : null}
          {payments.map((payment) => (
            <Link key={payment.id} href={`/pay/${payment.id}`}>
              <span>{payment.id}</span>
              <span>
                {payment.amountZatoshi ? `${zatoshiToZec(payment.amountZatoshi)} ZEC` : ""} · {payment.status}
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
