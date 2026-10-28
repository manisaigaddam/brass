import { notFound } from "next/navigation";
import { StartPay } from "@/components/StartPay";
import { getLink } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PublicLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getLink(id);
  if (!found) notFound();
  const { link } = found;
  return (
    <main className="page">
      <section className="panel" style={{ maxWidth: 480 }}>
        <p className="kicker">Invoice</p>
        <h1>{link.title}</h1>
        {link.note ? <p className="note">{link.note}</p> : null}
        <p className="amount">{link.amountZatoshi ? `${zatoshiToZec(link.amountZatoshi)} ZEC` : "Enter an amount"}</p>
        <p className="fine">This opens an invoice that only you can pay.</p>
        {link.active ? <StartPay linkId={link.id} needsAmount={!link.amountZatoshi} /> : <p>This link is paused.</p>}
      </section>
    </main>
  );
}
