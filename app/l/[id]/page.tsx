import { notFound } from "next/navigation";
import { Mark } from "@/components/Mark";
import { StartPay } from "@/components/StartPay";
import { getLink } from "@/lib/checkout";
import { zatoshiToZec } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function PublicLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const found = await getLink(id);
  if (!found) notFound();
  const { link } = found;
  const merchant = process.env.MERCHANT_NAME?.trim() || "Brass";
  return (
    <main className="payer">
      <section className="receipt">
        <Mark />
        <p className="kicker">{merchant}</p>
        <h1>{link.title}</h1>
        {link.note ? <p className="note">{link.note}</p> : null}
        <p className="amount">{link.amountZatoshi ? `${zatoshiToZec(link.amountZatoshi)} ZEC` : "You choose"}</p>
        <p className="fine">Pay opens a payment that is only yours. The next person gets a different one.</p>
        {link.active ? <StartPay linkId={link.id} needsAmount={!link.amountZatoshi} /> : <p>This link is paused.</p>}
      </section>
    </main>
  );
}
